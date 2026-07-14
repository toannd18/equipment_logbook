import { createApp } from 'vue'
import router from './router'
import App from './App.vue'
import './index.css'

import { FrappeUI, setConfig, frappeRequest, initSocket } from 'frappe-ui'

initSocket();
let app = createApp(App)

// Register FrappeUI plugin (all components + directives)
app.use(FrappeUI)

// Enable Frappe response parsing
setConfig('resourceFetcher', frappeRequest)
// ❌ COMMENT HOẶC XÓA DÒNG NÀY ĐI ĐỂ TRÁNH BỊ LẶP:
// Options API resource support
//app.use(resourcesPlugin)

app.use(router)
app.mount('#app')
