"""Setup hooks for equipment_logbook."""

import frappe

ROLES = [
    {"role": "System Manager"},
    {"role": "Administrator"},
    {"role": "Desk User"},
]

PAGES = [
    {
        "doctype": "Page",
        "name": "equipment-dashboard",
        "page_name": "equipment-dashboard",
        "title": "Bảng Điều Khiển ATM",
        "icon": "bar-chart",
        "module": "Equipment Logbook",
        "standard": "Yes",
        "system_page": 0,
        "roles": ROLES,
    },
    {
        "doctype": "Page",
        "name": "system-logbook",
        "page_name": "system-logbook",
        "title": "Sổ Lý Lịch Hệ Thống",
        "icon": "monitor",
        "module": "Equipment Logbook",
        "standard": "Yes",
        "system_page": 0,
        "roles": ROLES,
    },
]


def after_install():
    """Create desk pages and required initial records."""
    for p in PAGES:
        if not frappe.db.exists("Page", p["name"]):
            frappe.get_doc(p).insert(ignore_permissions=True)
