import { createPinia } from 'pinia'
import { createApp } from 'nativescript-vue'

import App from './App.vue'

createApp(App).use(createPinia()).start()

