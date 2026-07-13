<template>
  <div class="p-4 md:p-6">
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-2">
        <FeatherIcon name="bar-chart-2" class="h-5 w-5 text-blue-600" />
        <h2 class="text-xl font-bold text-gray-900">Bảng Điều Khiển ATM</h2>
      </div>
      <Button
        icon-left="refresh-cw"
        variant="subtle"
        :loading="dashboardData.loading"
        class="w-full md:w-auto"
        @click="dashboardData.reload"
      >
        Làm mới
      </Button>
    </div>

    <div v-if="dashboardData.error" class="mb-6 rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
      <FeatherIcon name="alert-triangle" class="mr-1 inline-block h-4 w-4" />
      Không thể tải dữ liệu. Vui lòng thử lại.
    </div>

    <div v-if="dashboardData.loading && !dashboardData.data" class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div v-for="n in 4" :key="n" class="animate-pulse rounded-xl border bg-white p-5 shadow-sm">
        <div class="mb-3 h-8 w-1/2 rounded bg-gray-200"></div>
        <div class="h-4 w-3/4 rounded bg-gray-100"></div>
      </div>
    </div>

    <div v-if="kpiCards.length" class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="card in kpiCards"
        :key="card.label"
        class="rounded-xl border bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5"
        :class="card.borderClass"
      >
        <div class="mb-1 flex items-start justify-between">
          <span class="text-3xl font-bold" :class="card.textClass">{{ card.value ?? 0 }}</span>
          <span class="text-2xl">{{ card.icon }}</span>
        </div>
        <p class="text-sm font-medium text-gray-500">{{ card.label }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      
      <div class="w-full overflow-x-auto rounded-xl border bg-white p-5 shadow-sm">
        <h3 class="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700">
          <FeatherIcon name="tool" class="h-4 w-4 text-orange-500" />
          Sửa Chữa Theo Hệ Thống
        </h3>
        <div v-show="!chartData.repairs.length" class="flex h-[280px] w-full items-center justify-center text-sm italic text-gray-400">📭 Chưa có số liệu</div>
        <div v-show="chartData.repairs.length" ref="repairsChartRef" class="h-[280px] w-full"></div>
      </div>

      <div class="rounded-xl border bg-white p-5 shadow-sm">
        <h3 class="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700">
          <FeatherIcon name="alert-circle" class="h-4 w-4 text-red-500" />
          Sự Cố Theo Hệ Thống
        </h3>
        <div v-show="!chartData.incidents.length" class="flex h-[280px] w-full items-center justify-center text-sm italic text-gray-400">📭 Chưa có số liệu</div>
        <div v-show="chartData.incidents.length" ref="incidentsChartRef" class="h-[280px] w-full"></div>
      </div>

      <div class="rounded-xl border bg-white p-5 shadow-sm md:col-span-2">
        <h3 class="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700">
          <FeatherIcon name="pie-chart" class="h-4 w-4 text-blue-500" />
          Trạng Thái Thiết Bị
        </h3>
        <div v-show="!chartData.status.length" class="flex h-[280px] w-full items-center justify-center text-sm italic text-gray-400">📭 Chưa có số liệu</div>
        <div v-show="chartData.status.length" ref="statusChartRef" class="h-[280px] w-full"></div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { Button, FeatherIcon } from 'frappe-ui'
import { useDashboard } from '@/composables/useDashboard'

const {
  repairsChartRef,
  incidentsChartRef,
  statusChartRef,
  dashboardData,
  chartData,
  kpiCards,
} = useDashboard()
</script>