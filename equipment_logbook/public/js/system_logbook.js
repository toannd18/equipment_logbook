frappe.provide("equipment_logbook");

frappe.pages["system-logbook"].on_page_load = function (wrapper) {
    frappe.require("https://unpkg.com/vue@3/dist/vue.global.prod.js", function () {
        equipment_logbook.init_vue_logbook(wrapper);
    });
};

equipment_logbook.init_vue_logbook = function (wrapper) {
    wrapper.innerHTML = '<div id="vue-logbook-app"></div>';

    var SystemLogbookApp = {
        template: `<div class="p-3" style="font-family:var(--font-stack,Inter,sans-serif);color:var(--text-color);">

<!--  ======  LIST VIEW  ======  -->
<template v-if="viewState==='list'">
<div v-if="loading" class="text-center p-5"><span class="spinner" style="width:30px;height:30px;"></span></div>
<div v-else-if="error" class="text-center p-5 text-muted">&#9888; {{ __('Không thể tải dữ liệu.') }}</div>
<div v-else-if="!systems.length" class="text-center p-5 text-muted">&#128123; {{ __('Không có hệ thống ATM nào.') }}</div>

<template v-else>
<div class="mb-3">
<input type="text" class="form-control form-control-sm" v-model="searchQuery"
:placeholder="__('Tìm kiếm theo mã hoặc tên hệ thống...')"
style="max-width:360px;background:var(--bg-color);color:var(--text-color);border:1px solid var(--border-color);">
<span v-if="searchQuery" class="btn btn-default btn-sm ms-2" @click="searchQuery=''">&#10005;</span>
</div>
<div class="d-none d-md-block" style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:var(--border-radius-md,8px);box-shadow:var(--shadow-sm);overflow-x:auto;">
<table class="table table-hover table-bordered mb-0">
<thead class="border-bottom"><tr>
<th v-for="h in sortableHeaders" :key="h.key" @click="sortBy(h.key)" class="fw-bold" style="cursor:pointer;user-select:none;">
{{ h.text }} <span v-if="sortKey===h.key">{{ sortAsc ? '\\u2191' : '\\u2193' }}</span>
</th></tr></thead><tbody>
<tr v-for="s in visibleSystems" :key="s.name" @click="openDetail(s)" style="cursor:pointer;">
<td><strong style="color:var(--primary-color);">{{ s.system_code || s.name }}</strong></td>
<td class="fw-medium">{{ s.system_name }}</td>
<td><span class="health-badge" :style="healthStyle(s.health)">{{ healthLabel(s.health) }}</span></td>
<td>{{ s.criticality || '-' }}</td>
<td>{{ s.location || '-' }}</td>
<td><span class="badge badge-primary fw-bold">{{ s.asset_count || 0 }}</span></td>
<td><span v-if="s.open_ticket_count>0" class="text-danger fw-bold">{{ s.open_ticket_count }} &#9888;</span><span v-else class="text-muted">0</span></td>
</tr></tbody></table>
<div class="text-center p-3">
<button v-if="mainHasMore" class="btn btn-default btn-sm" @click="loadMoreMain">{{ __('Xem thêm') }} ({{ sortedSystems.length - visibleSystems.length }} {{ __('còn lại') }})</button>
<span v-else class="small text-muted">{{ __('Đã hiển thị tất cả') }} {{ sortedSystems.length }} {{ __('hệ thống') }}</span>
</div></div>
<div class="d-flex flex-column d-md-none gap-2">
<div v-for="s in visibleSystems" :key="s.name" @click="openDetail(s)"
style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:var(--border-radius-md,8px);padding:14px 16px;cursor:pointer;box-shadow:var(--shadow-sm);">
<div class="d-flex justify-content-between align-items-center mb-2">
<span class="fw-bold" style="color:var(--primary-color);font-size:14px;">{{ s.system_code || s.name }}</span>
<span class="health-badge" :style="healthStyle(s.health)">{{ healthLabel(s.health) }}</span></div>
<div class="fw-semibold mb-2" style="font-size:15px;">{{ s.system_name || '-' }}</div>
<div class="row g-1" style="font-size:12px;color:var(--text-muted);">
<span class="col-6">&#128205; {{ s.location || '-' }}</span><span class="col-6">&#127991; {{ s.criticality || '-' }}</span>
<span class="col-6">&#128230; {{ __('Thiết Bị') }}: {{ s.asset_count || 0 }}</span><span class="col-6">&#128680; {{ __('Ticket') }}: {{ s.open_ticket_count || 0 }}</span>
</div></div>
<div class="text-center p-2">
<button v-if="mainHasMore" class="btn btn-default btn-sm" @click="loadMoreMain">{{ __('Xem thêm') }} ({{ sortedSystems.length - visibleSystems.length }})</button>
<span v-else class="small text-muted">{{ __('Đã hiển thị tất cả') }} {{ sortedSystems.length }} {{ __('hệ thống') }}</span>
</div></div></template></template>

<!--  ======  DETAIL VIEW  ======  -->
<template v-else-if="viewState==='detail'">
<nav aria-label="breadcrumb" class="mb-3">
<ol class="breadcrumb">
<li class="breadcrumb-item"><a href="#" @click.prevent="viewState='list';systemDetail=null">{{ __('Sổ Lý Lịch Hệ Thống') }}</a></li>
<li class="breadcrumb-item active">{{ selectedSystem.system_name || selectedSystem.name }}</li>
</ol></nav>
<div class="mb-3"><span class="text-muted small">ID: <code>{{ selectedSystem.name }}</code></span></div>

<div v-if="detailLoading" class="text-center p-5"><span class="spinner" style="width:30px;height:30px;"></span></div>
<div v-else-if="detailError" class="alert alert-warning">{{ __('Không có dữ liệu cho hệ thống này.') }}</div>

<template v-else-if="systemDetail">
<div class="mb-3 border-bottom pb-2 d-flex gap-1 flex-wrap">
<button v-for="t in detailTabs" :key="t.key" :class="'btn btn-sm fw-medium '+(activeTab===t.key?'btn-primary':'btn-default')" @click="activeTab=t.key">{{ t.label }}</button></div>

<!-- ====== OVERVIEW TAB ====== -->
<div v-if="activeTab==='general'">
<div class="row g-3">
<div class="col-md-6"><div class="border rounded p-3 shadow-sm" style="background:var(--card-bg);">
<h5 class="fw-bold mb-3">&#128204; {{ __('Thông Tin Định Danh') }}</h5>
<table class="table table-condensed mb-0">
<tr v-for="r in genRows" :key="r[0]"><td class="text-muted" style="width:140px;">{{ r[0] }}</td><td v-html="r[1]"></td></tr></table></div></div>
<div class="col-md-6"><div class="border rounded p-3 shadow-sm" style="background:var(--card-bg);">
<h5 class="fw-bold mb-3">&#128221; {{ __('Ghi Chú Kỹ Thuật') }}</h5>
<div v-if="systemDetail.general.description" v-html="systemDetail.general.description"></div>
<span v-else class="text-muted">{{ __('Không có mô tả chi tiết.') }}</span></div></div></div>

<div v-if="rawPositions.length"
class="border rounded p-3 mt-3 shadow-sm overflow-auto" style="background:var(--card-bg);">
<h5 class="fw-bold mb-3">&#128421; {{ __('Sơ Đồ Node') }} ({{ rawPositions.length }} {{ __('Vị Trí') }})</h5>
<div class="mb-3">
<input type="text" class="form-control form-control-sm" v-model="posFilter"
:placeholder="__('Tìm kiếm trong Sơ Đồ Node...')"
style="max-width:300px;background:var(--bg-color);color:var(--text-color);border:1px solid var(--border-color);">
<span v-if="posFilter" class="btn btn-default btn-sm ms-2" @click="posFilter=''">&#10005;</span>
</div>
<table class="table table-hover table-bordered mb-0"><thead><tr>
<th v-for="h in posHeaders" :key="h.key + h.text" @click="sortPos(h.key)" class="fw-bold" style="cursor:pointer;user-select:none;">
{{ h.text }} <span v-if="posSortKey===h.key">{{ posSortAsc ? '\\u2191' : '\\u2193' }}</span>
</th></tr></thead><tbody>
<tr v-for="p in visiblePositions" :key="p.position_code">
<td v-for="h in posHeaders" :key="h.key + h.text"><span v-html="formatPosCell(p, h)"></span></td>
</tr></tbody></table>
<div class="text-center p-3">
<button v-if="posHasMore" class="btn btn-default btn-sm" @click="loadMorePositions">{{ __('Xem thêm') }} ({{ sortedPositions.length - visiblePositions.length }} {{ __('còn lại') }})</button>
<span v-else class="small text-muted">{{ __('Đã hiển thị tất cả') }} {{ sortedPositions.length }} {{ __('bản ghi') }}</span>
</div></div></div>

<!-- ====== GENERIC DATA TABS (assets, maintenance, repairs, incidents) ====== -->
<div v-else>
<div v-if="!rawTabData.length" class="text-center p-5 text-muted">&#128123; {{ __('Không có bản ghi.') }}</div>
<template v-else>
<div class="mb-3">
<input type="text" class="form-control form-control-sm" v-model="tabFilter"
:placeholder="__('Tìm kiếm trong bảng...')"
style="max-width:300px;background:var(--bg-color);color:var(--text-color);border:1px solid var(--border-color);">
<span v-if="tabFilter" class="btn btn-default btn-sm ms-2" @click="tabFilter=''">&#10005;</span>
</div>
<!-- Desktop Table -->
<div class="d-none d-md-block border rounded shadow-sm overflow-auto" style="background:var(--card-bg);">
<table class="table table-hover table-bordered mb-0"><thead><tr>
<th v-for="h in tabHeaders" :key="h.key" @click="sortTab(h.key)" class="fw-bold" style="cursor:pointer;user-select:none;">
{{ h.text }} <span v-if="tabSortKey===h.key">{{ tabSortAsc ? '\\u2191' : '\\u2193' }}</span>
</th></tr></thead><tbody>
<tr v-for="row in visibleTabData" :key="row.name||row.log_name||row.maintenance_name">
<td v-for="h in tabHeaders" :key="h.key"><span v-html="formatTabCell(row, h)"></span></td></tr></tbody></table>
<!-- Load More Button (Desktop) -->
<div class="text-center p-3">
<button v-if="tabHasMore" class="btn btn-default btn-sm" @click="loadMore">{{ __('Xem thêm') }} ({{ sortedTabData.length - visibleTabData.length }} {{ __('còn lại') }})</button>
<span v-else class="small text-muted">{{ __('Đã hiển thị tất cả') }} {{ sortedTabData.length }} {{ __('bản ghi') }}</span>
</div></div>
<!-- Mobile Cards -->
<div class="d-flex flex-column d-md-none gap-2">
<div v-for="row in visibleTabData" :key="row.name||row.log_name||row.maintenance_name"
class="border rounded p-3 shadow-sm" style="background:var(--card-bg);">
<div class="fw-semibold" style="font-size:14px;" v-html="formatTabMobilePrimary(row)"></div>
<div class="small text-muted mt-1" v-html="formatTabMobileSecondary(row)"></div></div>
<!-- Load More Button (Mobile) -->
<div class="text-center p-2">
<button v-if="tabHasMore" class="btn btn-default btn-sm" @click="loadMore">{{ __('Xem thêm') }} ({{ sortedTabData.length - visibleTabData.length }})</button>
<span v-else class="small text-muted">{{ __('Đã hiển thị tất cả') }} {{ sortedTabData.length }} {{ __('bản ghi') }}</span>
</div></div></template></div></template></template></div>`,

        data: function () {
            return {
                systems: [], loading: true, searchQuery: "", error: false,
                viewState: "list", selectedSystem: null, systemDetail: null,
                detailLoading: false, detailError: false, activeTab: "general",
                mainVisibleCount: 15, mainLoadStep: 15, sortKey: "", sortAsc: true,
                // Generic tab table state — "Load More" pattern
                tabFilter: "", tabSortKey: "", tabSortAsc: true,
                visibleCounts: { assets: 10, maintenance: 10, repairs: 10, incidents: 10, positions: 10 },
                loadStep: 10,
                // Positions (Node Diagram) separate state
                posFilter: "", posSortKey: "", posSortAsc: true,
            };
        },

        computed: {
            // ── List View ──
            filteredSystems: function () {
                if (!this.searchQuery) return this.systems;
                var q = this.searchQuery.toLowerCase();
                return this.systems.filter(function (s) {
                    return (s.system_code || "").toLowerCase().indexOf(q) !== -1
                        || (s.system_name || "").toLowerCase().indexOf(q) !== -1;
                });
            },
            sortedSystems: function () { return this._sortData(this.filteredSystems, this.sortKey, this.sortAsc); },
            visibleSystems: function () { return this.sortedSystems.slice(0, this.mainVisibleCount); },
            mainHasMore: function () { return this.mainVisibleCount < this.sortedSystems.length; },
            sortableHeaders: function () {
                return [
                    { key: "system_code", text: __("Mã Hệ Thống") },
                    { key: "system_name", text: __("Tên Hệ Thống") },
                    { key: "health", text: __("Sức Khỏe") },
                    { key: "criticality", text: __("Phân Cấp") },
                    { key: "location", text: __("Vị Trí") },
                    { key: "asset_count", text: __("Thiết Bị") },
                    { key: "open_ticket_count", text: __("Ticket") },
                ];
            },
            // ── Detail ──
            detailTabs: function () {
                if (!this.systemDetail) return [];
                var d = this.systemDetail;
                return [
                    { key: "general",     label: "\ud83d\udccc " + __("Tổng Quan") },
                    { key: "assets",      label: "\ud83d\udce6 " + __("Thiết Bị") + " (" + (d.assets || []).length + ")" },
                    { key: "maintenance", label: "\ud83d\udee0\ufe0f " + __("Bảo Trì") + " (" + (d.maintenance || []).length + ")" },
                    { key: "repairs",     label: "\ud83d\udd27 " + __("Sửa Chữa") + " (" + (d.repairs || []).length + ")" },
                    { key: "incidents",   label: "\ud83d\udea8 " + __("Sự Cố") + " (" + (d.incidents || []).length + ")" },
                ];
            },
            genRows: function () {
                var g = this.systemDetail && this.systemDetail.general;
                if (!g) return [];
                return [
                    [__("Mã Hệ Thống"), "<strong>" + (g.system_code || "-") + "</strong>"],
                    [__("Tên Hệ Thống"), g.system_name || "-"],
                    [__("Trạng Thái"), g.status || "-"],
                    [__("Phân Cấp"), g.criticality || "-"],
                    [__("Vị Trí / Trạm"), g.location || "-"],
                    [__("Đơn Vị Quản Lý"), g.department || "-"],
                ];
            },
            // ── Generic Tab Table ──
            rawTabData: function () {
                if (!this.systemDetail || this.activeTab === "general") return [];
                var m = { assets: this.systemDetail.assets, maintenance: this.systemDetail.maintenance, repairs: this.systemDetail.repairs, incidents: this.systemDetail.incidents };
                return m[this.activeTab] || [];
            },
            filteredTabData: function () { return this._filterTabData(this.rawTabData, this.tabFilter); },
            sortedTabData: function () { return this._sortData(this.filteredTabData, this.tabSortKey, this.tabSortAsc); },
            visibleTabData: function () { var n = this.visibleCounts[this.activeTab] || this.loadStep; return this.sortedTabData.slice(0, n); },
            tabHeaders: function () { return this._getTabHeaders(this.activeTab); },
            tabHasMore: function () { return (this.visibleCounts[this.activeTab] || 0) < this.sortedTabData.length; },
            // ── Positions (Node Diagram) with full sort/filter/load-more ──
            rawPositions: function () { return this.systemDetail && this.systemDetail.general && this.systemDetail.general.positions || []; },
            posHeaders: function () {
                return [
                    { key: "position_code", text: __("Mã Node") },
                    { key: "position_name", text: __("Tên Chức Năng") },
                    { key: "current_asset", text: __("Thiết Bị Đang Gác") },
                    { key: "current_asset", text: __("Trạng Thái") },
                    { key: "remarks", text: __("Ghi Chú") },
                ];
            },
            filteredPositions: function () { return this._filterPositions(this.rawPositions, this.posFilter); },
            sortedPositions: function () { return this._sortData(this.filteredPositions, this.posSortKey, this.posSortAsc); },
            visiblePositions: function () { var n = this.visibleCounts.positions || this.loadStep; return this.sortedPositions.slice(0, n); },
            posHasMore: function () { var n = this.visibleCounts.positions || 0; return n < this.sortedPositions.length; },
        },

        methods: {
            // ── Shared: Sort ──
            _sortData: function (list, key, asc) {
                var arr = list.slice();
                if (!key) return arr;
                var self = this;
                arr.sort(function (a, b) {
                    var va = a[key] != null ? a[key] : "";
                    var vb = b[key] != null ? b[key] : "";
                    if (typeof va === "number" && typeof vb === "number") return asc ? va - vb : vb - va;
                    va = String(va).toLowerCase(); vb = String(vb).toLowerCase();
                    if (va < vb) return asc ? -1 : 1;
                    if (va > vb) return asc ? 1 : -1;
                    return 0;
                });
                return arr;
            },
            // ── Shared: Filter tab data across ALL columns ──
            _filterTabData: function (list, query) {
                if (!query) return list;
                var q = query.toLowerCase();
                var headers = this._getTabHeaders(this.activeTab);
                return list.filter(function (row) {
                    for (var i = 0; i < headers.length; i++) {
                        var v = row[headers[i].key];
                        if (v != null && String(v).toLowerCase().indexOf(q) !== -1) return true;
                    }
                    return false;
                });
            },
            // ── Tab header definitions ──
            _getTabHeaders: function (tab) {
                var m = {
                    assets: [ { key: "name", text: __("Mã Tài Sản") }, { key: "asset_name", text: __("Tên Thiết Bị") }, { key: "custom_system_position", text: __("Vị Trí Node") }, { key: "status", text: __("Trạng Thái") }, { key: "location", text: __("Kho / Trạm") }, { key: "purchase_date", text: __("Ngày Mua") } ],
                    maintenance: [ { key: "maintenance_name", text: __("Phiếu Bảo Dưỡng") }, { key: "asset_name", text: __("Thiết Bị") }, { key: "maintenance_type", text: __("Loại") }, { key: "maintenance_status", text: __("Trạng Thái") }, { key: "maintenance_date", text: __("Ngày Kế Hoạch") }, { key: "completion_date", text: __("Ngày Xong") } ],
                    repairs: [ { key: "name", text: __("Phiếu Sửa Chữa") }, { key: "asset_name", text: __("Thiết Bị") }, { key: "repair_status", text: __("Trạng Thái") }, { key: "failure_date", text: __("Ngày Hỏng") }, { key: "completion_date", text: __("Ngày Xong") }, { key: "repair_cost", text: __("Chi Phí (VNĐ)") } ],
                    incidents: [ { key: "name", text: __("Mã Ticket") }, { key: "subject", text: __("Tiêu Đề Sự Cố") }, { key: "status", text: __("Trạng Thái") }, { key: "ticket_type", text: __("Phân Loại") }, { key: "creation", text: __("Thời Gian Báo") } ],
                };
                return m[tab] || [];
            },
            // ── List sort ──
            sortBy: function (key) { if (this.sortKey === key) this.sortAsc = !this.sortAsc; else { this.sortKey = key; this.sortAsc = true; } this.mainVisibleCount = this.mainLoadStep; },
            loadMoreMain: function () { this.mainVisibleCount += this.mainLoadStep; },
            // ── Tab sort (resets visible count) ──
            sortTab: function (key) { if (this.tabSortKey === key) this.tabSortAsc = !this.tabSortAsc; else { this.tabSortKey = key; this.tabSortAsc = true; } this._resetVisibleCount(); },
            // ── Reset visible count for current tab ──
            _resetVisibleCount: function () { this.visibleCounts[this.activeTab] = this.loadStep; },
            // ── Load more for current tab ──
            loadMore: function () { this.visibleCounts[this.activeTab] = (this.visibleCounts[this.activeTab] || this.loadStep) + this.loadStep; },
            // ── Load more for positions ──
            loadMorePositions: function () { this.visibleCounts.positions = (this.visibleCounts.positions || this.loadStep) + this.loadStep; },
            // ── Positions sort ──
            sortPos: function (key) { if (this.posSortKey === key) this.posSortAsc = !this.posSortAsc; else { this.posSortKey = key; this.posSortAsc = true; } this._resetPosCount(); },
            _resetPosCount: function () { this.visibleCounts.positions = this.loadStep; },
            // ── Positions filter across all columns ──
            _filterPositions: function (list, query) {
                if (!query) return list;
                var q = query.toLowerCase();
                return list.filter(function (p) {
                    return (p.position_code||"").toLowerCase().indexOf(q) !== -1
                        || (p.position_name||"").toLowerCase().indexOf(q) !== -1
                        || (p.remarks||"").toLowerCase().indexOf(q) !== -1
                        || (p.current_asset && p.current_asset.name && p.current_asset.name.toLowerCase().indexOf(q) !== -1)
                        || (p.current_asset && p.current_asset.asset_name && p.current_asset.asset_name.toLowerCase().indexOf(q) !== -1);
                });
            },
            // ── Format cell for positions table ──
            formatPosCell: function (row, header) {
                var v = row[header.key];
                if (header.key === "current_asset" && header.text === __("Thiết Bị Đang Gác")) {
                    if (!v || !v.name) return '<span class="text-muted fst-italic">-- ' + __("Trống") + ' --</span>';
                    return '<a href="/app/asset/' + v.name + '" class="fw-bold">' + (v.asset_name || v.name) + '</a>';
                }
                if (header.key === "current_asset" && header.text === __("Trạng Thái")) {
                    if (!v || !v.status) return "-";
                    return '<span class="badge badge-success fw-bold">' + v.status + '</span>';
                }
                if (header.key === "position_code") return v ? '<code style="color:var(--primary-color);font-weight:bold;">' + v + '</code>' : "-";
                if (header.key === "position_name") return v ? '<strong>' + v + '</strong>' : "-";
                if (v == null || v === "") return "-";
                return v;
            },
            // ── Format cell for generic table ──
            formatTabCell: function (row, header) {
                var v = row[header.key];
                if (v == null || v === "") return "-";
                // Link columns
                if (header.key === "name" && (this.activeTab === "assets" || this.activeTab === "repairs" || this.activeTab === "incidents")) {
                    var prefix = this.activeTab === "assets" ? "/app/asset/" : this.activeTab === "repairs" ? "/app/asset-repair/" : "/app/hd-ticket/";
                    return '<a href="' + prefix + v + '" class="fw-bold" target="_blank">' + v + '</a>';
                }
                if (header.key === "maintenance_name" && this.activeTab === "maintenance") {
                    return '<a href="/app/asset-maintenance/' + v + '" class="fw-bold" target="_blank">' + v + '</a>';
                }
                // Badge columns
                if (header.key === "status" && this.activeTab === "assets") return '<span class="badge badge-primary fw-bold">' + v + '</span>';
                if (header.key === "maintenance_status") return '<span class="badge badge-warning fw-bold">' + v + '</span>';
                if (header.key === "repair_status") return '<span class="badge badge-success fw-bold">' + v + '</span>';
                if (header.key === "status" && this.activeTab === "incidents") return '<span class="badge badge-danger fw-bold">' + v + '</span>';
                // Code column
                if (header.key === "custom_system_position") return v ? '<code class="fw-bold">' + v + '</code>' : '<span class="text-muted">' + __("Kho Standby") + '</span>';
                // Currency
                if (header.key === "repair_cost") return this.fmtVND(v);
                // Date
                if (header.key === "creation") return this.fmtDate(v);
                return v;
            },
            // ── Mobile card helpers ──
            formatTabMobilePrimary: function (row) {
                var t = this.activeTab;
                var link = "";
                var name = "";
                if (t === "assets") { link = "/app/asset/"; name = row.name; }
                else if (t === "maintenance") { link = "/app/asset-maintenance/"; name = row.maintenance_name; }
                else if (t === "repairs") { link = "/app/asset-repair/"; name = row.name; }
                else if (t === "incidents") { link = "/app/hd-ticket/"; name = row.name; }
                var badge = "";
                if (t === "assets") badge = '<span class="badge badge-primary fw-bold ms-2">' + row.status + '</span>';
                else if (t === "maintenance") badge = '<span class="badge badge-warning fw-bold ms-2">' + row.maintenance_status + '</span>';
                else if (t === "repairs") badge = '<span class="badge badge-success fw-bold ms-2">' + row.repair_status + '</span>';
                else if (t === "incidents") badge = '<span class="badge badge-danger fw-bold ms-2">' + row.status + '</span>';
                return '<a href="' + link + name + '" target="_blank">' + name + '</a>' + badge;
            },
            formatTabMobileSecondary: function (row) {
                var t = this.activeTab;
                if (t === "assets") return (row.asset_name||"") + " \u00B7 " + (row.status||"") + (row.custom_system_position ? " \u00B7 Node: " + row.custom_system_position : "");
                if (t === "maintenance") return (row.asset_name||"") + " \u00B7 " + (row.maintenance_type||"") + " \u00B7 " + (row.maintenance_date||"-");
                if (t === "repairs") return (row.asset_name||"") + " \u00B7 " + (row.failure_date||"-") + " \u00B7 " + this.fmtVND(row.repair_cost);
                if (t === "incidents") return (row.subject||"") + " \u00B7 " + (row.ticket_type||"-") + " \u00B7 " + this.fmtDate(row.creation);
                return "";
            },
            // ── Health / Formatting ──
            healthMap: function () {
                return {
                    healthy:        { label: __("Khỏe Mạnh"),       bg: "rgba(34,197,94,0.12)",  fg: "var(--green-500,#22c55e)" },
                    degraded:       { label: __("Suy Giảm"),        bg: "rgba(245,158,11,0.12)", fg: "var(--orange-500,#f59e0b)" },
                    maintenance:    { label: __("Bảo Trì"),         bg: "rgba(59,130,246,0.12)", fg: "var(--blue-500,#3b82f6)" },
                    offline:        { label: __("Ngoại Tuyến"),     bg: "rgba(107,114,128,0.12)",fg: "var(--gray-500,#6b7280)" },
                    decommissioned: { label: __("Ngừng Hoạt Động"), bg: "rgba(239,68,68,0.12)",  fg: "var(--red-500,#ef4444)" },
                    unknown:        { label: __("Không Xác Định"),  bg: "rgba(156,163,175,0.12)",fg: "var(--gray-400,#9ca3af)" },
                };
            },
            healthLabel: function (h) { var m = this.healthMap(); return (m[h] || m.unknown).label; },
            healthStyle: function (h) { var m = this.healthMap(); var v = m[h] || m.unknown; return "background:" + v.bg + ";color:" + v.fg + ";"; },
            fmtVND: function (v) { if (v == null || v === "") return "-"; return format_currency(v, "VND"); },
            fmtDate: function (v) { if (!v) return "-"; return frappe.datetime.str_to_user(v); },
            // ── API ──
            openDetail: function (sys) {
                var self = this;
                self.selectedSystem = sys; self.systemDetail = null; self.detailLoading = true; self.detailError = false; self.activeTab = "general"; self.viewState = "detail";
                frappe.call({
                    method: "equipment_logbook.equipment_logbook.api.get_system_logbook_detail",
                    args: { system_info: sys.name },
                    callback: function (r) { self.systemDetail = r.message; self.detailLoading = false; if (!r.message) self.detailError = true; },
                    error: function () { self.detailLoading = false; self.detailError = true; },
                });
            },
            loadSystems: function () {
                var self = this;
                self.loading = true; self.error = false;
                frappe.call({
                    method: "equipment_logbook.equipment_logbook.api.get_systems_overview_list",
                    callback: function (r) { self.systems = r.message || []; self.loading = false; },
                    error: function () { self.systems = []; self.loading = false; self.error = true; },
                });
            },
        },

        mounted: function () { this.loadSystems(); },

        watch: {
            searchQuery: function () { this.mainVisibleCount = this.mainLoadStep; },
            activeTab: function () { this.tabFilter = ""; this.tabSortKey = ""; this.tabSortAsc = true; this._resetVisibleCount(); },
            tabFilter: function () { this._resetVisibleCount(); },
            posFilter: function () { this._resetPosCount(); },
        },
    };

    var app = window.Vue.createApp(SystemLogbookApp);
    app.mount("#vue-logbook-app");
};