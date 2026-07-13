/**
 * useTickets — Composable quản lý danh sách Ticket:
 * - fetch danh sách HD Ticket từ Frappe
 * - search, sort, card/table display
 */
import { ref, computed } from 'vue'
import { createListResource } from 'frappe-ui'

export function useTickets() {
  const searchQuery = ref('')
  const sortField = ref('creation')
  const sortOrder = ref('desc')

  const tickets = createListResource({
    doctype: 'HD Ticket',
    fields: ['name', 'subject', 'status', 'ticket_type', 'creation', 'modified'],
    orderBy: 'creation desc',
    pageLength: 20,
    auto: true,
  })

  const ticketColumns = [
    { label: 'Mã Ticket', key: 'name', width: '140px' },
    { label: 'Tiêu Đề', key: 'subject', width: '2fr' },
    { label: 'Trạng Thái', key: 'status', width: '110px' },
    { label: 'Phân Loại', key: 'ticket_type', width: '120px' },
    { label: 'Ngày Tạo', key: 'creation', width: '150px' },
  ]

  // Sort options
  const sortOptions = [
    { label: 'Ngày tạo', field: 'creation' },
    { label: 'Trạng thái', field: 'status' },
    { label: 'Phân loại', field: 'ticket_type' },
  ]

  function setSortField(field) {
    if (sortField.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      sortOrder.value = 'asc'
    }
  }

  // Search + Sort
  const filteredTickets = computed(() => {
    const q = searchQuery.value.toLowerCase()
    let data = tickets.data || []

    if (q) {
      data = data.filter(
        (t) =>
          String(t.name || '').toLowerCase().includes(q) ||
          String(t.subject || '').toLowerCase().includes(q)
      )
    }

    return [...data].sort((a, b) => {
      const va = a[sortField.value] ?? ''
      const vb = b[sortField.value] ?? ''
      const cmp = String(va).localeCompare(String(vb))
      return sortOrder.value === 'asc' ? cmp : -cmp
    })
  })

  function statusTheme(status) {
    const map = {
      Open: 'orange',
      'In Progress': 'blue',
      Resolved: 'green',
      Closed: 'gray',
      Replied: 'blue',
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

  return {
    searchQuery,
    sortField,
    sortOrder,
    sortOptions,
    setSortField,
    tickets,
    ticketColumns,
    filteredTickets,
    statusTheme,
    formatDate,
    openTicket,
  }
}
