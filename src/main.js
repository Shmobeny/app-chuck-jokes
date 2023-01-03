import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log("Service Worker registered", reg))
    .catch(err => console.log("Service Worker NOT registered", err))
}