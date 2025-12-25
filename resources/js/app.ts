import '../css/app.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import i18n from './i18n'; // Import i18n
import App from './App.vue';
import { initializeTheme } from './composables/useAppearance';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18n); // Use i18n

initializeTheme();


// Error handling for debugging
window.addEventListener('error', (event) => {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.background = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '20px';
    errorDiv.style.zIndex = '9999';
    errorDiv.textContent = `Global Error: ${event.message}`;
    document.body.appendChild(errorDiv);
    console.error('Global error:', event);
});

app.config.errorHandler = (err, instance, info) => {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.bottom = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100%';
    errorDiv.style.background = 'darkred';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '20px';
    errorDiv.style.zIndex = '9999';
    errorDiv.textContent = `Vue Error: ${err}`;
    document.body.appendChild(errorDiv);
    console.error('Vue error:', err, info);
};

app.mount('#app');
