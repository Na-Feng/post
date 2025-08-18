import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './style.css';
import App from './App.vue';
import router from './router'; // 引入 router

const app = createApp(App);

app.use(router); // 使用 router
app.use(ElementPlus);
app.mount('#app');
