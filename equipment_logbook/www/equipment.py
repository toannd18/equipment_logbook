"""Context for the ATM Equipment Dashboard web page.

Injects csrf_token into the page context so that frappe-ui's
frappeRequest can attach the X-Frappe-CSRF-Token header for API calls.

Two mechanisms set window.csrf_token:
1. <!-- csrf_token --> is replaced by add_csrf_token() with <script>frappe.csrf_token=...</script>
2. The inline <script>window.csrf_token = "{{ csrf_token }}"</script> sets it directly
"""

import frappe


def get_context(context):
    """Generate CSRF token and inject into page context."""
    # Disable page caching because CSRF token is session-specific
    context.no_cache = 1

    csrf_token = (
        getattr(frappe.local.session, "data", frappe._dict()).get("csrf_token")
        or frappe.generate_hash()
    )
    # Persist the generated token if session is available
    if (
        hasattr(frappe.local.session, "data")
        and not frappe.local.session.data.csrf_token
    ):
        frappe.local.session.data.csrf_token = csrf_token

    context.csrf_token = csrf_token

    # Also add to boot so the template's boot loop picks it up as fallback
    if not context.get("boot"):
        context.boot = frappe._dict()
    context.boot["csrf_token"] = csrf_token

    return context
