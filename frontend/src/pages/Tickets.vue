<template>
  <div class="p-4 md:p-6">
    <!-- Toolbar -->
    <div class="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-2">
        <FeatherIcon name="help-circle" class="h-5 w-5 text-blue-600" />
        <h2 class="text-xl font-bold text-gray-900">Quản Lý Ticket</h2>
      </div>
      <!-- Sort controls (desktop) -->
      <div class="hidden items-center gap-1 md:flex">
        <span class="text-xs text-gray-500">Sắp xếp:</span>
        <select
          v-model="sortField"
          class="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option v-for="opt in sortOptions" :key="opt.field" :value="opt.field">
            {{ opt.label }}
          </option>
        </select>
        <button
          class="flex h-7 w-7 items-center justify-center rounded border border-gray-300 hover:bg-gray-100"
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
          title="Đảo chiều"
        >
          <FeatherIcon
            :name="sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'"
            class="h-3.5 w-3.5"
          />
        </button>
      </div>
    </div>

    <div class="rounded-xl border bg-white p-5 shadow-sm">
      <div v-if="tickets.loading" class="flex justify-center py-10">
        <LoadingText />
      </div>

      <div v-else-if="tickets.error" class="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
        <FeatherIcon name="alert-triangle" class="mr-1 inline-block h-4 w-4" />
        Không thể tải dữ liệu ticket.
      </div>

      <div v-else-if="!tickets.data?.length" class="py-10 text-center text-sm text-gray-400">
        <FeatherIcon name="inbox" class="mx-auto mb-2 h-8 w-8" />
        <p>Không có ticket nào.</p>
      </div>

      <template v-else>
        <div class="mb-4">
          <FormControl
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm ticket..."
            class="w-full md:max-w-sm"
          >
            <template #prefix>
              <FeatherIcon name="search" class="h-4 w-4 text-gray-400" />
            </template>
          </FormControl>
        </div>

        <!-- Desktop: ListView -->
        <div class="hidden w-full overflow-x-auto md:block">
        <ListView
          :columns="ticketColumns"
          :rows="filteredTickets"
          :options="{ selectable: false, showTooltip: false }"
        >
          <template #cell="{ column, row }">
            <a
              v-if="column.key === 'name'"
              :href="`/app/hd-ticket/${row.name}`"
              target="_blank"
              class="font-medium text-blue-600 underline decoration-gray-300 hover:text-blue-800"
            >
              {{ row.name }}
            </a>
            <Badge v-else-if="column.key === 'status'" :theme="statusTheme(row.status)">
              {{ row.status }}
            </Badge>
            <span v-else-if="column.key === 'creation'" class="text-sm text-gray-600">
              {{ formatDate(row.creation) }}
            </span>
            <span v-else class="text-sm text-gray-700">{{ row[column.key] || '-' }}</span>
          </template>
        </ListView>
        </div>

        <!-- Mobile: Card View -->
        <div class="space-y-3 md:hidden">
          <div
            v-for="t in filteredTickets"
            :key="t.name"
            class="cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition active:bg-gray-50"
            @click="openTicket(t)"
          >
            <div class="mb-2 flex items-start justify-between">
              <span class="text-xs font-mono text-blue-600">{{ t.name }}</span>
              <Badge :theme="statusTheme(t.status)">{{ t.status }}</Badge>
            </div>
            <p class="mb-2 text-sm font-medium text-gray-800 line-clamp-2">{{ t.subject }}</p>
            <div class="flex items-center justify-between text-xs text-gray-400">
              <span>{{ t.ticket_type || '-' }}</span>
              <span>{{ formatDate(t.creation) }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import {
  Badge,
  ListView,
  FormControl,
  FeatherIcon,
  LoadingText,
} from 'frappe-ui'
import { useTickets } from '@/composables/useTickets'

const {
  searchQuery,
  sortField,
  sortOrder,
  sortOptions,
  tickets,
  ticketColumns,
  filteredTickets,
  statusTheme,
  formatDate,
  openTicket,
} = useTickets()
</script>
