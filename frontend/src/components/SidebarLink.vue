<template>
  <router-link
    :to="to"
    class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200"
    :class="[
      active
        ? 'border-l-4 border-l-blue-600 bg-blue-50 text-blue-700'
        : 'border-l-4 border-l-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      collapsed ? 'justify-center' : '',
    ]"
    :title="collapsed ? label : ''"
  >
    <BaseIcon :name="icon" :size="18" class="flex-shrink-0" />
    <span v-show="!collapsed" class="truncate">{{ label }}</span>
  </router-link>
</template>

<script setup>
import BaseIcon from './BaseIcon.vue'

defineProps({
  label: { type: String, required: true },
  icon: { type: String, required: true },
  to: { type: [String, Object], required: true },
  active: { type: Boolean, default: false },
  collapsed: { type: Boolean, default: false },
})
</script>
