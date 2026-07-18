<template>
  <div class="p-4 md:p-6">
    <!-- ── Page Header ── -->
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-2">
        <BarChart3 class="h-5 w-5 text-blue-600" />
        <h2 class="text-xl font-bold text-gray-900">Bảng Điều Khiển ATM</h2>
      </div>
      <div class="flex items-center gap-2">
        <Button
          icon="filter"
          :variant="showFilter ? 'solid' : 'subtle'"
          label="Lọc"
          @click="showFilter = !showFilter"
        />
        <Button
          icon-left="refresh-cw"
          variant="subtle"
          :loading="dashboardData.loading"
          @click="dashboardData.reload"
        >
          Làm mới
        </Button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div v-if="showFilter" class="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <span class="text-xs font-medium text-gray-500">Đơn vị:</span>
      <select v-model="filterCompany" class="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
        <option value="">Tất cả</option>
        <option value="ATM Corp">ATM Corp</option>
      </select>
    </div>

    <!-- Error -->
    <div v-if="dashboardData.error" class="mb-6 rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
      <AlertTriangle class="mr-1 inline-block h-4 w-4" />
      Không thể tải dữ liệu. Vui lòng thử lại.
    </div>

    <!-- Loading Skeleton -->
    <div v-if="dashboardData.loading && !dashboardData.data" class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div v-for="n in 4" :key="n" class="animate-pulse rounded-xl border bg-white p-5 shadow-sm">
        <div class="mb-3 h-8 w-1/2 rounded bg-gray-200"></div>
        <div class="h-4 w-3/4 rounded bg-gray-100"></div>
      </div>
    </div>

    <!-- KPI Cards -->
    <div v-if="kpiCards.length" class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="card in kpiCards"
        :key="card.title"
        class="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm"
        :class="card.borderClass"
      >
        <div
          class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
          :class="card.iconBgClass"
        >
          <component :is="card.icon" class="h-5 w-5" :class="card.iconColorClass" />
        </div>
        <div class="min-w-0">
          <NumberChart :config="{ title: card.title, value: card.value }" class="!border-0 !p-0 !shadow-none" />
        </div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <!-- Sửa Chữa Theo Hệ Thống -->
      <div class="rounded-xl border bg-white p-5 shadow-sm">
        <DonutChart v-if="repairsChartConfig.data.length" :config="repairsChartConfig" />
        <template v-else>
          <h3 class="mb-4 text-sm font-bold text-gray-700">{{ repairsChartConfig.title }}</h3>
          <div class="flex h-[240px] items-center justify-center text-sm text-gray-400">
            <div class="text-center">
              <BarChart3 class="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p>Không có dữ liệu</p>
            </div>
          </div>
        </template>
      </div>
      <!-- Sự Cố Theo Hệ Thống -->
      <div class="rounded-xl border bg-white p-5 shadow-sm">
        <DonutChart v-if="incidentsChartConfig.data.length" :config="incidentsChartConfig" />
        <template v-else>
          <h3 class="mb-4 text-sm font-bold text-gray-700">{{ incidentsChartConfig.title }}</h3>
          <div class="flex h-[240px] items-center justify-center text-sm text-gray-400">
            <div class="text-center">
              <BarChart3 class="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p>Không có dữ liệu</p>
            </div>
          </div>
        </template>
      </div>
      <!-- Hệ Thống Theo Mức Độ Phân Cấp -->
      <div class="rounded-xl border bg-white p-5 shadow-sm md:col-span-2">
        <DonutChart v-if="statusChartConfig.data.length" :config="statusChartConfig" />
        <template v-else>
          <h3 class="mb-4 text-sm font-bold text-gray-700">{{ statusChartConfig.title }}</h3>
          <div class="flex h-[240px] items-center justify-center text-sm text-gray-400">
            <div class="text-center">
              <BarChart3 class="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p>Không có dữ liệu</p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Button, NumberChart, DonutChart } from 'frappe-ui'
import { BarChart3, AlertTriangle, Radio, Wrench, HelpCircle } from '@lucide/vue'
import { useDashboard } from '@/composables/useDashboard'
import { ref } from 'vue'

const showFilter = ref(false)
const filterCompany = ref('')

const {
  dashboardData,
  kpiCards,
  repairsChartConfig,
  incidentsChartConfig,
  statusChartConfig,
} = useDashboard()
</script>