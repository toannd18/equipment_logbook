// Desk Page loader for Equipment Logbook Vue SPA
// Frappe loads this .js file via load_assets() and evaluates it in the page context.
// The Vue SPA mounts into #app inside the page shell created by frappe.ui.make_app_page.

frappe.pages['equipment-logbook'].on_page_load = function (wrapper) {
	// Create the standard Frappe app page shell (header, breadcrumbs, etc.)
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Equipment Logbook',
		single_column: true,
	});

	// Inject CSS files required by the Vue SPA
	var cssFiles = [
		'/assets/equipment_logbook/frontend/assets/index-21a354f3.css',
		'/assets/equipment_logbook/frontend/assets/ListView-65c0fc8c.css',
	];
	cssFiles.forEach(function (href) {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = href;
		document.head.appendChild(link);
	});

	// Set the main content area to host the Vue app + modal/popover containers
	var mainEl = page.main || wrapper.querySelector('.page_content');
	if (mainEl) {
		mainEl.innerHTML = [
			'<div id="app" style="height:100%;min-height:calc(100vh - 140px);"></div>',
			'<div id="modals"></div>',
			'<div id="popovers"></div>',
		].join('');
	}

	// Expose Frappe boot data to window for the Vue SPA (frappe-ui SDK)
	window.site_name = frappe.boot.sitename || window.location.hostname;
	window.csrf_token = frappe.boot.csrf_token || frappe.csrf_token || '';
	window.user = frappe.session.user || 'Guest';

	// Dynamically load the Vue SPA bundle (ES module)
	var script = document.createElement('script');
	script.type = 'module';
	script.crossOrigin = 'anonymous';
	script.src = '/assets/equipment_logbook/frontend/assets/index-47371c22.js';
	script.onload = function () {
		console.log('[Equipment Logbook] Vue SPA loaded successfully.');
	};
	script.onerror = function () {
		console.error('[Equipment Logbook] Failed to load Vue SPA bundle.');
	};
	document.head.appendChild(script);
};
