<template>
  <div class="flex h-full flex-col p-4 md:p-6">
    <!-- ==================== LIST VIEW ==================== -->
    <template v-if="viewState === 'list'">
      <!-- Header Toolbar -->
      <div class="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="flex items-center gap-2">
          <FeatherIcon name="database" class="h-5 w-5 text-blue-600" />
          <h2 class="text-xl font-bold text-gray-900">Sổ Lý Lịch Hệ Thống</h2>
        </div>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <!-- Sort controls (desktop) -->
          <div class="hidden items-center gap-1 md:flex">
            <span class="text-xs text-gray-500">Sắp xếp:</span>
            <select
              v-model="sortField"
              class="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              @change="mainPageSize = pageStep"
            >
              <option v-for="opt in sortOptions" :key="opt.field" :value="opt.field">
                {{ opt.label }}
              </option>
            </select>
            <button
              class="flex h-7 w-7 items-center justify-center rounded border border-gray-300 hover:bg-gray-100"
              @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
              title="Đảo chiều sắp xếp"
            >
              <FeatherIcon
                :name="sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'"
                class="h-3.5 w-3.5"
              />
            </button>
          </div>
          <Button icon="refresh-cw" :loading="systemsResource.loading" class="w-full md:w-auto" @click="systemsResource.reload()">
            Làm mới
          </Button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="systemsResource.loading && !systemsResource.data" class="flex flex-1 items-center justify-center">
        <Spinner />
      </div>

      <!-- Error -->
      <div v-else-if="systemsResource.error" class="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
        <FeatherIcon name="alert-triangle" class="mr-1 inline-block h-4 w-4" />
        Không thể tải dữ liệu. Vui lòng thử lại.
      </div>

      <!-- Empty -->
      <div v-else-if="!systemsResource.data?.length"
        class="flex flex-1 items-center justify-center text-sm text-gray-400">
        <div class="text-center">
          <FeatherIcon name="inbox" class="mx-auto mb-2 h-8 w-8" />
          <p>Không có hệ thống ATM nào.</p>
        </div>
      </div>

      <!-- Data -->
      <template v-else>
        <!-- Search -->
        <div class="mb-4">
          <FormControl v-model="searchQuery" type="text" placeholder="Tìm kiếm theo mã hoặc tên hệ thống..."
            class="w-full md:max-w-sm">
            <template #prefix>
              <FeatherIcon name="search" class="h-4 w-4 text-gray-400" />
            </template>
          </FormControl>
        </div>

        <!-- Desktop: ListView -->
        <div class="hidden flex-1 overflow-hidden rounded-lg border bg-white md:block">
          <div class="w-full overflow-x-auto">
          <ListView :columns="listColumns" :rows="visibleSystems" :options="{
            selectable: false,
            showTooltip: false,
            rowCount: visibleSystems.length
          }" row-key="name" @row-click="openDetail">
            <template #cell="{ column, row, value }">
              <div class="cursor-pointer" @click="openDetail(row)">
                <span v-if="column.key === 'system_code'" class="font-bold text-sm text-blue-600 truncate">
                  {{ row.system_code || row.name }}
                </span>
                <span v-else-if="column.key === 'system_name'" class="text-sm font-medium text-gray-900 truncate">
                  {{ row.system_name }}
                </span>
                <Badge v-else-if="column.key === 'health'" :theme="healthBadgeTheme(row.health)">
                  {{ healthLabel(row.health) }}
                </Badge>
                <span v-else-if="column.key === 'criticality'" class="text-sm text-gray-700 truncate">
                  {{ row.criticality }}
                </span>
                <span v-else-if="column.key === 'location'" class="text-sm text-gray-700 truncate">
                  {{ row.location }}
                </span>
                <Badge v-else-if="column.key === 'asset_count'" theme="blue">
                  {{ row.asset_count || 0 }}
                </Badge>
                <span v-else-if="column.key === 'open_ticket_count'"
                  :class="row.open_ticket_count > 0 ? 'font-bold text-red-600' : 'text-gray-400'">
                  {{ row.open_ticket_count > 0 ? `${row.open_ticket_count} ⚠️` : '0' }}
                </span>
                <span v-else class="text-sm text-gray-700">{{ value || '-' }}</span>
              </div>
            </template>
          </ListView>
          </div>
        </div>

        <!-- Mobile: Card View -->
        <div class="flex-1 space-y-3 overflow-y-auto md:hidden">
          <div
            v-for="sys in visibleSystems"
            :key="sys.name"
            class="cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition active:bg-gray-50"
            @click="openDetail(sys)"
          >
            <div class="mb-2 flex items-start justify-between">
              <div>
                <span class="font-bold text-blue-600">{{ sys.system_code || sys.name }}</span>
                <p class="text-sm font-medium text-gray-800">{{ sys.system_name }}</p>
              </div>
              <Badge :theme="healthBadgeTheme(sys.health)">
                {{ healthLabel(sys.health) }}
              </Badge>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div class="flex items-center gap-1">
                <FeatherIcon name="map-pin" class="h-3 w-3" />
                <span class="truncate">{{ sys.location || '-' }}</span>
              </div>
              <div class="flex items-center gap-1">
                <FeatherIcon name="flag" class="h-3 w-3" />
                <span>{{ sys.criticality || '-' }}</span>
              </div>
              <div class="flex items-center gap-1">
                <Badge theme="blue" class="text-[10px]">{{ sys.asset_count || 0 }}</Badge>
                <span>Thiết bị</span>
              </div>
              <div class="flex items-center gap-1" :class="sys.open_ticket_count > 0 ? 'text-red-600 font-bold' : ''">
                <span>{{ sys.open_ticket_count > 0 ? `🚨 ${sys.open_ticket_count}` : '0' }}</span>
                <span>Ticket</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
          <span class="text-xs text-gray-500">
            Hiển thị {{ visibleSystems.length }} / {{ filteredSystems.length }} hệ thống
          </span>
          <Button v-if="hasMore" variant="subtle" class="w-full md:w-auto" @click="loadMore">
            Xem thêm ({{ filteredSystems.length - visibleSystems.length }})
          </Button>
        </div>
      </template>
    </template>

    <!-- ==================== DETAIL VIEW ==================== -->
    <template v-else-if="viewState === 'detail'">
      <!-- Breadcrumb -->
      <nav class="mb-4 flex items-center text-sm text-gray-500">
        <button class="flex items-center gap-1 hover:text-blue-600 hover:underline" @click="backToList">
          <FeatherIcon name="arrow-left" class="h-3.5 w-3.5" />
          Sổ Lý Lịch Hệ Thống
        </button>
        <span class="mx-2">/</span>
        <span class="font-bold text-gray-800">
          {{ selectedSystem?.system_name || selectedSystem?.name }}
        </span>
      </nav>

      <!-- Loading -->
      <div v-if="detailResource.loading" class="flex flex-1 items-center justify-center">
        <Spinner />
      </div>

      <!-- Error -->
      <div v-else-if="detailResource.error" class="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700">
        Không có dữ liệu chi tiết cho hệ thống này.
      </div>

      <!-- Detail Content -->
      <template v-else-if="systemDetail">
        <!-- Tabs -->
        <div class="mb-5 flex flex-wrap gap-1.5 border-b pb-2">
          <Button v-for="tab in detailTabs" :key="tab.key" :variant="activeTab === tab.key ? 'solid' : 'subtle'"
            size="sm" class="flex-1 md:flex-none" @click="activeTab = tab.key">
            {{ tab.label }}
          </Button>
        </div>

        <!-- Tab: General -->
        <div v-if="activeTab === 'general'" class="space-y-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="rounded-xl border bg-white p-5 shadow-sm">
              <h3 class="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700">
                <FeatherIcon name="info" class="h-4 w-4 text-blue-500" />
                Thông Tin Định Danh
              </h3>
              <dl class="space-y-2 text-sm">
                <div v-for="r in genRows" :key="r.label"
                  class="flex justify-between border-b border-gray-50 py-1.5 last:border-0">
                  <dt class="text-gray-500">{{ r.label }}</dt>
                  <dd class="font-medium text-gray-800" v-html="r.value"></dd>
                </div>
              </dl>
            </div>
            <div class="rounded-xl border bg-white p-5 shadow-sm">
              <h3 class="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700">
                <FeatherIcon name="file-text" class="h-4 w-4 text-blue-500" />
                Ghi Chú Kỹ Thuật
              </h3>
              <div v-if="systemDetail.general?.description" class="prose prose-sm text-gray-700"
                v-html="systemDetail.general.description"></div>
              <span v-else class="text-sm italic text-gray-400">Không có mô tả chi tiết.</span>
            </div>
          </div>

          <!-- Positions -->
          <div v-if="rawPositions.length" class="rounded-xl border bg-white p-5 shadow-sm">
            <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h3 class="flex items-center gap-2 text-sm font-bold text-gray-700">
                <FeatherIcon name="share-2" class="h-4 w-4 text-blue-500" />
                Sơ Đồ Node ({{ rawPositions.length }} Vị Trí)
              </h3>
              <!-- Sort controls -->
              <div class="flex items-center gap-1">
                <span class="text-xs text-gray-500">Sắp xếp:</span>
                <select v-model="posSortField" class="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" @change="visibleCounts.positions = tabPageStep">
                  <option value="position_code">Mã Node</option>
                  <option value="position_name">Tên Chức Năng</option>
                  <option value="current_asset">Thiết Bị</option>
                  <option value="status">Trạng Thái</option>
                  <option value="remarks">Ghi Chú</option>
                </select>
                <Button :icon="posSortOrder === 'asc' ? 'arrow-up' : 'arrow-down'" variant="ghost" size="sm" @click="posSortOrder = posSortOrder === 'asc' ? 'desc' : 'asc'" :title="'Đảo chiều'" />
              </div>
            </div>
            <div class="mb-4">
              <FormControl v-model="posFilter" type="text" placeholder="Tìm kiếm vị trí..." class="w-full md:max-w-sm">
                <template #prefix>
                  <FeatherIcon name="search" class="h-4 w-4 text-gray-400" />
                </template>
              </FormControl>
            </div>

            <!-- Desktop: ListView -->
            <div class="hidden w-full overflow-x-auto md:block">
            <ListView :columns="posColumns" :rows="visiblePositions"
              :options="{ selectable: false, showTooltip: false }" row-key="position_code">
              <template #cell="{ column, row, value }">
                <code v-if="column.key === 'position_code'"
                  class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-bold text-blue-600">
      {{ row.position_code }}
    </code>
                <span v-else-if="column.key === 'position_name'" class="text-sm text-gray-700">
                  {{ row.position_name }}
                </span>

                <div v-else-if="column.key === 'current_asset'">
                  <a v-if="row.current_asset?.name" :href="`/app/asset/${row.current_asset.name}`" target="_blank"
                    class="font-sm text-xs text-gray-800 underline decoration-gray-300 hover:text-blue-600">
                    {{ row.current_asset.asset_name || row.current_asset.name }}
                  </a>
                  <span v-else class="italic text-sm text-gray-400">-- Trống --</span>
                </div>

                <span v-else-if="column.key === 'status'" class="text-sm text-gray-700">
                  <Badge v-if="row.current_asset?.status" theme="green">
                    {{ row.current_asset.status }}
                  </Badge>
                  <span v-else class="italic text-xs text-gray-400">-- Trống --</span>
                </span>

                <span v-else-if="column.key === 'remarks'" class="text-sm text-gray-700 truncate block max-w-[150px]">
                  {{ row.remarks || '-' }}
                </span>

                <span v-else class="text-sm text-gray-700">{{ value || '-' }}</span>
              </template>
            </ListView>
            </div>

            <!-- Mobile: Card View -->
            <div class="space-y-3 md:hidden">
              <div v-for="p in visiblePositions" :key="p.position_code" class="rounded-xl border bg-white p-3 shadow-sm">
                <div class="mb-1.5 flex items-start justify-between">
                  <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-bold text-blue-600">{{ p.position_code }}</code>
                  <Badge v-if="p.current_asset?.status" theme="green" class="text-[10px]">{{ p.current_asset.status }}</Badge>
                </div>
                <p class="text-sm font-medium text-gray-800">{{ p.position_name }}</p>
                <div class="mt-2 flex items-center gap-2 text-xs">
                  <FeatherIcon name="package" class="h-3 w-3 text-gray-400" />
                  <a v-if="p.current_asset?.name" :href="`/app/asset/${p.current_asset.name}`" target="_blank" class="text-blue-600 underline">{{ p.current_asset.asset_name || p.current_asset.name }}</a>
                  <span v-else class="italic text-gray-400">-- Trống --</span>
                </div>
                <p class="mt-1 text-xs text-gray-400 truncate">{{ p.remarks || '-' }}</p>
              </div>
            </div>

            <div class="mt-2 text-center">
              <Button v-if="posHasMore" variant="subtle" size="sm" class="w-full md:w-auto" @click="loadMorePositions">
                Xem thêm ({{ filteredPositions.length - visiblePositions.length }})
              </Button>
            </div>
          </div>
        </div>

        <!-- Tab: Dynamic -->
        <div v-else class="rounded-xl border bg-white p-5 shadow-sm">
          <div v-if="!rawTabData.length" class="py-10 text-center text-sm text-gray-400">
            <FeatherIcon name="inbox" class="mx-auto mb-2 h-8 w-8" />
            <p>Không có bản ghi nào.</p>
          </div>
          <template v-else>
            <!-- Toolbar: Search + Sort -->
            <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <FormControl v-model="tabFilter" type="text" placeholder="Tìm kiếm trong bảng..." class="w-full md:max-w-sm">
                <template #prefix>
                  <FeatherIcon name="search" class="h-4 w-4 text-gray-400" />
                </template>
              </FormControl>
              <!-- Sort controls -->
              <div class="flex items-center gap-1">
                <span class="text-xs text-gray-500">Sắp xếp:</span>
                <select v-model="tabSortField" class="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" @change="visibleCounts[activeTab] = tabPageStep">
                  <option v-for="h in tabHeaders" :key="h.key" :value="h.key">{{ h.label }}</option>
                </select>
                <Button :icon="tabSortOrder === 'asc' ? 'arrow-up' : 'arrow-down'" variant="ghost" size="sm" @click="tabSortOrder = tabSortOrder === 'asc' ? 'desc' : 'asc'" :title="'Đảo chiều'" />
              </div>
            </div>

            <!-- Desktop: ListView -->
            <div class="hidden w-full overflow-x-auto md:block">
            <ListView :columns="tabHeaders" :rows="visibleTabData" :options="{ selectable: false, showTooltip: false }"
              row-key="activeTab === 'maintenance' ? 'log_name' : 'name'">
              <template #cell="{ column, row, value }">
                <a v-if="isLinkColumn(column.key)" :href="getLinkUrl(row, column.key)" target="_blank"
                  class="font-sm text-xs underline decoration-gray-300 hover:text-blue-600">{{ row[column.key] }}</a>
                <Badge v-else-if="isBadgeColumn(column.key)" :theme="getBadgeTheme(column.key, row[column.key])">{{
                  row[column.key] }}</Badge>
                <code v-else-if="column.key === 'custom_system_position' && row.custom_system_position"
                  class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-bold text-gray-700">{{ row.custom_system_position }}</code>
                <span v-else-if="column.key === 'custom_system_position'" class="italic text-gray-400">Kho
                  Standby</span>
                <span v-else-if="column.key === 'repair_cost'" class="text-sm">{{ row.repair_cost }}</span>
                <span v-else-if="column.key === 'creation'" class="text-sm text-gray-600">{{ value
                  }}</span>
                <span v-else class="text-sm text-gray-700">{{ row[column.key] || '-' }}</span>
              </template>
            </ListView>
            </div>

            <!-- Mobile: Card View -->
            <div class="space-y-3 md:hidden">
              <div v-for="row in visibleTabData" :key="row.name || row.log_name || row.maintenance_name" class="rounded-xl border bg-white p-3 shadow-sm">
                <!-- Card nội dung động theo tab -->
                <template v-if="activeTab === 'assets'">
                  <div class="mb-1.5 flex items-start justify-between">
                    <a :href="`/app/asset/${row.name}`" target="_blank" class="text-xs font-bold text-blue-600 underline">{{ row.name }}</a>
                    <Badge :theme="getBadgeTheme('status', row.status)" class="text-[10px]">{{ row.status }}</Badge>
                  </div>
                  <p class="text-sm font-medium text-gray-800">{{ row.asset_name }}</p>
                  <div class="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span>📍 {{ row.location || '-' }}</span>
                    <code v-if="row.custom_system_position" class="rounded bg-gray-100 px-1 text-[10px]">{{ row.custom_system_position }}</code>
                  </div>
                </template>
                <template v-else-if="activeTab === 'maintenance'">
                  <div class="mb-1.5 flex items-start justify-between">
                    <a :href="`/app/asset-maintenance/${row.maintenance_name}`" target="_blank" class="text-xs font-bold text-blue-600 underline">{{ row.maintenance_name }}</a>
                    <Badge :theme="getBadgeTheme('maintenance_status', row.maintenance_status)" class="text-[10px]">{{ row.maintenance_status }}</Badge>
                  </div>
                  <p class="text-sm font-medium text-gray-800">{{ row.asset_name }}</p>
                  <div class="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span>{{ row.maintenance_type || '-' }}</span>
                    <span>{{ row.maintenance_date || '-' }}</span>
                  </div>
                </template>
                <template v-else-if="activeTab === 'repairs'">
                  <div class="mb-1.5 flex items-start justify-between">
                    <a :href="`/app/asset-repair/${row.name}`" target="_blank" class="text-xs font-bold text-blue-600 underline">{{ row.name }}</a>
                    <Badge :theme="getBadgeTheme('repair_status', row.repair_status)" class="text-[10px]">{{ row.repair_status }}</Badge>
                  </div>
                  <p class="text-sm font-medium text-gray-800">{{ row.asset_name }}</p>
                  <div class="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span>{{ row.failure_date || '-' }}</span>
                    <span class="font-medium text-gray-600">{{ formatVND(row.repair_cost) }}</span>
                  </div>
                </template>
                <template v-else-if="activeTab === 'incidents'">
                  <div class="mb-1.5 flex items-start justify-between">
                    <a :href="`/app/hd-ticket/${row.name}`" target="_blank" class="text-xs font-bold text-blue-600 underline">{{ row.name }}</a>
                    <Badge :theme="getBadgeTheme('status', row.status)" class="text-[10px]">{{ row.status }}</Badge>
                  </div>
                  <p class="text-sm font-medium text-gray-800 line-clamp-2">{{ row.subject }}</p>
                  <div class="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span>{{ row.ticket_type || '-' }}</span>
                    <span>{{ formatDate(row.creation) }}</span>
                  </div>
                </template>
              </div>
            </div>

            <div class="mt-3 text-center">
              <Button v-if="tabHasMore" variant="subtle" size="sm" class="w-full md:w-auto" @click="loadMoreTab">
                Xem thêm ({{ filteredTabData.length - visibleTabData.length }})
              </Button>
            </div>
          </template>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import {
  Button,
  Badge,
  ListView,
  FormControl,
  FeatherIcon,
  Spinner,
  createResource,
} from 'frappe-ui'

// ======================= STATE =======================
const viewState = ref('list')
const selectedSystem = ref(null)
const searchQuery = ref('')
const mainPageSize = ref(15)
const pageStep = 15

const activeTab = ref('general')
const tabFilter = ref('')
const posFilter = ref('')

const visibleCounts = reactive({
  assets: 10, maintenance: 10, repairs: 10, incidents: 10, positions: 10,
})
const tabPageStep = 10

// ======================= SORT =======================
const sortField = ref('system_code')
const sortOrder = ref('asc')

const sortOptions = [
  { label: 'Mã Hệ Thống', field: 'system_code' },
  { label: 'Tên Hệ Thống', field: 'system_name' },
  { label: 'Sức Khỏe', field: 'health' },
  { label: 'Phân Cấp', field: 'criticality' },
  { label: 'Vị Trí', field: 'location' },
  { label: 'Thiết Bị', field: 'asset_count' },
  { label: 'Ticket', field: 'open_ticket_count' },
]

function setSortField(field) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
  mainPageSize.value = pageStep
}

// --- Sort state for Positions ---
const posSortField = ref('position_code')
const posSortOrder = ref('asc')

function setPosSortField(field) {
  if (posSortField.value === field) {
    posSortOrder.value = posSortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    posSortField.value = field
    posSortOrder.value = 'asc'
  }
  visibleCounts.positions = tabPageStep
}

// --- Sort state for Dynamic Tabs ---
const tabSortField = ref('name')
const tabSortOrder = ref('asc')

function setTabSortField(field) {
  if (tabSortField.value === field) {
    tabSortOrder.value = tabSortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    tabSortField.value = field
    tabSortOrder.value = 'asc'
  }
  visibleCounts[activeTab.value] = tabPageStep
}

// ======================= API RESOURCES =======================
const systemsResource = createResource({
  url: 'equipment_logbook.equipment_logbook.api.get_systems_overview_list',
  auto: true,
})

const detailResource = createResource({
  url: 'equipment_logbook.equipment_logbook.api.get_system_logbook_detail',
  auto: false,
})

// ======================= FORMATTERS =======================
const healthMap = {
  active: { label: 'Hoạt Động', theme: 'green' },
  degraded: { label: 'Suy Giảm', theme: 'orange' },
  maintenance: { label: 'Bảo Trì', theme: 'blue' },
  offline: { label: 'Ngoại Tuyến', theme: 'gray' },
  decommissioned: { label: 'Ngừng HĐ', theme: 'red' },
  unknown: { label: 'Không Xác Định', theme: 'gray' },
}

function healthBadgeTheme(v) { return healthMap[v]?.theme || 'gray' }
function healthLabel(v) { return healthMap[v]?.label || v || 'Không Xác Định' }

function formatVND(v) {
  if (v == null || v === '') return '-'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)
}

function formatDate(v) {
  if (!v) return '-'
  return new Date(v).toLocaleString('vi-VN')
}

// ======================= COMPUTED: LIST VIEW =======================
const listColumns = [
  { label: 'Mã Hệ Thống', key: 'system_code', width: '150px' },
  { label: 'Tên Hệ Thống', key: 'system_name', width: '1.5fr' },
  { label: 'Sức Khỏe', key: 'health', width: '100px' },
  { label: 'Phân Cấp', key: 'criticality', width: '1fr' },
  { label: 'Vị Trí', key: 'location', width: '1fr' },
  { label: 'Thiết Bị', key: 'asset_count', width: '50px' },
  { label: 'Ticket', key: 'open_ticket_count', width: '50px' },
]

const rawSystems = computed(() => {
  //console.log("Dữ liệu API trả về:", systemsResource.data);
  return systemsResource.data || []
})

const filteredSystems = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return rawSystems.value
  return rawSystems.value.filter((s) =>
    String(s.system_code || '').toLowerCase().includes(q) ||
    String(s.system_name || '').toLowerCase().includes(q)
  )
})

const visibleSystems = computed(() => {
  // Sort first, then slice
  const sorted = [...filteredSystems.value].sort((a, b) => {
    const va = a[sortField.value] ?? ''
    const vb = b[sortField.value] ?? ''
    if (typeof va === 'number' && typeof vb === 'number') {
      return sortOrder.value === 'asc' ? va - vb : vb - va
    }
    const cmp = String(va).localeCompare(String(vb))
    return sortOrder.value === 'asc' ? cmp : -cmp
  })
  return sorted.slice(0, mainPageSize.value)
})
const hasMore = computed(() => mainPageSize.value < filteredSystems.value.length)

function loadMore() { mainPageSize.value += pageStep }

// ======================= NAVIGATION =======================
function openDetail(sys) {
  selectedSystem.value = sys
  viewState.value = 'detail'
  activeTab.value = 'general'
  detailResource.submit({ system_info: sys.name })
}

function backToList() {
  viewState.value = 'list'
  selectedSystem.value = null
}

// ======================= COMPUTED: DETAIL =======================
const systemDetail = computed(
  () => {
   // console.log("Dữ liệu chi tiết trả về:", detailResource.data);
    return detailResource.data
  })

const detailTabs = computed(() => {
  const d = systemDetail.value
  if (!d) return []
  return [
    { key: 'general', label: `📌 Tổng Quan` },
    { key: 'assets', label: `📦 Thiết Bị (${d.assets?.length || 0})` },
    { key: 'maintenance', label: `🛠️ Bảo Trì (${d.maintenance?.length || 0})` },
    { key: 'repairs', label: `🔧 Sửa Chữa (${d.repairs?.length || 0})` },
    { key: 'incidents', label: `🚨 Sự Cố (${d.incidents?.length || 0})` },
  ]
})

const genRows = computed(() => {
  const g = systemDetail.value?.general
  if (!g) return []
  return [
    { label: 'Mã Hệ Thống', value: `<strong>${g.system_code || '-'}</strong>` },
    { label: 'Tên Hệ Thống', value: g.system_name || '-' },
    { label: 'Trạng Thái', value: healthLabel(g.status.toLowerCase()) || '-' },
    { label: 'Phân Cấp', value: g.criticality || '-' },
    { label: 'Vị Trí / Trạm', value: g.location || '-' },
    { label: 'Đơn Vị Quản Lý', value: g.department || '-' },
  ]
})

// ======================= COMPUTED: POSITIONS =======================
const rawPositions = computed(() => systemDetail.value?.general?.positions || [])

const posColumns = [
  { label: 'Mã Node', key: 'position_code', width: '120px' },
  { label: 'Tên Chức Năng', key: 'position_name', width: '1fr' },
  { label: 'Thiết Bị Đang Gác', key: 'current_asset', width: '2fr' },
  { label: 'Trạng Thái', key: 'status', width: '100px' },
  { label: 'Ghi Chú', key: 'remarks', width: '1fr' },
]

const filteredPositions = computed(() => {
  const q = posFilter.value.toLowerCase()
  if (!q) return rawPositions.value
  return rawPositions.value.filter((p) =>
    String(p.position_code || '').toLowerCase().includes(q) ||
    String(p.position_name || '').toLowerCase().includes(q) ||
    String(p.remarks || '').toLowerCase().includes(q) ||
    String(p.current_asset?.name || '').toLowerCase().includes(q) ||
    String(p.current_asset?.asset_name || '').toLowerCase().includes(q)
  )
})

const visiblePositions = computed(() => {
  const sorted = [...filteredPositions.value].sort((a, b) => {
    const va = a[posSortField.value] ?? ''
    const vb = b[posSortField.value] ?? ''
    const cmp = String(va).localeCompare(String(vb))
    return posSortOrder.value === 'asc' ? cmp : -cmp
  })
  return sorted.slice(0, visibleCounts.positions)
})
const posHasMore = computed(() => visibleCounts.positions < filteredPositions.value.length)

function loadMorePositions() { visibleCounts.positions += tabPageStep }

// ======================= COMPUTED: DYNAMIC TABS =======================
const rawTabData = computed(() => {
  if (!systemDetail.value || activeTab.value === 'general') return []
  return systemDetail.value[activeTab.value] || []
})

const tabHeadersMap = {
  assets: [
    { label: 'Mã Tài Sản', key: 'name', width: '140px' },
    { label: 'Tên Thiết Bị', key: 'asset_name', width: '2fr' },
    { label: 'Vị Trí Node', key: 'custom_system_position', width: '120px' },
    { label: 'Trạng Thái', key: 'status', width: '100px' },
    { label: 'Kho / Trạm', key: 'location', width: '1fr' },
    { label: 'Ngày Mua', key: 'purchase_date', width: '110px' },
  ],
  maintenance: [
    { label: 'Phiếu Bảo Dưỡng', key: 'maintenance_name', width: '160px' },
    { label: 'Thiết Bị', key: 'asset_name', width: '2fr' },
    { label: 'Loại', key: 'maintenance_type', width: '100px' },
    { label: 'Trạng Thái', key: 'maintenance_status', width: '110px' },
    { label: 'Ngày Kế Hoạch', key: 'maintenance_date', width: '120px' },
    { label: 'Ngày Xong', key: 'completion_date', width: '120px' },
  ],
  repairs: [
    { label: 'Phiếu Sửa Chữa', key: 'name', width: '160px' },
    { label: 'Thiết Bị', key: 'asset_name', width: '2fr' },
    { label: 'Trạng Thái', key: 'repair_status', width: '110px' },
    { label: 'Ngày Hỏng', key: 'failure_date', width: '120px' },
    { label: 'Ngày Xong', key: 'completion_date', width: '120px' },
    { label: 'Chi Phí', key: 'repair_cost', width: '130px' },
  ],
  incidents: [
    { label: 'Mã Ticket', key: 'name', width: '140px' },
    { label: 'Tiêu Đề Sự Cố', key: 'subject', width: '2fr' },
    { label: 'Trạng Thái', key: 'status', width: '100px' },
    { label: 'Phân Loại', key: 'ticket_type', width: '120px' },
    { label: 'Thời Gian Báo', key: 'creation', width: '150px' },
  ],
}

const tabHeaders = computed(() => tabHeadersMap[activeTab.value] || [])

const filteredTabData = computed(() => {
  const q = tabFilter.value.toLowerCase()
  if (!q) return rawTabData.value
  const keys = tabHeaders.value.map((h) => h.key)
  return rawTabData.value.filter((row) =>
    keys.some((k) => String(row[k] || '').toLowerCase().includes(q))
  )
})

const visibleTabData = computed(() => {
  const sorted = [...filteredTabData.value].sort((a, b) => {
    const va = a[tabSortField.value] ?? ''
    const vb = b[tabSortField.value] ?? ''
    if (typeof va === 'number' && typeof vb === 'number') {
      return tabSortOrder.value === 'asc' ? va - vb : vb - va
    }
    const cmp = String(va).localeCompare(String(vb))
    return tabSortOrder.value === 'asc' ? cmp : -cmp
  })
  return sorted.slice(0, visibleCounts[activeTab.value] || tabPageStep)
})
const tabHasMore = computed(() => (visibleCounts[activeTab.value] || 0) < filteredTabData.value.length)

function loadMoreTab() { visibleCounts[activeTab.value] += tabPageStep }

// ======================= CELL HELPERS =======================
function isLinkColumn(key) { return ['name', 'maintenance_name'].includes(key) }

function getLinkUrl(row, key) {
  const v = row[key]
  if (activeTab.value === 'assets') return `/app/asset/${v}`
  if (activeTab.value === 'repairs') return `/app/asset-repair/${v}`
  if (activeTab.value === 'incidents') return `/app/hd-ticket/${v}`
  if (activeTab.value === 'maintenance' && key === 'maintenance_name') return `/app/asset-maintenance/${v}`
  return '#'
}

function isBadgeColumn(key) { return ['status', 'maintenance_status', 'repair_status'].includes(key) }

function getBadgeTheme(key, _value) {
  if (key === 'status' && activeTab.value === 'assets') return 'blue'
  if (key === 'maintenance_status') return 'orange'
  if (key === 'repair_status') return 'green'
  if (key === 'status' && activeTab.value === 'incidents') return 'red'
  return 'gray'
}

// ======================= WATCHERS =======================
watch(searchQuery, () => { mainPageSize.value = pageStep })
watch(activeTab, () => { tabFilter.value = ''; visibleCounts[activeTab.value] = tabPageStep })
watch(tabFilter, () => { visibleCounts[activeTab.value] = tabPageStep })
watch(posFilter, () => { visibleCounts.positions = tabPageStep })
</script>