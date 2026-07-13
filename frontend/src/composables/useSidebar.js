/**
 * useSidebar — Composable quản lý trạng thái Sidebar (Singleton):
 * - mobileMenuOpen: mở/đóng drawer trên mobile
 * - isCollapsed: thu gọn sidebar trên desktop
 * - handleLogout: đăng xuất qua frappe.auth
 *
 * Module-level state ensures App.vue and Sidebar.vue share the same refs.
 */
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

// === Module-level singleton state ===
const mobileMenuOpen = ref(false)
const isCollapsed = ref(false)

// === Route watcher (auto-close mobile on nav) ===
let _routeWatcherInstalled = false

function _installRouteWatcher() {
  if (_routeWatcherInstalled) return
  _routeWatcherInstalled = true
  const route = useRoute()
  watch(() => route.path, () => {
    mobileMenuOpen.value = false
  })
}

// === Public API ===
export function useSidebar() {
  _installRouteWatcher()

  function toggleMobileMenu() {
    mobileMenuOpen.value = !mobileMenuOpen.value
  }

  function closeMobileMenu() {
    mobileMenuOpen.value = false
  }

  function toggleCollapse() {
    isCollapsed.value = !isCollapsed.value
  }

  function getUserName() {
    const cookies = new URLSearchParams(document.cookie.split('; ').join('&'))
    return cookies.get('user_id') || 'Guest'
  }

  function getUserEmail() {
    const cookies = new URLSearchParams(document.cookie.split('; ').join('&'))
    return cookies.get('user_id') ? `${cookies.get('user_id')}@localhost` : 'guest@localhost'
  }

  async function handleLogout() {
    try {
      const res = await fetch('/api/method/logout', { method: 'POST' })
      if (res.ok) {
        window.location.href = '/login'
      }
    } catch {
      window.location.href = '/login'
    }
  }

  return {
    mobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    isCollapsed,
    toggleCollapse,
    getUserName,
    getUserEmail,
    handleLogout,
  }
}
