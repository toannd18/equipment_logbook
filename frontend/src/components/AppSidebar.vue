<template>
  <!--
    AppSidebar — Responsive Navigation Sidebar
    - Desktop: fixed left column, collapsible (w-56 ↔ w-14)
    - Mobile (< md): hidden by default, slide-over drawer with overlay
  -->
  <aside
    class="flex h-screen flex-shrink-0 flex-col border-r border-gray-200 bg-white text-gray-600 transition-all duration-300"
    :class="[
      isCollapsed && !mobileMenuOpen ? 'w-14' : 'w-56',
      mobileMenuOpen
        ? 'fixed inset-y-0 left-0 z-50 translate-x-0'
        : 'fixed inset-y-0 left-0 z-50 -translate-x-full md:relative md:z-auto md:translate-x-0',
    ]"
  >
    <!-- ===== MOBILE HEADER (with close button) ===== -->
    <div class="flex items-center justify-between border-b border-gray-200 px-3 py-3 md:hidden">
      <a href="/desk" class="flex items-center gap-2.5">
        <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Radio class="h-3.5 w-3.5" />
        </div>
        <span class="text-sm font-bold text-gray-900">Equipment Logbook</span>
      </a>
      <button
        class="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        @click="closeMobileMenu"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <!-- ===== DESKTOP HEADER: Logo + Brand ===== -->
    <div
      class="hidden items-center border-b border-gray-200 bg-white py-3 md:flex"
      :class="isCollapsed ? 'justify-center px-2' : 'justify-start px-4'"
    >
      <a href="/desk" class="flex items-center gap-3 overflow-hidden">
        <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Radio class="h-4 w-4" />
        </div>
        <Transition name="fade">
          <div v-show="!isCollapsed" class="whitespace-nowrap">
            <h1 class="text-sm font-bold leading-tight text-gray-900">Equipment</h1>
            <p class="text-[10px] leading-tight text-gray-500">ATM Logbook</p>
          </div>
        </Transition>
      </a>
      <!-- Collapse toggle (visible when expanded) -->
      <button
        v-show="!isCollapsed"
        class="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        title="Thu gọn sidebar"
        @click="toggleCollapse"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>
    </div>

    <!-- ===== NAVIGATION LINKS ===== -->
    <nav class="flex-1 space-y-0.5 overflow-y-auto p-2">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        v-slot="{ isActive: linkActive }"
        custom
      >
        <a
          :href="item.to"
          class="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200"
          :class="[
            linkActive
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            isCollapsed ? 'justify-center' : '',
          ]"
          :title="isCollapsed ? item.label : ''"
          @click.prevent="$router.push(item.to)"
        >
          <!-- Icon (lucide-vue-next) -->
          <component :is="item.icon" class="h-[18px] w-[18px] flex-shrink-0" />
          <!-- Label (hidden when collapsed) -->
          <Transition name="fade">
            <span v-show="!isCollapsed" class="truncate">{{ item.label }}</span>
          </Transition>
        </a>
      </router-link>
    </nav>

    <!-- ===== FOOTER: User Info + Logout ===== -->
    <div class="border-t border-gray-200">
      <!-- Expand button (visible only when collapsed) -->
      <div v-if="isCollapsed" class="flex justify-center py-2">
        <button
          class="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Mở rộng sidebar"
          @click="toggleCollapse"
        >
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>

      <!-- User avatar + info -->
      <div
        class="flex items-center px-3 py-3"
        :class="isCollapsed ? 'justify-center' : 'gap-3'"
      >
        <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white ring-2 ring-blue-100">
          {{ avatarInitial }}
        </div>
        <Transition name="fade">
          <div v-show="!isCollapsed" class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-gray-800">{{ userName }}</p>
            <p class="truncate text-xs text-gray-500">{{ userEmail }}</p>
          </div>
        </Transition>
      </div>

      <!-- Logout button -->
      <button
        class="flex w-full items-center gap-3 rounded-none px-3 py-2.5 text-sm text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
        :class="isCollapsed ? 'justify-center' : ''"
        :title="isCollapsed ? 'Đăng xuất' : ''"
        @click="handleLogout"
      >
        <LogOut class="h-4 w-4 flex-shrink-0" />
        <Transition name="fade">
          <span v-show="!isCollapsed">Đăng xuất</span>
        </Transition>
      </button>
    </div>
  </aside>
</template>

<script setup>
/**
 * AppSidebar — Responsive sidebar navigation.
 *
 * Props:
 *   navItems — Array<{ label: string, icon: Component, to: string }>
 *
 * Uses @lucide/vue icons rendered directly as Vue components.
 * State (collapse, mobile open) is shared via useSidebar() composable.
 */
import { computed } from 'vue'
import {
  Radio,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from '@lucide/vue'
import { useSidebar } from '@/composables/useSidebar'

// ── Props ──────────────────────────────────────────────
defineProps({
  /** Navigation items: { label, icon (Vue component), to (route path) } */
  navItems: {
    type: Array,
    required: true,
    // Expected shape: { label: string, icon: Component, to: string }
  },
})

// ── Shared sidebar state (singleton composable) ─────────
const {
  mobileMenuOpen,
  closeMobileMenu,
  isCollapsed,
  toggleCollapse,
  getUserName,
  getUserEmail,
  handleLogout,
} = useSidebar()

// ── Derived ─────────────────────────────────────────────
const userName = computed(() => getUserName())
const userEmail = computed(() => getUserEmail())
const avatarInitial = computed(() => (userName.value || 'G')[0].toUpperCase())
</script>

<style scoped>
/*
 * Fade transition for the label / user-info when collapsing.
 * Duration matches the sidebar width transition (300ms).
 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
