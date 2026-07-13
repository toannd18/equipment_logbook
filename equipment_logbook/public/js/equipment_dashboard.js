frappe.provide("equipment_logbook");

frappe.pages["equipment-dashboard"].on_page_load = function (wrapper) {
    frappe.require("https://unpkg.com/vue@3/dist/vue.global.prod.js", function () {
        equipment_logbook.init_vue_dashboard(wrapper);
    });
};

function _cssVar(name) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || undefined;
}

equipment_logbook.init_vue_dashboard = function (wrapper) {
    wrapper.innerHTML = '<div id="vue-dashboard-app"></div>';

    var DashboardApp = {
        template: `<div class="p-3" style="font-family:var(--font-stack,Inter,sans-serif);color:var(--text-color);">

<!-- Error State -->
<div v-if="error" class="text-center p-5 text-muted">&#9888; {{ __('Không thể tải dữ liệu. Vui lòng thử lại.') }}</div>

<template v-else>
<!-- ====== HEADER CONTROLS ====== -->
<div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
<div>
<h5 class="fw-bold mb-0">&#128202; {{ __('Bảng Điều Khiển ATM') }}</h5>
</div>
<div class="d-flex gap-2 align-items-center">
<button class="btn btn-outline-secondary btn-sm" :disabled="loading" @click="loadData">
<span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
{{ loading ? __('Đang tải...') : '&#8635; ' + __('Làm mới') }}
</button>
</div>
</div>

<!-- ====== SKELETON LOADING (KPI Cards) ====== -->
<div v-if="loading && !kpi" class="row g-3 mb-4">
<div v-for="n in 4" :key="n" class="col-12 col-md-6 col-lg-3">
<div class="card border rounded shadow-sm" style="background:var(--card-bg);">
<div class="card-body p-4 text-center">
<div class="placeholder-glow">
<span class="placeholder col-8 mb-3" style="height:2.5rem;border-radius:8px;"></span>
<span class="placeholder col-6" style="height:1rem;"></span>
</div>
</div></div></div></div>

<!-- ====== KPI CARDS ====== -->
<template v-if="kpi">
<div class="row g-3 mb-4">
<div v-for="c in kpiCards" :key="c.label" class="col-12 col-md-6 col-lg-3">
<div class="card border rounded shadow-sm" style="background:var(--card-bg);border-left:4px solid;"
:style="{borderLeftColor: c.borderColor}">
<div class="card-body p-3">
<div class="d-flex justify-content-between align-items-start mb-1">
<div style="font-size:2rem;font-weight:700;" :style="{color: c.cssVar}">{{ c.value || 0 }}</div>
<span style="font-size:1.5rem;">{{ c.icon }}</span>
</div>
<div class="text-muted small fw-medium">{{ c.label }}</div>
</div></div></div></div>
</template>

<!-- ====== SKELETON LOADING (Charts) ====== -->
<div v-else class="row g-3 mb-4">
<div v-for="n in 3" :key="'sk'+n" :class="'col-12 ' + (n===3 ? '' : 'col-lg-6')">
<div class="card border rounded shadow-sm" style="background:var(--card-bg);">
<div class="card-body p-3">
<div class="placeholder-glow">
<span class="placeholder col-4 mb-3" style="height:1.2rem;"></span>
<span class="placeholder col-12" :style="'height:' + chartHeight + 'px;border-radius:8px;'"></span>
</div>
</div></div></div></div>

<!-- ====== CHARTS ====== -->
<div v-if="kpi" class="row g-3">
<div v-for="ch in charts" :key="ch.id" :class="'col-12 ' + (ch.full ? '' : 'col-lg-6')">
<div class="card border rounded shadow-sm" style="background:var(--card-bg);">
<div class="card-body p-3">
<h6 class="fw-bold mb-3">{{ ch.title }}</h6>
<div :id="ch.id" class="chart-container" :style="'height:' + chartHeight + 'px;'"></div>
</div></div></div></div>
</template></div>`,

        data: function () {
            return {
                loading: true,
                error: false,
                kpi: null,
                chartData: null,
            };
        },

        computed: {
            chartHeight: function () {
                return window.innerWidth < 768 ? 200 : 280;
            },
            kpiCards: function () {
                if (!this.kpi) return [];
                var k = this.kpi;
                return [
                    { label: __("Tổng Hệ Thống"), value: k.total_systems, cssVar: "var(--primary-color)", borderColor: "var(--primary-color)", icon: "\ud83d\udce1" },
                    { label: __("Thiết Bị Đang Khai Thác"), value: k.active_assets, cssVar: "var(--green-500)", borderColor: "var(--green-500)", icon: "\u2699\ufe0f" },
                    { label: __("Sửa Chữa Năm Nay"), value: k.ytd_repairs, cssVar: "var(--orange-500)", borderColor: "var(--orange-500)", icon: "\ud83d\udd27" },
                    { label: __("Ticket Mở"), value: k.open_tickets, cssVar: "var(--red-500)", borderColor: "var(--red-500)", icon: "\ud83c\udfab" },
                ];
            },
            charts: function () {
                return [
                    { id: "repairs-chart",  title: "\ud83d\udd27 " + __("Sửa Chữa Theo Hệ Thống"), full: false },
                    { id: "incidents-chart", title: "\ud83d\udea8 " + __("Sự Cố Theo Hệ Thống"), full: false },
                    { id: "status-chart",    title: "\ud83d\udcca " + __("Trạng Thái Thiết Bị"), full: true },
                ];
            },
        },

        methods: {
            loadData: function () {
                var self = this;
                self.loading = true;
                self.error = false;
                frappe.call({
                    method: "equipment_logbook.equipment_logbook.api.get_executive_dashboard_data",
                    callback: function (r) {
                        if (!r.message) { self.loading = false; return; }
                        self.kpi = r.message.kpi;
                        self.chartData = r.message.charts;
                        self.loading = false;
                        self.$nextTick(function () { self.renderCharts(); });
                    },
                    error: function () {
                        self.loading = false;
                        self.error = true;
                    },
                });
            },
            renderCharts: function () {
                var cd = this.chartData;
                if (!cd) return;
                var h = this.chartHeight;
                var doughnutColors = [
                    _cssVar("--blue-500") || "#3b82f6",
                    _cssVar("--red-500") || "#ef4444",
                    _cssVar("--orange-500") || "#f59e0b",
                    _cssVar("--green-400") || "#10b981",
                    _cssVar("--purple-500") || "#8b5cf6",
                ];
                var pieColors = [
                    _cssVar("--green-500") || "#22c55e",
                    _cssVar("--blue-500") || "#3b82f6",
                    _cssVar("--orange-500") || "#f59e0b",
                    _cssVar("--red-500") || "#ef4444",
                    _cssVar("--gray-500") || "#6b7280",
                ];
                this._renderChart("repairs-chart", "donut", cd.repairs_by_system || [], doughnutColors, h);
                this._renderChart("incidents-chart", "donut", cd.incidents_by_system || [], doughnutColors, h);
                this._renderChart("status-chart", "pie", cd.standby_vs_active || [], pieColors, h);
            },
            _renderChart: function (id, type, data, colors, height) {
                var el = document.getElementById(id);
                if (!el) return;
                var $el = $(el);
                if (!data.length) {
                    $el.html('<span style="color:var(--text-muted);font-style:italic;">\ud83d\udced ' + __("Chưa có số liệu thống kê") + '</span>');
                    return;
                }
                new frappe.Chart(el, {
                    type: type,
                    height: height || 280,
                    data: {
                        labels: data.map(function (d) { return d.label || d.status; }),
                        datasets: [{ values: data.map(function (d) { return d.count; }) }],
                    },
                    colors: colors,
                });
            },
        },

        mounted: function () {
            this.loadData();
            var self = this;
            window.addEventListener("resize", function () { /* triggers chartHeight recompute on next render */ });
        },
    };

    var app = window.Vue.createApp(DashboardApp);
    app.mount("#vue-dashboard-app");
};