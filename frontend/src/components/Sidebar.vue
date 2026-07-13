<template>
  <!-- Light sidebar | Mobile: fixed overlay slide-in -->
  <aside
    class="flex h-screen flex-shrink-0 flex-col border-r border-gray-200 bg-white text-gray-700 transition-all duration-300"
    :class="[
      isCollapsed && !mobileMenuOpen ? 'w-16' : 'w-64',
      mobileMenuOpen
        ? 'fixed inset-y-0 left-0 z-50 translate-x-0'
        : 'fixed inset-y-0 left-0 z-50 -translate-x-full md:relative md:z-auto md:translate-x-0',
    ]"
  >
    <!-- ========== MOBILE HEADER ========== -->
    <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 md:hidden">
      <div class="flex items-center gap-2.5">
        <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
          <BaseIcon name="radio" :size="14" />
        </div>
        <span class="text-sm font-bold text-gray-900">Equipment Logbook</span>
      </div>
      <button
        class="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        @click="closeMobileMenu"
      >
        <BaseIcon name="x" :size="16" />
      </button>
    </div>

    <!-- ========== DESKTOP HEADER: Logo only ========== -->
    <div
      class="hidden items-center border-b border-gray-200 bg-white py-3 md:flex"
      :class="isCollapsed ? 'justify-center px-2' : 'justify-start px-4'"
    >
      <div class="flex items-center gap-3 overflow-hidden">
        <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <BaseIcon name="radio" :size="16" />
        </div>
        <div
          v-show="!isCollapsed"
          class="whitespace-nowrap"
        >
          <h1 class="text-sm font-bold leading-tight text-gray-900">Equipment</h1>
          <p class="text-[10px] leading-tight text-gray-500">ATM Logbook</p>
        </div>
      </div>
      <!-- Collapse button: chỉ hiện khi expanded -->
      <button
        v-show="!isCollapsed"
        class="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-600"
        title="Thu gọn"
        @click="toggleCollapse"
      >
        <BaseIcon name="chevron-left" :size="16" />
      </button>
    </div>

    <!-- ========== NAVIGATION ========== -->
    <nav class="flex-1 space-y-0.5 overflow-y-auto p-2">
      <SidebarLink
        v-for="item in navItems"
        :key="item.route"
        :label="item.label"
        :icon="item.icon"
        :to="item.route"
        :active="isActive(item.route)"
        :collapsed="isCollapsed"
      />
    </nav>

    <!-- ========== FOOTER: Avatar + User Info + Logout ========== -->
    <div class="border-t border-gray-200">
      <!-- Expand button: chỉ hiện khi collapsed, ở trên cùng footer -->
      <div
        v-if="isCollapsed"
        class="flex justify-center py-2"
      >
        <button
          class="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-600"
          title="Mở rộng"
          @click="toggleCollapse"
        >
          <BaseIcon name="chevron-right" :size="16" />
        </button>
      </div>

      <!-- User info -->
      <div
        class="flex items-center px-3 py-3"
        :class="isCollapsed ? 'justify-center' : 'gap-3'"
      >
        <!-- Avatar fallback (chữ cái đầu) -->
        <div
          class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white ring-2 ring-blue-100"
        >
          {{ avatarInitial }}
        </div>
        <div v-show="!isCollapsed" class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-gray-800">{{ userName }}</p>
          <p class="truncate text-xs text-gray-500">{{ userEmail }}</p>
        </div>
      </div>

      <!-- Logout -->
      <button
        class="flex w-full items-center gap-3 rounded-none px-3 py-2.5 text-sm text-gray-500 transition-colors duration-200 hover:bg-red-50 hover:text-red-600"
        :class="isCollapsed ? 'justify-center' : ''"
        :title="isCollapsed ? 'Đăng xuất' : ''"
        @click="handleLogout"
      >
        <BaseIcon name="log-out" :size="16" class="flex-shrink-0" />
        <span v-if="!isCollapsed">Đăng xuất</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BaseIcon from './BaseIcon.vue'
import SidebarLink from './SidebarLink.vue'
import { useSidebar } from '@/composables/useSidebar'

const route = useRoute()

const {
  mobileMenuOpen,
  toggleMobileMenu,
  closeMobileMenu,
  isCollapsed,
  toggleCollapse,
  getUserName,
  getUserEmail,
  handleLogout,
} = useSidebar()

defineExpose({ toggleMobileMenu, closeMobileMenu })

const userName = computed(() => getUserName())
const userEmail = computed(() => getUserEmail())
const avatarInitial = computed(() => (userName.value || 'G')[0].toUpperCase())

const navItems = [
  { label: 'Bảng Điều Khiển', icon: 'bar-chart-2', route: '/' },
  { label: 'Sổ Lý Lịch Hệ Thống', icon: 'database', route: '/logbook' },
  { label: 'Quản Lý Ticket', icon: 'help-circle', route: '/tickets' },
]

function isActive(itemRoute) {
  if (itemRoute === '/') return route.path === '/'
  return route.path.startsWith(itemRoute)
}
</script>
