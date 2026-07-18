"""System Position — Child table for System Info.

Represents functional positions/nodes within an ATM system
(e.g., Controller Position, Radar Head, Radio Transceiver).
"""

import frappe
from frappe.model.document import Document


class SystemPosition(Document):
    """Child table row representing a functional position in a system."""

    def validate(self):
        """Validate position_code."""
        if not self.position_code:
            frappe.throw("Position Code is required.")
