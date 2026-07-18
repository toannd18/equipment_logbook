<template>
  <div class="flex h-full flex-col p-4 md:p-6">
    <!-- ── Page Header ── -->
    <div class="mb-5 flex flex-col gap-4">
      <!-- Title Row -->
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="flex items-center gap-2">
          <HelpCircle class="h-5 w-5 text-blue-600" />
          <h2 class="text-xl font-bold text-gray-900">Quản Lý Ticket</h2>
        </div>
        <div class="flex items-center gap-2">
          <FormControl
            v-model="searchQuery"
            type="text"
            placeholder="Tìm kiếm ticket..."
            class="w-full md:w-64"
          >
            <template #prefix>
              <Search class="h-4 w-4 text-gray-400" />
            </template>
          </FormControl>
          <Button
            :label="showFilter ? 'Đang lọc' : 'Lọc'"
            icon="filter"
            :variant="showFilter ? 'solid' : 'subtle'"
            @click="showFilter = !showFilter"
          />
          <Button
            icon="arrow-up"
            variant="subtle"
            label="Sắp xếp"
            @click="showSort = !showSort"
          />
          <Button
            icon="refresh-cw"
            variant="subtle"
            :loading="tickets.loading"
            @click="tickets.reload()"
          />
        </div>
      </div>
      <!-- Sort Bar -->
      <div v-if="showSort" class="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <span class="text-xs font-medium text-gray-500">Sắp xếp theo:</span>
        <select v-model="sortField" class="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="creation">Ngày tạo</option>
          <option value="status">Trạng thái</option>
          <option value="ticket_type">Phân loại</option>
        </select>
        <Button
          :icon="sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'"
          variant="ghost"
          size="sm"
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
        />
      </div>
      <!-- Filter Bar -->
      <div v-if="showFilter" class="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <span class="text-xs font-medium text-gray-500">Lọc theo trạng thái:</span>
        <select v-model="filterStatus" class="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Tất cả</option>
          <option value="Open">Mở</option>
          <option value="In Progress">Đang xử lý</option>
          <option value="Replied">Đã phản hồi</option>
          <option value="Resolved">Đã giải quyết</option>
          <option value="Closed">Đã đóng</option>
        </select>
      </div>
    </div>

    <!-- DataListView: Desktop Table + Mobile Cards -->
    <DataListView
      :resource="tickets"
      :columns="ticketColumns"
      :card-fields="cardFields"
      row-key="name"
      :page-size="20"
      :search-query="searchQuery"
      :search-fields="['name', 'subject', 'ticket_type']"
      :sort-field="sortField"
      :sort-order="sortOrder"
      :filters="{ status: filterStatus }"
      @row-click="openTicket"
    >
      <!-- Custom cell rendering for desktop table -->
      <template #cell="{ column, row, value }">
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
        <span v-else class="text-sm text-gray-700">{{ value ?? '-' }}</span>
      </template>

      <!-- Custom card rendering for mobile -->
      <template #card="{ row }">
        <div class="mb-2 flex items-start justify-between">
          <span class="text-xs font-mono text-blue-600">{{ row.name }}</span>
          <Badge :theme="statusTheme(row.status)">{{ row.status }}</Badge>
        </div>
        <p class="mb-2 text-sm font-medium text-gray-800 line-clamp-2">{{ row.subject }}</p>
        <div class="flex items-center justify-between text-xs text-gray-400">
          <span>{{ row.ticket_type || '-' }}</span>
          <span>{{ formatDate(row.creation) }}</span>
        </div>
      </template>
    </DataListView>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Button, Badge, FormControl, createListResource } from 'frappe-ui'
import { HelpCircle, Search } from '@lucide/vue'
import DataListView from '@/components/DataListView.vue'

// ────────────────────────────────────────────────────────
// State
// ────────────────────────────────────────────────────────
const searchQuery = ref('')

// Sort & Filter
const showSort = ref(false)
const sortField = ref('creation')
const sortOrder = ref('desc')
const showFilter = ref(false)
const filterStatus = ref('')

// ────────────────────────────────────────────────────────
// API Resource: HD Ticket list
// ────────────────────────────────────────────────────────
const tickets = createListResource({
  doctype: 'HD Ticket',
  fields: ['name', 'subject', 'status', 'ticket_type', 'creation', 'modified'],
  orderBy: 'creation desc',
  pageLength: 20,
  auto: true,
})

// ────────────────────────────────────────────────────────
// Column definitions for DataListView (desktop table)
// ────────────────────────────────────────────────────────
const ticketColumns = [
  { key: 'name', label: 'Mã Ticket', width: '140px' },
  { key: 'subject', label: 'Tiêu Đề', width: '2fr' },
  { key: 'status', label: 'Trạng Thái', width: '110px' },
  { key: 'ticket_type', label: 'Phân Loại', width: '120px' },
  { key: 'creation', label: 'Ngày Tạo', width: '150px' },
]

// Card fields cho mobile card view
const cardFields = [
  { key: 'name', label: 'Mã Ticket' },
  { key: 'status', label: 'Trạng Thái' },
  { key: 'subject', label: 'Tiêu Đề' },
  { key: 'ticket_type', label: 'Phân Loại' },
]

// ────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────
function statusTheme(status) {
  const map = {
    'Open': 'orange',
    'In Progress': 'blue',
    'Resolved': 'green',
    'Closed': 'gray',
    'Replied': 'blue',
  }
  return map[status] || 'gray'
}

function formatDate(v) {
  if (!v) return '-'
  return new Date(v).toLocaleString('vi-VN')
}

function openTicket(ticket) {
  window.open(`/app/hd-ticket/${ticket.name}`, '_blank')
}
</script>
