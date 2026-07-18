"""System Info — ATM Equipment System master data.

This DocType represents an ATM system (e.g., AMS, ATC, Surveillance),
storing key metadata and linking to assets, tickets, and repairs.
"""

import frappe
from frappe.model.document import Document


class SystemInfo(Document):
    """Represents an ATM equipment system."""

    def validate(self):
        """Validate system_code uniqueness and required fields."""
        self.validate_system_code()

    def validate_system_code(self):
        """Ensure system_code is not empty and unique."""
        if not self.system_code:
            frappe.throw("System Code is required.")
        exists = frappe.db.exists(
            "System Info",
            {"system_code": self.system_code, "name": ("!=", self.name)},
        )
        if exists:
            frappe.throw(
                f"System Info with code '{self.system_code}' already exists."
            )

    def before_save(self):
        """Normalize data before saving."""
        pass
