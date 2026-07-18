<template>
  <!--
    DataListView — Responsive data display component.
    - Desktop (md+): Frappe UI ListView table with sort & pagination.
    - Mobile (< md): Card list with vertical scroll, "Load more" pagination.
    - Props: resource (createResource), columns (array), rowKey (string),
             cardFields (array for mobile card layout), pageSize (number).
  -->
  <div class="flex h-full flex-col">
    <!-- ===== LOADING STATE (only when using resource) ===== -->
    <div
      v-if="resource && resource.loading && !resource.data"
      class="flex flex-1 items-center justify-center py-20"
    >
      <div class="flex flex-col items-center gap-3 text-gray-400">
        <svg
          class="h-8 w-8 animate-spin text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span class="text-sm">Đang tải dữ liệu...</span>
      </div>
    </div>

    <!-- ===== ERROR STATE (only when using resource) ===== -->
    <div
      v-else-if="resource && resource.error"
      class="flex flex-1 items-center justify-center py-20"
    >
      <div class="rounded-lg bg-red-50 px-6 py-4 text-center text-sm text-red-600">
        <AlertTriangle class="mx-auto mb-2 h-6 w-6 text-red-400" />
        <p class="font-medium">Không thể tải dữ liệu</p>
        <p class="mt-1 text-xs text-red-400">{{ resource.error }}</p>
        <Button
          variant="subtle"
          class="mt-3"
          @click="resource.reload()"
        >
          Thử lại
        </Button>
      </div>
    </div>

    <!-- ===== EMPTY STATE ===== -->
    <div
      v-else-if="!paginatedData.length"
      class="flex flex-1 items-center justify-center py-20"
    >
      <div class="text-center text-gray-400">
        <Inbox class="mx-auto mb-2 h-8 w-8" />
        <p class="text-sm">Không có dữ liệu.</p>
      </div>
    </div>

    <!-- ===== DATA: Desktop Table (md+) + Mobile Cards (< md) ===== -->
    <template v-else>
      <!-- Desktop Table (only render when there's data) -->
      <div class="hidden flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white md:block">
        <div v-if="paginatedData.length" class="w-full overflow-x-auto">
          <ListView
            :columns="tableColumns"
            :rows="paginatedData"
            :options="listOptions"
            :row-key="rowKey"
          >
            <template #cell="{ column, row, value }">
              <div class="cursor-pointer" @click="onRowClick(row)">
                <slot name="cell" :column="column" :row="row" :value="value">
                  <span class="text-sm text-gray-700">{{ value ?? '-' }}</span>
                </slot>
              </div>
            </template>
          </ListView>
        </div>
      </div>

      <!-- Mobile Card List -->
      <div class="flex-1 space-y-3 overflow-y-auto md:hidden">
        <div
          v-for="row in paginatedData"
          :key="row[rowKey]"
          class="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition active:bg-gray-50"
          @click="onCardClick(row)"
        >
          <slot name="card" :row="row">
            <div class="space-y-2">
              <div
                v-for="field in cardFields"
                :key="field.key"
                class="flex items-center justify-between"
              >
                <span class="text-xs text-gray-500">{{ field.label }}</span>
                <span class="text-sm font-medium text-gray-900">
                  {{ row[field.key] ?? '-' }}
                </span>
              </div>
            </div>
          </slot>
        </div>
      </div>

      <!-- Pagination (desktop) -->
      <div
        v-if="showPagination && totalPages > 1"
        class="hidden items-center justify-between border-t border-gray-200 bg-white px-4 py-3 md:flex"
      >
        <span class="text-xs text-gray-500">
          Hiển thị {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalItems) }}
          trên {{ totalItems }} mục
        </span>
        <div class="flex items-center gap-1">
          <button
            class="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>
          <button
            v-for="page in visiblePageNumbers"
            :key="page"
            class="flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-sm font-medium transition-colors"
            :class="
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            "
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Pagination (mobile): "Load More" -->
      <div
        v-if="showPagination && hasMoreToLoad"
        class="flex justify-center py-4 md:hidden"
      >
        <Button
          variant="subtle"
          :loading="resource?.loading"
          class="w-full max-w-xs"
          @click="loadMore"
        >
          Xem thêm ({{ remainingItems }} mục)
        </Button>
      </div>
    </template>
  </div>
</template>

<script setup>
/**
 * DataListView — Responsive data table / card list.
 *
 * Props:
 *   resource    — A createResource() instance (must expose .data, .loading, .error, .reload)
 *   columns     — Array<{ key: string, label: string, sortable?: boolean, width?: string }>
 *   rowKey      — Unique key field for each row (default: "name")
 *   cardFields  — Fields to display on mobile cards [{ key, label }]
 *   pageSize    — Items per page (default: 20)
 *
 * Events:
 *   rowClick    — Emitted when a row or card is clicked (payload: row object)
 *
 * Slots:
 *   #cell       — Custom cell rendering for desktop table columns
 *   #card       — Custom card rendering for mobile card view
 */
import { ref, computed, watch } from 'vue'
import { ListView, Button } from 'frappe-ui'
import { AlertTriangle, Inbox, ChevronLeft, ChevronRight } from '@lucide/vue'

// ── Props ──────────────────────────────────────────────
const props = defineProps({
  /** createResource instance: { data, loading, error, reload } */
  resource: { type: Object, default: null },
  /** Plain data array (alternative to resource, for computed data) */
  data: { type: Array, default: null },
  /** Column definitions for desktop ListView */
  columns: {
    type: Array,
    required: true,
  },
  /** Unique row identifier field */
  rowKey: { type: String, default: 'name' },
  /** Fields to display on mobile cards */
  cardFields: {
    type: Array,
    required: true,
  },
  /** Number of items per page */
  pageSize: { type: Number, default: 20 },
  /** Search query string (filters allData) */
  searchQuery: { type: String, default: '' },
  /** Fields to search in when searchQuery is provided */
  searchFields: { type: Array, default: () => [] },
  /** Sort field name */
  sortField: { type: String, default: '' },
  /** Sort direction: 'asc' or 'desc' */
  sortOrder: { type: String, default: 'asc' },
  /** Filter object: { fieldName: filterValue }. Empty values are ignored. */
  filters: { type: Object, default: () => ({}) },
})

// ── Emits ──────────────────────────────────────────────
const emit = defineEmits(['rowClick'])

// ── Internal pagination state ──────────────────────────
const currentPage = ref(1)
const mobileLimit = ref(props.pageSize) // For mobile "Load more"

// ── Computed: table columns with default widths ────────
const tableColumns = computed(() =>
  props.columns.map((col) => ({
    key: col.key,
    label: col.label,
    width: col.width || '1fr',
  }))
)

// ── ListView options (include emptyState to prevent frappe-ui crash) ──
const listOptions = computed(() => ({
  selectable: false,
  showTooltip: false,
  rowCount: paginatedData.value.length,
  emptyState: {
    title: 'Không có dữ liệu',
    description: 'Không tìm thấy bản ghi nào.',
  },
}))

// ── Computed: data list (search → filter → sort) ──────
const rawData = computed(() => {
  // Prefer explicit data prop over resource.data
  if (props.data !== null) return props.data
  const d = props.resource?.data
  return Array.isArray(d) ? d : []
})

const allData = computed(() => {
  let data = rawData.value

  // 1. Search filter
  const q = (props.searchQuery || '').toLowerCase().trim()
  if (q && props.searchFields.length) {
    data = data.filter((row) =>
      props.searchFields.some((field) =>
        String(row[field] || '').toLowerCase().includes(q)
      )
    )
  }

  // 2. Field filters (e.g. { health: 'active', status: 'Open' })
  const activeFilters = Object.entries(props.filters || {}).filter(
    ([, v]) => v !== '' && v != null
  )
  if (activeFilters.length) {
    data = data.filter((row) =>
      activeFilters.every(([field, val]) => String(row[field] || '') === String(val))
    )
  }

  // 3. Sort
  if (props.sortField) {
    const dir = props.sortOrder === 'desc' ? -1 : 1
    data = [...data].sort((a, b) => {
      const va = a[props.sortField] ?? ''
      const vb = b[props.sortField] ?? ''
      if (typeof va === 'number' && typeof vb === 'number') {
        return dir * (va - vb)
      }
      return dir * String(va).localeCompare(String(vb))
    })
  }

  return data
})

const totalItems = computed(() => allData.value.length)

const totalPages = computed(() => Math.ceil(totalItems.value / props.pageSize))

// Desktop: paginated slice
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  return allData.value.slice(start, start + props.pageSize)
})

// Mobile: progressively loaded slice
const mobileData = computed(() =>
  allData.value.slice(0, mobileLimit.value)
)

// ── Computed: pagination display ───────────────────────
const showPagination = computed(() => totalItems.value > props.pageSize)

const hasMoreToLoad = computed(() => mobileLimit.value < totalItems.value)

const remainingItems = computed(() => totalItems.value - mobileLimit.value)

const visiblePageNumbers = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages.value, start + maxVisible - 1)
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

// ── Methods ────────────────────────────────────────────
function onRowClick(row) {
  emit('rowClick', row)
}

function onCardClick(row) {
  emit('rowClick', row)
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function loadMore() {
  mobileLimit.value = Math.min(mobileLimit.value + props.pageSize, totalItems.value)
}

// ── Reset pagination when data source or filters change ─
watch(
  () => [props.resource?.data, props.data, props.searchQuery, props.sortField, props.sortOrder, props.filters],
  () => {
    currentPage.value = 1
    mobileLimit.value = props.pageSize
  }
)
</script>
