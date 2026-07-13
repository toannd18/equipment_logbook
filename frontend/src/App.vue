<template>
  <div class="flex h-screen overflow-hidden bg-white">
    <!-- Mobile Header Bar (md:hidden) -->
    <header
      class="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-3 md:hidden"
    >
      <button
        class="flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
        @click="toggleMobileMenu"
      >
        <BaseIcon name="menu" :size="20" />
      </button>
      <span class="text-sm font-bold text-gray-900">Equipment Logbook</span>
      <div class="h-9 w-9"></div>
    </header>

    <!-- Sidebar -->
    <Sidebar ref="sidebarRef" />

    <!-- Mobile overlay -->
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 z-30 bg-black/50 md:hidden"
      @click="closeMobileMenu"
    ></div>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto bg-gray-50 pt-14 md:pt-0">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseIcon from '@/components/BaseIcon.vue'
import Sidebar from '@/components/Sidebar.vue'
import { useSidebar } from '@/composables/useSidebar'

const {
  mobileMenuOpen,
  toggleMobileMenu,
  closeMobileMenu,
} = useSidebar()

const sidebarRef = ref(null)
</script>
