import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Import Pages
// We will lazy load these to optimize performance
const Home = () => import('../Pages/Home.vue')

const About = () => import('../Pages/About.vue')

// Auth
const Login = () => import('../Pages/Auth/Login.vue')
const Register = () => import('../Pages/Auth/Register.vue')

// Admin
const AdminCars = () => import('../Pages/Admin/Cars/Index.vue')
const AdminCarsEdit = () => import('../Pages/Admin/Cars/Edit.vue')

const routes = [
    { path: '/', component: Home, name: 'home' },

    { path: '/about', component: About, name: 'about' },

    // Auth Routes
    { path: '/login', component: Login, name: 'login' },
    { path: '/register', component: Register, name: 'register' },

    // Admin Routes
    // Admin Routes
    {
        path: '/admin',
        component: () => import('../Pages/Admin/Login.vue'),
        name: 'admin.login',
        meta: { requiresAuth: false } // Publicly accessible login page
    },
    {
        path: '/admin/cars',
        component: AdminCars,
        name: 'admin.cars.index',
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/cars/create',
        component: AdminCarsEdit,
        name: 'admin.cars.create',
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/cars/:id/edit',
        component: AdminCarsEdit,
        name: 'admin.cars.edit',
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/reservations',
        component: () => import('../Pages/Admin/Reservations/Index.vue'),
        name: 'admin.reservations.index',
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/reservations/:id',
        component: () => import('../Pages/Admin/Reservations/Edit.vue'),
        name: 'admin.reservations.show',
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/maintenance',
        component: () => import('../Pages/Admin/Maintenance/Index.vue'),
        name: 'admin.maintenance.index',
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/kpi',
        component: () => import('../Pages/Admin/KPI/Index.vue'),
        name: 'admin.kpi.index',
        meta: { requiresAuth: true, requiresAdmin: true, requiresSuperAdmin: true }
    },
    {
        path: '/admin/settings',
        component: () => import('../Pages/Admin/Settings.vue'),
        name: 'admin.settings',
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/history',
        component: () => import('../Pages/Admin/History/Index.vue'),
        name: 'admin.history.index',
        meta: { requiresAuth: true, requiresAdmin: true, requiresSuperAdmin: true }
    },
    {
        path: '/admin/history/:id',
        component: () => import('../Pages/Admin/History/Show.vue'),
        name: 'admin.history.show',
        meta: { requiresAuth: true, requiresAdmin: true, requiresSuperAdmin: true }
    },

    // Client Routes
    {
        path: '/client/reservations',
        component: () => import('../Pages/Client/Reservations/Index.vue'),
        name: 'client.reservations.index',
        meta: { requiresAuth: true }
    },
    {
        path: '/client/reservations/:id',
        component: () => import('../Pages/Client/Reservations/Show.vue'),
        name: 'client.reservations.show',
        meta: { requiresAuth: true }
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // Ensure auth is initialized
    if (authStore.loading) {
        await authStore.initializeAuth()
    }

    if (to.meta.requiresAdmin && !authStore.isAdmin) {
        next({ name: 'admin.login' })
        return
    }

    if (to.meta.requiresSuperAdmin && authStore.role !== 'admin') {
        next({ name: 'admin.reservations.index' }) // Redirect unauthorized admin users to reservations
        return
    }

    if (to.meta.requiresAuth && !authStore.user && !authStore.isAdmin) {
        // If it requires auth, and neither user nor admin is logged in
        next({ name: 'login' })
    } else {
        next()
    }
})

export default router
