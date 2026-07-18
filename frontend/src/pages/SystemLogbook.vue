<template>
  <div class="flex h-full flex-col p-4 md:p-6">
    <!-- ==================== LIST VIEW ==================== -->
    <template v-if="viewState === 'list'">
      <!-- ── Page Header ── -->
      <div class="mb-5 flex flex-col gap-4">
        <!-- Title Row -->
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-2">
            <Database class="h-5 w-5 text-blue-600" />
            <h2 class="text-xl font-bold text-gray-900">Sổ Lý Lịch Hệ Thống</h2>
          </div>
          <div class="flex items-center gap-2">
            <!-- Search -->
            <FormControl
              v-model="searchQuery"
              type="text"
              placeholder="Tìm kiếm theo mã hoặc tên hệ thống..."
              class="w-full md:w-64"
            >
              <template #prefix>
                <Search class="h-4 w-4 text-gray-400" />
              </template>
            </FormControl>
            <!-- Filter -->
            <Button
              :label="showFilter ? 'Đang lọc' : 'Lọc'"
              icon="filter"
              :variant="showFilter ? 'solid' : 'subtle'"
              @click="showFilter = !showFilter"
            />
            <!-- Sort -->
            <Button
              icon="arrow-up"
              :variant="showSort ? 'solid' : 'subtle'"
              label="Sắp xếp"
              @click="toggleSort"
            />
            <!-- Refresh -->
            <Button
              icon="refresh-cw"
              variant="subtle"
              :loading="systemsResource.loading"
              @click="systemsResource.reload()"
            />
          </div>
        </div>
        <!-- Sort Bar (shown when sort is active) -->
        <div v-if="showSort" class="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <span class="text-xs font-medium text-gray-500">Sắp xếp theo:</span>
          <select
            v-model="sortField"
            class="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option v-for="opt in sortOptions" :key="opt.field" :value="opt.field">{{ opt.label }}</option>
          </select>
          <Button
            :icon="sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'"
            variant="ghost"
            size="sm"
            @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
          />
        </div>
        <!-- Filter Bar (shown when filter is active) -->
        <div v-if="showFilter" class="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <span class="text-xs font-medium text-gray-500">Lọc theo:</span>
          <select v-model="filterHealth" class="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt Động</option>
            <option value="degraded">Suy Giảm</option>
            <option value="maintenance">Bảo Trì</option>
            <option value="offline">Ngoại Tuyến</option>
            <option value="decommissioned">Ngừng HĐ</option>
          </select>
        </div>
      </div>

      <!-- DataListView: Desktop Table + Mobile Cards -->
      <DataListView
        :resource="systemsResource"
        :columns="listColumns"
        :card-fields="cardFields"
        row-key="name"
        :page-size="15"
        :search-query="searchQuery"
        :search-fields="['system_code', 'system_name', 'location', 'criticality']"
        :sort-field="sortField"
        :sort-order="sortOrder"
        :filters="{ health: filterHealth }"
        @row-click="openDetail"
      >
        <!-- Custom cell rendering for desktop table -->
        <template #cell="{ column, row, value }">
          <span v-if="column.key === 'system_code'" class="text-sm font-bold text-blue-600">
            {{ row.system_code || row.name }}
          </span>
          <span v-else-if="column.key === 'system_name'" class="text-sm font-medium text-gray-900">
            {{ row.system_name }}
          </span>
          <Badge v-else-if="column.key === 'health'" :theme="healthBadgeTheme(row.health)">
            {{ healthLabel(row.health) }}
          </Badge>
          <span v-else-if="column.key === 'location'" class="text-sm font-medium text-gray-900">
            {{ row.location }}
          </span>
          <span v-else-if="column.key === 'criticality'" class="text-sm font-medium text-gray-900">
            {{ row.criticality || '-' }}
          </span>
          <Badge v-else-if="column.key === 'asset_count'" theme="blue">
            {{ row.asset_count || 0 }}
          </Badge>
          <span
            v-else-if="column.key === 'open_ticket_count'"
            :class="row.open_ticket_count > 0 ? 'font-bold text-red-600' : 'text-gray-400'"
          >
            {{ row.open_ticket_count > 0 ? `${row.open_ticket_count} ⚠️` : '0' }}
          </span>
          <span v-else class="text-sm text-gray-700">{{ value ?? '-' }}</span>
        </template>

        <!-- Custom card rendering for mobile -->
        <template #card="{ row }">
          <div class="mb-2 flex items-start justify-between">
            <div>
              <span class="font-bold text-blue-600">{{ row.system_code || row.name }}</span>
              <p class="text-sm font-medium text-gray-800">{{ row.system_name }}</p>
            </div>
            <Badge :theme="healthBadgeTheme(row.health)">
              {{ healthLabel(row.health) }}
            </Badge>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div class="flex items-center gap-1">
              <MapPin class="h-3 w-3" />
              <span class="truncate">{{ row.location || '-' }}</span>
            </div>
            <div class="flex items-center gap-1">
              <Flag class="h-3 w-3" />
              <span>{{ row.criticality || '-' }}</span>
            </div>
            <div class="flex items-center gap-1">
              <Badge theme="blue" class="text-[10px]">{{ row.asset_count || 0 }}</Badge>
              <span>Thiết bị</span>
            </div>
            <div class="flex items-center gap-1" :class="row.open_ticket_count > 0 ? 'font-bold text-red-600' : ''">
              <span>{{ row.open_ticket_count > 0 ? `🚨 ${row.open_ticket_count}` : '0' }}</span>
              <span>Ticket</span>
            </div>
          </div>
        </template>
      </DataListView>
    </template>

    <!-- ==================== DETAIL VIEW ==================== -->
    <template v-else-if="viewState === 'detail'">
      <!-- Breadcrumb -->
      <nav class="mb-4 flex items-center text-sm text-gray-500">
        <button class="flex items-center gap-1 hover:text-blue-600 hover:underline" @click="backToList">
          <ArrowLeft class="h-3.5 w-3.5" />
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
          <Button
            v-for="tab in detailTabs"
            :key="tab.key"
            :variant="activeTab === tab.key ? 'solid' : 'subtle'"
            size="sm"
            class="flex-1 md:flex-none"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </Button>
        </div>

        <!-- Tab: General -->
        <div v-if="activeTab === 'general'" class="space-y-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="rounded-xl border bg-white p-5 shadow-sm">
              <h3 class="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700">
                <Info class="h-4 w-4 text-blue-500" />
                Thông Tin Định Danh
              </h3>
              <dl class="space-y-2 text-sm">
                <div
                  v-for="r in genRows"
                  :key="r.label"
                  class="flex justify-between border-b border-gray-50 py-1.5 last:border-0"
                >
                  <dt class="text-gray-500">{{ r.label }}</dt>
                  <dd class="font-medium text-gray-800" v-html="r.value"></dd>
                </div>
              </dl>
            </div>
            <div class="rounded-xl border bg-white p-5 shadow-sm">
              <h3 class="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700">
                <FileText class="h-4 w-4 text-blue-500" />
                Ghi Chú Kỹ Thuật
              </h3>
              <div
                v-if="systemDetail.general?.description"
                class="prose prose-sm text-gray-700"
                v-html="systemDetail.general.description"
              ></div>
              <span v-else class="text-sm italic text-gray-400">Không có mô tả chi tiết.</span>
            </div>
          </div>

          <!-- Positions -->
          <div v-if="rawPositions.length" class="rounded-xl border bg-white p-5 shadow-sm">
            <!-- Positions Toolbar -->
            <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h3 class="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Share2 class="h-4 w-4 text-blue-500" />
                Sơ Đồ Node ({{ rawPositions.length }} Vị Trí)
              </h3>
              <div class="flex items-center gap-2">
                <Button
                  icon="search"
                  :variant="showPosSearch ? 'solid' : 'subtle'"
                  :label="showPosSearch ? 'Đang tìm' : 'Tìm kiếm'"
                  @click="showPosSearch = !showPosSearch"
                />
                <Button
                  icon="arrow-up"
                  :variant="showPosSort ? 'solid' : 'subtle'"
                  :label="showPosSort ? 'Đang sắp xếp' : 'Sắp xếp'"
                  @click="showPosSort = !showPosSort"
                />
                <Button
                  icon="refresh-cw"
                  variant="subtle"
                  :loading="detailResource.loading"
                  @click="detailResource.reload()"
                />
              </div>
            </div>

            <!-- Search Bar -->
            <div v-if="showPosSearch" class="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <span class="text-xs font-medium text-gray-500">Tìm trong:</span>
              <select v-model="posSearchField" class="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Tất cả các trường</option>
                <option v-for="col in posColumns" :key="col.key" :value="col.key">{{ col.label }}</option>
              </select>
              <FormControl
                v-model="posFilter"
                type="text"
                placeholder="Nhập từ khóa tìm vị trí..."
                class="min-w-[180px] flex-1"
              />
            </div>

            <!-- Sort Bar -->
            <div v-if="showPosSort" class="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <span class="text-xs font-medium text-gray-500">Sắp xếp theo:</span>
              <select v-model="posSortField" class="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option v-for="col in posColumns" :key="col.key" :value="col.key">{{ col.label }}</option>
              </select>
              <Button
                :icon="posSortOrder === 'asc' ? 'arrow-up' : 'arrow-down'"
                variant="ghost"
                size="sm"
                @click="posSortOrder = posSortOrder === 'asc' ? 'desc' : 'asc'"
              />
            </div>

            <!-- Desktop Positions (guard against empty data) -->
            <div class="hidden w-full overflow-x-auto md:block">
              <ListView
                v-if="visiblePositions.length"
                :columns="posColumns"
                :rows="visiblePositions"
                :options="posListOptions"
                row-key="position_code"
              >
                <template #cell="{ column, row, value }">
                  <code
                    v-if="column.key === 'position_code'"
                    class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-bold text-blue-600"
                  >{{ row.position_code }}</code>
                  <span v-else-if="column.key === 'position_name'" class="text-sm text-gray-700">
                    {{ row.position_name }}
                  </span>
                  <div v-else-if="column.key === 'current_asset'">
                    <a
                      v-if="row.current_asset?.name"
                      :href="`/app/asset/${row.current_asset.name}`"
                      target="_blank"
                      class="text-xs text-gray-800 underline decoration-gray-300 hover:text-blue-600"
                    >
                      {{ row.current_asset.asset_name || row.current_asset.name }}
                    </a>
                    <span v-else class="text-sm italic text-gray-400">-- Trống --</span>
                  </div>
                  <span v-else-if="column.key === 'status'" class="text-sm text-gray-700">
                    <Badge v-if="row.current_asset?.status" theme="green">
                      {{ row.current_asset.status }}
                    </Badge>
                    <span v-else class="text-xs italic text-gray-400">-- Trống --</span>
                  </span>
                  <span
                    v-else-if="column.key === 'remarks'"
                    class="block max-w-[150px] truncate text-sm text-gray-700"
                  >{{ row.remarks || '-' }}</span>
                  <span v-else class="text-sm text-gray-700">{{ value || '-' }}</span>
                </template>
              </ListView>
              <!-- Empty state when filter returns no results -->
              <div v-else-if="rawPositions.length" class="py-10 text-center text-sm text-gray-400">
                <Inbox class="mx-auto mb-2 h-8 w-8" />
                <p>Không tìm thấy vị trí nào khớp với bộ lọc.</p>
              </div>
            </div>

            <!-- Mobile Positions -->
            <div class="space-y-3 md:hidden">
              <div
                v-for="p in visiblePositions"
                :key="p.position_code"
                class="rounded-xl border bg-white p-3 shadow-sm"
              >
                <div class="mb-1.5 flex items-start justify-between">
                  <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-bold text-blue-600">{{ p.position_code }}</code>
                  <Badge v-if="p.current_asset?.status" theme="green" class="text-[10px]">{{ p.current_asset.status }}</Badge>
                </div>
                <p class="text-sm font-medium text-gray-800">{{ p.position_name }}</p>
                <div class="mt-2 flex items-center gap-2 text-xs">
                  <Package class="h-3 w-3 text-gray-400" />
                  <a
                    v-if="p.current_asset?.name"
                    :href="`/app/asset/${p.current_asset.name}`"
                    target="_blank"
                    class="text-blue-600 underline"
                  >{{ p.current_asset.asset_name || p.current_asset.name }}</a>
                  <span v-else class="italic text-gray-400">-- Trống --</span>
                </div>
                <p class="mt-1 truncate text-xs text-gray-400">{{ p.remarks || '-' }}</p>
              </div>
            </div>

            <div class="mt-2 text-center">
              <Button
                v-if="posHasMore"
                variant="subtle"
                size="sm"
                class="w-full md:w-auto"
                @click="loadMorePositions"
              >
                Xem thêm ({{ filteredPositions.length - visiblePositions.length }})
              </Button>
            </div>
          </div>
        </div>

        <!-- Tab: Dynamic (assets, maintenance, repairs, incidents) — uses DataListView -->
        <div v-else class="flex flex-1 flex-col">
          <!-- Toolbar: Search + Sort + Refresh -->
          <div class="mb-4 flex items-center justify-end gap-2">
            <Button
              icon="search"
              :variant="showTabSearch ? 'solid' : 'subtle'"
              :label="showTabSearch ? 'Đang tìm' : 'Tìm kiếm'"
              @click="showTabSearch = !showTabSearch"
            />
            <Button
              icon="arrow-up"
              :variant="showTabSort ? 'solid' : 'subtle'"
              :label="showTabSort ? 'Đang sắp xếp' : 'Sắp xếp'"
              @click="showTabSort = !showTabSort"
            />
            <Button
              icon="refresh-cw"
              variant="subtle"
              :loading="detailResource.loading"
              @click="detailResource.reload()"
            />
          </div>

          <!-- Search Bar for tabs -->
          <div v-if="showTabSearch" class="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <span class="text-xs font-medium text-gray-500">Tìm trong:</span>
            <select v-model="tabSearchField" class="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">Tất cả các trường</option>
              <option v-for="h in tabHeaders" :key="h.key" :value="h.key">{{ h.label }}</option>
            </select>
            <FormControl
              v-model="tabFilter"
              type="text"
              :placeholder="`Nhập từ khóa tìm trong ${tabLabel}...`"
              class="min-w-[180px] flex-1"
            />
          </div>

          <!-- Sort Bar for tabs -->
          <div v-if="showTabSort" class="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <span class="text-xs font-medium text-gray-500">Sắp xếp theo:</span>
            <select v-model="tabSortField" class="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option v-for="h in tabHeaders" :key="h.key" :value="h.key">{{ h.label }}</option>
            </select>
            <Button
              :icon="tabSortOrder === 'asc' ? 'arrow-up' : 'arrow-down'"
              variant="ghost"
              size="sm"
              @click="tabSortOrder = tabSortOrder === 'asc' ? 'desc' : 'asc'"
            />
          </div>

          <DataListView
            :data="rawTabData"
            :columns="tabHeaders"
            :card-fields="tabCardFields"
            :row-key="activeTab === 'maintenance' ? 'log_name' : 'name'"
            :page-size="10"
            :search-query="tabFilter"
            :search-fields="tabSearchField ? [tabSearchField] : tabSearchFields"
            :sort-field="tabSortField"
            :sort-order="tabSortOrder"
          >
            <!-- Custom cell rendering for desktop -->
            <template #cell="{ column, row, value }">
              <a
                v-if="isLinkColumn(column.key)"
                :href="getLinkUrl(row, column.key)"
                target="_blank"
                class="text-xs font-medium text-blue-600 underline decoration-gray-300 hover:text-blue-800"
              >{{ row[column.key] }}</a>
              <Badge
                v-else-if="isBadgeColumn(column.key)"
                :theme="getBadgeTheme(column.key, row[column.key])"
              >{{ row[column.key] }}</Badge>
              <code
                v-else-if="column.key === 'custom_system_position' && row.custom_system_position"
                class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-bold text-gray-700"
              >{{ row.custom_system_position }}</code>
              <span v-else-if="column.key === 'custom_system_position'" class="text-xs italic text-gray-400">Kho Standby</span>
              <span v-else-if="column.key === 'repair_cost'" class="text-sm text-gray-700">{{ formatVND(row.repair_cost) }}</span>
              <span v-else class="text-sm text-gray-700">{{ row[column.key] ?? '-' }}</span>
            </template>

            <!-- Custom card rendering for mobile -->
            <template #card="{ row }">
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
            </template>
          </DataListView>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import {
  Button,
  Badge,
  ListView,
  FormControl,
  Spinner,
  createResource,
} from 'frappe-ui'
import {
  Database,
  Search,
  MapPin,
  Flag,
  ArrowLeft,
  Info,
  FileText,
  Share2,
  Package,
  Inbox,
} from '@lucide/vue'
import DataListView from '@/components/DataListView.vue'

// ────────────────────────────────────────────────────────
// State
// ────────────────────────────────────────────────────────
const viewState = ref('list')
const selectedSystem = ref(null)
const searchQuery = ref('')
const activeTab = ref('general')
const tabFilter = ref('')
const posFilter = ref('')
const showPosSearch = ref(false)
const posSearchField = ref('')
const showPosSort = ref(false)
const posSortField = ref('position_code')
const posSortOrder = ref('asc')

// Tab-level sort & search (for detail dynamic tabs)
const showTabSort = ref(false)
const tabSortField = ref('name')
const tabSortOrder = ref('asc')
const showTabSearch = ref(false)
const tabSearchField = ref('')

// Reset tab state when switching tabs
watch(activeTab, () => {
  tabFilter.value = ''
  const defaultSort = { assets: 'name', maintenance: 'maintenance_date', repairs: 'failure_date', incidents: 'creation' }
  tabSortField.value = defaultSort[activeTab.value] || 'name'
  tabSortOrder.value = 'asc'
  showTabSort.value = false
  showTabSearch.value = false
  tabSearchField.value = ''
})

// Tab metadata
const tabLabel = computed(() => {
  const map = { assets: 'thiết bị', maintenance: 'bảo trì', repairs: 'sửa chữa', incidents: 'sự cố' }
  return map[activeTab.value] || 'dữ liệu'
})

const tabFilterLabel = computed(() => {
  const map = { assets: 'trạng thái', maintenance: 'trạng thái', repairs: 'trạng thái', incidents: 'trạng thái' }
  return map[activeTab.value] || 'trạng thái'
})

const tabFilterOptions = computed(() => {
  const map = {
    assets: [
      { label: 'Submitted', value: 'Submitted' },
      { label: 'Partially Depreciated', value: 'Partially Depreciated' },
    ],
    maintenance: [
      { label: 'Planned', value: 'Planned' },
      { label: 'Completed', value: 'Completed' },
      { label: 'Overdue', value: 'Overdue' },
    ],
    repairs: [
      { label: 'Open', value: 'Open' },
      { label: 'In Progress', value: 'In Progress' },
      { label: 'Completed', value: 'Completed' },
    ],
    incidents: [
      { label: 'Open', value: 'Open' },
      { label: 'In Progress', value: 'In Progress' },
      { label: 'Resolved', value: 'Resolved' },
      { label: 'Closed', value: 'Closed' },
    ],
  }
  return map[activeTab.value] || []
})

// Sort & Filter
const showSort = ref(false)
const sortField = ref('system_code')
const sortOrder = ref('asc')
const showFilter = ref(false)
const filterHealth = ref('')

const sortOptions = [
  { label: 'Mã Hệ Thống', field: 'system_code' },
  { label: 'Tên Hệ Thống', field: 'system_name' },
  { label: 'Sức Khỏe', field: 'health' },
  { label: 'Phân Cấp', field: 'criticality' },
  { label: 'Vị Trí', field: 'location' },
  { label: 'Thiết Bị', field: 'asset_count' },
  { label: 'Ticket', field: 'open_ticket_count' },
]

function toggleSort() {
  showSort.value = !showSort.value
}

const visibleCounts = reactive({
  assets: 10, maintenance: 10, repairs: 10, incidents: 10, positions: 10,
})
const tabPageStep = 10

// ────────────────────────────────────────────────────────
// API Resources
// ────────────────────────────────────────────────────────
const systemsResource = createResource({
  url: 'equipment_logbook.equipment_logbook.api.get_systems_overview_list',
  auto: true,
})

const detailResource = createResource({
  url: 'equipment_logbook.equipment_logbook.api.get_system_logbook_detail',
  auto: false,
})

// ────────────────────────────────────────────────────────
// Column definitions for DataListView (list view)
// ────────────────────────────────────────────────────────
const listColumns = [
  { key: 'system_code', label: 'Mã Hệ Thống', width: '150px' },
  { key: 'system_name', label: 'Tên Hệ Thống', width: '1.5fr' },
  { key: 'health', label: 'Sức Khỏe', width: '100px' },
  { key: 'criticality', label: 'Phân Cấp', width: '1fr' },
  { key: 'location', label: 'Vị Trí', width: '1fr' },
  { key: 'asset_count', label: 'Thiết Bị', width: '50px' },
  { key: 'open_ticket_count', label: 'Ticket', width: '50px' },
]

// Card fields cho mobile card view
const cardFields = [
  { key: 'system_code', label: 'Mã' },
  { key: 'system_name', label: 'Tên' },
  { key: 'health', label: 'Sức Khỏe' },
  { key: 'location', label: 'Vị Trí' },
  { key: 'asset_count', label: 'Thiết Bị' },
  { key: 'open_ticket_count', label: 'Ticket' },
]

// ────────────────────────────────────────────────────────
// Formatters
// ────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────
// Navigation
// ────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────
// Detail: General
// ────────────────────────────────────────────────────────
const systemDetail = computed(() => detailResource.data)

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
    { label: 'Trạng Thái', value: healthLabel((g.status || '').toLowerCase()) || '-' },
    { label: 'Phân Cấp', value: g.criticality || '-' },
    { label: 'Vị Trí / Trạm', value: g.location || '-' },
    { label: 'Đơn Vị Quản Lý', value: g.department || '-' },
  ]
})

// ────────────────────────────────────────────────────────
// Detail: Positions
// ────────────────────────────────────────────────────────
const rawPositions = computed(() => systemDetail.value?.general?.positions || [])

const posColumns = [
  { label: 'Mã Node', key: 'position_code', width: '120px' },
  { label: 'Tên Chức Năng', key: 'position_name', width: '1fr' },
  { label: 'Thiết Bị Đang Gác', key: 'current_asset', width: '2fr' },
  { label: 'Trạng Thái', key: 'status', width: '100px' },
  { label: 'Ghi Chú', key: 'remarks', width: '1fr' },
]

const posListOptions = {
  selectable: false,
  showTooltip: false,
  emptyState: { title: 'Không có vị trí', description: 'Không tìm thấy vị trí nào.' },
}

const filteredPositions = computed(() => {
  let data = rawPositions.value
  const q = posFilter.value.toLowerCase()

  // Search filter
  if (q) {
    if (posSearchField.value) {
      // Search in specific field
      data = data.filter((p) => {
        const val = posSearchField.value === 'current_asset'
          ? (p.current_asset?.name || '') + ' ' + (p.current_asset?.asset_name || '')
          : String(p[posSearchField.value] || '')
        return val.toLowerCase().includes(q)
      })
    } else {
      // Search in all fields
      data = data.filter((p) =>
        String(p.position_code || '').toLowerCase().includes(q) ||
        String(p.position_name || '').toLowerCase().includes(q) ||
        String(p.remarks || '').toLowerCase().includes(q) ||
        String(p.current_asset?.name || '').toLowerCase().includes(q) ||
        String(p.current_asset?.asset_name || '').toLowerCase().includes(q)
      )
    }
  }

  // Sort
  if (posSortField.value) {
    const dir = posSortOrder.value === 'desc' ? -1 : 1
    data = [...data].sort((a, b) => {
      const va = posSortField.value === 'current_asset'
        ? (a.current_asset?.asset_name || a.current_asset?.name || '')
        : (a[posSortField.value] ?? '')
      const vb = posSortField.value === 'current_asset'
        ? (b.current_asset?.asset_name || b.current_asset?.name || '')
        : (b[posSortField.value] ?? '')
      return dir * String(va).localeCompare(String(vb))
    })
  }

  return data
})

const visiblePositions = computed(() => filteredPositions.value.slice(0, visibleCounts.positions))
const posHasMore = computed(() => visibleCounts.positions < filteredPositions.value.length)

function loadMorePositions() { visibleCounts.positions += tabPageStep }

// ────────────────────────────────────────────────────────
// Detail: Dynamic Tabs (assets, maintenance, repairs, incidents)
// ────────────────────────────────────────────────────────
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

// Card fields & search fields for DataListView (dynamic per active tab)
const tabCardFieldsMap = {
  assets: [
    { key: 'name', label: 'Mã Tài Sản' },
    { key: 'asset_name', label: 'Tên' },
    { key: 'status', label: 'Trạng Thái' },
    { key: 'location', label: 'Vị Trí' },
  ],
  maintenance: [
    { key: 'maintenance_name', label: 'Phiếu BD' },
    { key: 'asset_name', label: 'Thiết Bị' },
    { key: 'maintenance_status', label: 'Trạng Thái' },
    { key: 'maintenance_date', label: 'Ngày KH' },
  ],
  repairs: [
    { key: 'name', label: 'Phiếu SC' },
    { key: 'asset_name', label: 'Thiết Bị' },
    { key: 'repair_status', label: 'Trạng Thái' },
    { key: 'failure_date', label: 'Ngày Hỏng' },
  ],
  incidents: [
    { key: 'name', label: 'Mã Ticket' },
    { key: 'subject', label: 'Tiêu Đề' },
    { key: 'status', label: 'Trạng Thái' },
    { key: 'creation', label: 'Ngày Tạo' },
  ],
}

const tabCardFields = computed(() => tabCardFieldsMap[activeTab.value] || [])

const tabSearchFieldsMap = {
  assets: ['name', 'asset_name', 'location'],
  maintenance: ['maintenance_name', 'asset_name', 'maintenance_type'],
  repairs: ['name', 'asset_name', 'repair_status'],
  incidents: ['name', 'subject', 'ticket_type'],
}

const tabSearchFields = computed(() => tabSearchFieldsMap[activeTab.value] || [])

// Link helpers
function isLinkColumn(key) {
  return ['name', 'maintenance_name'].includes(key)
}

function getLinkUrl(row, key) {
  if (activeTab.value === 'assets') return `/app/asset/${row.name}`
  if (activeTab.value === 'maintenance') return `/app/asset-maintenance/${row.maintenance_name}`
  if (activeTab.value === 'repairs') return `/app/asset-repair/${row.name}`
  if (activeTab.value === 'incidents') return `/app/hd-ticket/${row.name}`
  return '#'
}

function isBadgeColumn(key) {
  return ['status', 'repair_status', 'maintenance_status'].includes(key)
}

function getBadgeTheme(key, value) {
  if (key === 'status' || key === 'repair_status') {
    const map = { 'Completed': 'green', 'In Progress': 'blue', 'Open': 'orange', 'Closed': 'gray' }
    return map[value] || 'gray'
  }
  if (key === 'maintenance_status') {
    const map = { 'Planned': 'blue', 'Completed': 'green', 'Overdue': 'red' }
    return map[value] || 'gray'
  }
  return 'gray'
}
</script>
