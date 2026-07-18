"""Context for the ATM Equipment Dashboard web page.

Injects csrf_token into the page context so that frappe-ui's
frappeRequest can attach the X-Frappe-CSRF-Token header for API calls.
"""

import frappe


def get_context(context):
    """Augment page context with CSRF token for API requests."""
    # Ensure CSRF token is generated and available in session
    csrf_token = frappe.sessions.get_csrf_token()
    context.csrf_token = csrf_token

    # Also add to boot data so the existing template script picks it up
    if not context.get("boot"):
        context.boot = frappe._dict()

    context.boot["csrf_token"] = csrf_token
    return context
