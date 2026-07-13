"""Equipment Logbook — Aggregation API for ATM Technical Center.

All methods are @frappe.whitelist() endpoints consumed by the desk custom pages.
Data is pulled in real time from ERPNext (Asset, Asset Movement, Asset Maintenance,
Asset Repair) and Helpdesk (HD Ticket), joined through custom_system_info and
custom_system_position link fields.
"""

from __future__ import annotations

import frappe
from frappe import _
from frappe.utils import getdate, nowdate


# ---------------------------------------------------------------------------
# Permission guard for desk page access
# ---------------------------------------------------------------------------


def has_app_permission() -> bool:
    """Allow access for Desk User and System Manager."""
    allowed_roles = {"Desk User", "System Manager"}
    user_roles = frappe.get_roles(frappe.session.user)
    return bool(allowed_roles.intersection(user_roles))


def check_app_permission():
    """Throw 403 Forbidden if user lacks necessary roles."""
    if not has_app_permission():
        frappe.throw(
            _("Bạn không có quyền truy cập Sổ lý lịch thiết bị!"),
            frappe.PermissionError,
        )


# ---------------------------------------------------------------------------
# Dashboard — Executive view
# ---------------------------------------------------------------------------


@frappe.whitelist()
def get_executive_dashboard_data(company: str | None = None) -> dict:
    """Return KPIs and chart data for the executive dashboard."""
    check_app_permission()

    asset_filters = {
        "status": ("in", ["Submitted", "Partially Depreciated"]),
        "docstatus": 1,
    }
    repair_filters = {
        "failure_date": (">=", getdate(nowdate()).replace(month=1, day=1)),
        "docstatus": 1,
    }
    ticket_filters = {"status": ("not in", ["Resolved", "Closed"])}

    if company:
        asset_filters["company"] = company
        repair_filters["company"] = company
        if frappe.db.has_column("HD Ticket", "company"):
            ticket_filters["company"] = company

    return {
        "kpi": {
            "total_systems": frappe.db.count(
                "System Info",
                {"company": company}
                if company and frappe.db.has_column("System Info", "company")
                else {},
            ),
            "active_assets": frappe.db.count("Asset", asset_filters),
            "ytd_repairs": frappe.db.count("Asset Repair", repair_filters),
            "open_tickets": frappe.db.count("HD Ticket", ticket_filters),
        },
        "charts": {
            "repairs_by_system": _repairs_by_system(company),
            "incidents_by_system": _incidents_by_system(company),
            "standby_vs_active": _asset_status_breakdown(company),
        },
    }


# ---------------------------------------------------------------------------
# Systems overview list
# ---------------------------------------------------------------------------


@frappe.whitelist()
def get_systems_overview_list() -> list[dict]:
    """Return every System Info record enriched with child counts and health."""
    check_app_permission()

    systems = frappe.db.get_all(
        "System Info",
        fields=[
            "name", "system_code", "system_name", "status", "criticality",
            "location", "department",
        ],
        order_by="system_code",
    )
    if not systems:
        return []

    names = [s.name for s in systems]

    asset_rows = frappe.db.sql(
        """
        SELECT custom_system_info, COUNT(*) AS cnt
        FROM `tabAsset`
        WHERE custom_system_info IN %(names)s AND docstatus = 1
        GROUP BY custom_system_info
        """,
        {"names": names},
        as_dict=True,
    )
    ticket_rows = frappe.db.sql(
        """
        SELECT custom_system_info, COUNT(*) AS cnt
        FROM `tabHD Ticket`
        WHERE custom_system_info IN %(names)s
          AND status NOT IN ('Resolved', 'Closed')
        GROUP BY custom_system_info
        """,
        {"names": names},
        as_dict=True,
    )

    a_map = {r.custom_system_info: r.cnt for r in asset_rows}
    t_map = {r.custom_system_info: r.cnt for r in ticket_rows}

    for s in systems:
        s["asset_count"] = a_map.get(s.name, 0)
        s["open_ticket_count"] = t_map.get(s.name, 0)
        s["health"] = _derive_health(s["status"], s["asset_count"], s["open_ticket_count"])
    return systems


# ---------------------------------------------------------------------------
# System logbook detail — 6 datasets
# ---------------------------------------------------------------------------


@frappe.whitelist()
def get_system_logbook_detail(system_info: str) -> dict:
    """Return a comprehensive payload for a single System Info record."""
    check_app_permission()

    if not frappe.db.exists("System Info", system_info):
        frappe.throw(_("System Info {0} not found").format(system_info))

    return {
        "general": _get_general_info(system_info),
        "assets": _get_assets(system_info),
        "movements": _get_asset_movements(system_info),
        "maintenance": _get_maintenance_logs(system_info),
        "repairs": _get_repairs(system_info),
        "incidents": _get_incidents(system_info),
    }


# =====================================================================
# Internal helpers — KPI / charts
# =====================================================================


def _repairs_by_system(company: str | None = None) -> list[dict]:
    condition = "AND a.company = %(company)s" if company else ""
    return frappe.db.sql(
        f"""
        SELECT si.system_name AS label, COUNT(ar.name) AS count
        FROM `tabAsset Repair` ar
        JOIN `tabAsset` a ON a.name = ar.asset
        JOIN `tabSystem Info` si ON si.name = a.custom_system_info
        WHERE ar.docstatus = 1 {condition}
        GROUP BY si.name ORDER BY count DESC
        """,
        {"company": company},
        as_dict=True,
    )


def _incidents_by_system(company: str | None = None) -> list[dict]:
    has_company = company and frappe.db.has_column("HD Ticket", "company")
    condition = "AND ht.company = %(company)s" if has_company else ""
    return frappe.db.sql(
        f"""
        SELECT si.system_name AS label, COUNT(ht.name) AS count
        FROM `tabHD Ticket` ht
        JOIN `tabSystem Info` si ON si.name = ht.custom_system_info
        WHERE ht.custom_system_info IS NOT NULL {condition}
        GROUP BY si.name ORDER BY count DESC
        """,
        {"company": company},
        as_dict=True,
    )


def _asset_status_breakdown(company: str | None = None) -> list[dict]:
    condition = "AND company = %(company)s" if company else ""
    return frappe.db.sql(
        f"""
        SELECT status, COUNT(*) AS count
        FROM `tabAsset`
        WHERE status IS NOT NULL AND docstatus = 1 {condition}
        GROUP BY status
        """,
        {"company": company},
        as_dict=True,
    )


# =====================================================================
# Internal helpers — System logbook detail
# =====================================================================


def _get_general_info(system_info: str) -> dict:
    si = frappe.get_doc("System Info", system_info)

    has_pos_col = frappe.db.has_column("Asset", "custom_system_position")
    active_assets = []
    asset_map = {}

    if has_pos_col:
        active_assets = frappe.db.get_all(
            "Asset",
            filters={
                "custom_system_info": system_info,
                "custom_system_position": ("!=", ""),
                "docstatus": 1,
            },
            fields=["name", "asset_name", "status", "custom_system_position"],
        )
        asset_map = {a.custom_system_position: a for a in active_assets}

    positions = []
    for pos in si.get("positions", []):
        positions.append({
            "position_code": pos.position_code,
            "position_name": pos.position_name,
            "remarks": pos.remarks,
            "current_asset": asset_map.get(pos.position_code, {}),
        })

    return {
        "system_code": si.system_code,
        "system_name": si.system_name,
        "status": si.status,
        "criticality": si.criticality,
        "location": si.location,
        "department": si.department,
        "description": si.description,
        "positions": positions,
    }


def _get_assets(system_info: str) -> list[dict]:
    fields = [
        "name", "asset_name", "status", "location", "department", "purchase_date",
    ]
    if frappe.db.has_column("Asset", "custom_system_position"):
        fields.append("custom_system_position")
    return frappe.db.get_all(
        "Asset",
        filters={"custom_system_info": system_info, "docstatus": 1},
        fields=fields,
        order_by="asset_name",
    )


def _get_asset_movements(system_info: str) -> list[dict]:
    has_from_node = frappe.db.has_column("Asset Movement Item", "custom_source_position")
    has_to_node = frappe.db.has_column("Asset Movement Item", "custom_target_position")
    from_col = "ami.custom_source_position" if has_from_node else "NULL"
    to_col = "ami.custom_target_position" if has_to_node else "NULL"

    return frappe.db.sql(
        f"""
        SELECT
            ami.parent AS movement_name,
            ami.asset,
            a.asset_name,
            ami.source_location AS from_location,
            ami.target_location AS to_location,
            {from_col} AS from_node,
            {to_col} AS to_node
        FROM `tabAsset Movement Item` ami
        JOIN `tabAsset Movement` am ON am.name = ami.parent
        JOIN `tabAsset` a ON a.name = ami.asset
        WHERE a.custom_system_info = %(sys)s AND am.docstatus = 1
        ORDER BY am.transaction_date DESC
        """,
        {"sys": system_info},
        as_dict=True,
    )


def _get_maintenance_logs(system_info: str) -> list[dict]:
    return frappe.db.sql(
        """
        SELECT
            am.name AS maintenance_name,
            aml.maintenance_type,
            aml.maintenance_status,
            am.asset_name,
            aml.due_date AS maintenance_date,
            aml.completion_date,
            aml.name AS log_name,
            aml.description
        FROM `tabAsset Maintenance` am
        JOIN `tabAsset Maintenance Log` aml ON aml.asset_maintenance = am.name
        JOIN `tabAsset` a ON a.name = am.asset_name
        WHERE a.custom_system_info = %s AND am.docstatus = 1
        ORDER BY aml.due_date DESC
        """,
        (system_info,),
        as_dict=True,
    )


def _get_repairs(system_info: str) -> list[dict]:
    return frappe.db.sql(
        """
        SELECT ar.name, ar.asset, a.asset_name,
               ar.repair_status, ar.failure_date, ar.completion_date,
               ar.description, ar.repair_cost
        FROM `tabAsset Repair` ar
        JOIN `tabAsset` a ON a.name = ar.asset
        WHERE a.custom_system_info = %s AND ar.docstatus = 1
        ORDER BY ar.failure_date DESC
        """,
        (system_info,),
        as_dict=True,
    )


def _get_incidents(system_info: str) -> list[dict]:
    return frappe.db.get_all(
        "HD Ticket",
        filters={"custom_system_info": system_info},
        fields=["name", "subject", "status", "ticket_type", "creation", "modified"],
        order_by="creation desc",
    )


# =====================================================================
# Utilities
# =====================================================================


def _derive_health(status: str, asset_count: int, open_tickets: int) -> str:
    if status == "Decommissioned":
        return "decommissioned"
    if status == "Offline":
        return "offline"
    if open_tickets > 5:
        return "degraded"
    if asset_count == 0:
        return "unknown"
    if status == "Active":
        return "active"
    if status == "Maintenance":
        return "maintenance"
    return "unknown"
