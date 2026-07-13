/**
 * useDashboard — Composable quản lý Bảng Điều Khiển:
 * - fetch dữ liệu KPI + charts
 * - render/destroy Frappe Charts an toàn
 */
import { ref, shallowRef, computed, nextTick, onBeforeUnmount } from 'vue'
import { createResource } from 'frappe-ui'
import { Chart } from 'frappe-charts'

export function useDashboard() {
  const repairsChartRef = ref(null)
  const incidentsChartRef = ref(null)
  const statusChartRef = ref(null)

  const repairsChartInstance = shallowRef(null)
  const incidentsChartInstance = shallowRef(null)
  const statusChartInstance = shallowRef(null)

  const dashboardData = createResource({
    url: 'equipment_logbook.equipment_logbook.api.get_executive_dashboard_data',
    auto: true,
    onSuccess() {
      nextTick(() => renderCharts())
    },
  })

  const chartData = computed(() => {
    const cd = dashboardData.data?.charts
    return {
      repairs: cd?.repairs_by_system || [],
      incidents: cd?.incidents_by_system || [],
      status: cd?.standby_vs_active || [],
    }
  })

  const kpiCards = computed(() => {
    const k = dashboardData.data?.kpi
    if (!k) return []
    return [
      { label: 'Tổng Hệ Thống', value: k.total_systems, borderClass: 'border-l-4 border-l-blue-500', textClass: 'text-blue-600', icon: '📡' },
      { label: 'Thiết Bị Đang Khai Thác', value: k.active_assets, borderClass: 'border-l-4 border-l-green-500', textClass: 'text-green-600', icon: '⚙️' },
      { label: 'Sửa Chữa Năm Nay', value: k.ytd_repairs, borderClass: 'border-l-4 border-l-orange-400', textClass: 'text-orange-500', icon: '🔧' },
      { label: 'Ticket Mở', value: k.open_tickets, borderClass: 'border-l-4 border-l-red-500', textClass: 'text-red-600', icon: '🎫' },
    ]
  })

  function renderCharts() {
    const doughnutColors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6']
    const pieColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280']

    drawChart(repairsChartRef.value, 'donut', chartData.value.repairs, doughnutColors, repairsChartInstance)
    drawChart(incidentsChartRef.value, 'donut', chartData.value.incidents, doughnutColors, incidentsChartInstance)
    drawChart(statusChartRef.value, 'pie', chartData.value.status, pieColors, statusChartInstance)
  }

  function drawChart(element, type, data, colors, instanceRef) {
    if (!element) return

    // 1. Hủy Chart cũ một cách an toàn
    if (instanceRef.value) {
      try {
        instanceRef.value.destroy()
      } catch (e) {
        console.warn('Bỏ qua lỗi dọn dẹp biểu đồ cũ')
      }
      instanceRef.value = null
    }

    // 2. Dọn sạch rác DOM
    element.innerHTML = ''

    // 3. Nếu không có dữ liệu thì dừng
    if (!data.length) return

    // 4. Tạo Chart mới
    instanceRef.value = new Chart(element, {
      type,
      height: 280,
      data: {
        labels: data.map((d) => d.label || d.status),
        datasets: [{ values: data.map((d) => d.count) }],
      },
      colors,
    })
  }

  onBeforeUnmount(() => {
    if (repairsChartInstance.value) repairsChartInstance.value.destroy()
    if (incidentsChartInstance.value) incidentsChartInstance.value.destroy()
    if (statusChartInstance.value) statusChartInstance.value.destroy()
  })

  return {
    repairsChartRef,
    incidentsChartRef,
    statusChartRef,
    dashboardData,
    chartData,
    kpiCards,
  }
}
