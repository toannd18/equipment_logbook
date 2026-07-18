/**
 * useDashboard — Composable quản lý Bảng Điều Khiển:
 * - fetch dữ liệu KPI + charts
 * - trả về config cho frappe-ui chart components (NumberChart, DonutChart)
 */
import { computed } from 'vue'
import { createResource } from 'frappe-ui'
import { Radio, Wrench, HelpCircle, BarChart3 } from '@lucide/vue'

export function useDashboard() {
  const dashboardData = createResource({
    url: 'equipment_logbook.equipment_logbook.api.get_executive_dashboard_data',
    auto: true,
  })

  // Fetch systems list for criticality breakdown
  const systemsResource = createResource({
    url: 'equipment_logbook.equipment_logbook.api.get_systems_overview_list',
    auto: true,
  })

  // Chart data from API
  const chartData = computed(() => {
    const cd = dashboardData.data?.charts
    return {
      repairs: cd?.repairs_by_system || [],
      incidents: cd?.incidents_by_system || [],
    }
  })

  // Criticality breakdown from systems list
  const criticalityData = computed(() => {
    const systems = systemsResource.data || []
    const counts = {}
    systems.forEach((s) => {
      const c = s.criticality || 'Không XĐ'
      counts[c] = (counts[c] || 0) + 1
    })
    return Object.entries(counts).map(([status, count]) => ({ status, count }))
  })

  // KPI cards with icons & color accents
  const kpiCards = computed(() => {
    const k = dashboardData.data?.kpi
    if (!k) return []
    return [
      { title: 'Tổng Hệ Thống', value: k.total_systems ?? 0, icon: Radio, borderClass: 'border-l-4 border-l-blue-500', iconBgClass: 'bg-blue-100', iconColorClass: 'text-blue-600' },
      { title: 'Thiết Bị Đang Khai Thác', value: k.active_assets ?? 0, icon: BarChart3, borderClass: 'border-l-4 border-l-green-500', iconBgClass: 'bg-green-100', iconColorClass: 'text-green-600' },
      { title: 'Sửa Chữa Năm Nay', value: k.ytd_repairs ?? 0, icon: Wrench, borderClass: 'border-l-4 border-l-orange-400', iconBgClass: 'bg-orange-100', iconColorClass: 'text-orange-500' },
      { title: 'Ticket Mở', value: k.open_tickets ?? 0, icon: HelpCircle, borderClass: 'border-l-4 border-l-red-500', iconBgClass: 'bg-red-100', iconColorClass: 'text-red-600' },
    ]
  })

  // Donut chart configs
  const repairsChartConfig = computed(() => ({ title: 'Sửa Chữa Theo Hệ Thống', data: chartData.value.repairs, categoryColumn: 'label', valueColumn: 'count' }))
  const incidentsChartConfig = computed(() => ({ title: 'Sự Cố Theo Hệ Thống', data: chartData.value.incidents, categoryColumn: 'label', valueColumn: 'count' }))
  const statusChartConfig = computed(() => ({ title: 'Hệ Thống Theo Mức Độ Phân Cấp', data: criticalityData.value, categoryColumn: 'status', valueColumn: 'count' }))

  return { dashboardData, kpiCards, repairsChartConfig, incidentsChartConfig, statusChartConfig }
}
