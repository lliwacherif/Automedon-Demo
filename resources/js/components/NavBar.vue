<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';
import GlobalCalendarModal from '@/components/GlobalCalendarModal.vue';
import { History, Calendar } from 'lucide-vue-next';

const authStore = useAuthStore();
const router = useRouter();

// Mobile menu state
const isMobileMenuOpen = ref(false);
const showCalendarModal = ref(false);

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
    isMobileMenuOpen.value = false;
};

async function handleLogout() {
    await authStore.signOut();
    closeMobileMenu();
    router.push('/login');
}
</script>

<template>
    <nav class="bg-white shadow relative z-50">
        <div class="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
            <div class="flex justify-between h-16">
                <div class="flex">
                    <!-- Logo -->
                    <div class="shrink-0 flex items-center">
                        <RouterLink to="/" class="flex items-center space-x-2">
                            <img src="/images/icon-automedon.png" alt="Logo" class="h-10 w-10 object-contain" />
                            <span class="text-xl font-bold text-gray-800">Automedon</span>
                        </RouterLink>
                    </div>
                    
                    <!-- Desktop Navigation -->
                    <!-- Desktop Navigation -->
                    <div class="hidden lg:ml-6 lg:flex lg:space-x-8">
                        <RouterLink to="/" active-class="border-indigo-500 text-indigo-600" class="nav-link border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                            <svg class="nav-icon w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span class="nav-text">{{ $t('nav.home') }}</span>
                        </RouterLink>

                        <RouterLink to="/about" active-class="border-indigo-500 text-indigo-600" class="nav-link border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                            <svg class="nav-icon w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span class="nav-text">{{ $t('nav.about') }}</span>
                        </RouterLink>

                        
                        <!-- Admin Links -->
                        <RouterLink v-if="authStore.isAdmin" to="/admin/kpi" active-class="border-indigo-500 text-indigo-600" class="nav-link border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                            <svg class="nav-icon w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span class="nav-text">KPI</span>
                        </RouterLink>
                        <RouterLink v-if="authStore.isAdmin" to="/admin/cars" active-class="border-indigo-500 text-indigo-600" class="nav-link border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                            <svg class="nav-icon w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                            <span class="nav-text">{{ $t('nav.admin') }}</span>
                        </RouterLink>
                        <RouterLink v-if="authStore.isAdmin" to="/admin/reservations" active-class="border-indigo-500 text-indigo-600" class="nav-link border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                            <svg class="nav-icon w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            <span class="nav-text">{{ $t('nav.reservations') }}</span>
                        </RouterLink>
                        <RouterLink v-if="authStore.isAdmin" to="/admin/maintenance" active-class="border-indigo-500 text-indigo-600" class="nav-link border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                            <svg class="nav-icon w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span class="nav-text">Maintenance</span>
                        </RouterLink>
                        <RouterLink v-if="authStore.isAdmin" to="/admin/settings" active-class="border-indigo-500 text-indigo-600" class="nav-link border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                            <svg class="nav-icon w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span class="nav-text">Settings</span>
                        </RouterLink>
                        <RouterLink v-if="authStore.isAdmin" to="/admin/history" active-class="border-indigo-500 text-indigo-600" class="nav-link border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                            <svg class="nav-icon w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <History class="w-6 h-6" />
                            </svg>
                            <span class="nav-text">History</span>
                        </RouterLink>
                    </div>
                </div>

                <!-- Desktop Right Side -->
                <div class="hidden lg:flex items-center">
                    <button 
                        @click="showCalendarModal = true"
                        class="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full mr-2 transition-colors"
                        title="Calendrier Global"
                    >
                        <Calendar class="w-5 h-5" />
                    </button>
                    <LanguageSwitcher class="mr-4" />
                    <template v-if="authStore.user || authStore.isAdmin">
                        <span v-if="authStore.isAdmin" class="text-gray-700 text-sm mr-4">{{ $t('common.admin') }}</span>
                        <span v-else class="text-gray-700 text-sm mr-4">{{ $t('nav.hello') }}, {{ authStore.user?.email }}</span>
                        
                        <RouterLink v-if="!authStore.isAdmin" to="/client/reservations" class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium mr-2">
                            {{ $t('nav.my_bookings') }}
                        </RouterLink>
                        <button @click="handleLogout" class="text-red-600 hover:text-red-800 px-3 py-2 rounded-md text-sm font-medium">
                            {{ $t('nav.logout') }}
                        </button>
                    </template>
                    <template v-else>
                        <RouterLink to="/login" class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                            {{ $t('nav.login') }}
                        </RouterLink>
                        <RouterLink to="/register" class="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium ml-2">
                            {{ $t('nav.register') }}
                        </RouterLink>
                    </template>
                </div>

                <!-- Mobile Menu Button -->
                <div class="lg:hidden flex items-center">
                    <LanguageSwitcher class="mr-2" />
                    <button 
                        @click="toggleMobileMenu"
                        class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    >
                        <span class="sr-only">Open menu</span>
                        <!-- Hamburger Icon -->
                        <svg v-if="!isMobileMenuOpen" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <!-- Close Icon -->
                        <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Mobile Sidebar Overlay -->
        <Teleport to="body">
            <Transition name="fade">
                <div 
                    v-if="isMobileMenuOpen" 
                    class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    @click="closeMobileMenu"
                ></div>
            </Transition>
        </Teleport>

        <!-- Mobile Sidebar -->
        <Teleport to="body">
            <Transition name="slide">
                <div 
                    v-if="isMobileMenuOpen"
                    class="fixed top-0 right-0 h-full w-72 bg-white shadow-xl z-50 lg:hidden flex flex-col"
                >
                    <!-- Sidebar Header -->
                    <div class="flex items-center justify-between p-4 border-b border-gray-200">
                        <div class="flex items-center space-x-2">
                            <img src="/images/icon-automedon.png" alt="Logo" class="h-8 w-8 object-contain" />
                            <span class="text-lg font-bold text-gray-800">Automedon</span>
                        </div>
                        <button 
                            @click="closeMobileMenu"
                            class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        >
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- User Info -->
                    <div v-if="authStore.user || authStore.isAdmin" class="p-4 bg-indigo-50 border-b border-gray-200">
                        <p v-if="authStore.isAdmin" class="text-sm font-medium text-indigo-700">
                            👤 {{ $t('common.admin') }}
                        </p>
                        <p v-else class="text-sm text-gray-600">
                            {{ $t('nav.hello') }}, <span class="font-medium">{{ authStore.user?.email }}</span>
                        </p>
                    </div>

                    <!-- Navigation Links -->
                    <div class="py-4 flex-1 overflow-y-auto">
                        <div class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Navigation
                        </div>
                        
                        <RouterLink 
                            to="/" 
                            @click="closeMobileMenu"
                            class="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                            <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {{ $t('nav.home') }}
                        </RouterLink>

                        <button 
                            @click="() => { showCalendarModal = true; closeMobileMenu(); }"
                            class="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 text-left"
                        >
                            <Calendar class="w-5 h-5 mr-3" />
                            Calendrier Global
                        </button>
                        

                        
                        <RouterLink 
                            to="/about" 
                            @click="closeMobileMenu"
                            class="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                            <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {{ $t('nav.about') }}
                        </RouterLink>
                        


                        <!-- Admin Section -->
                        <template v-if="authStore.isAdmin">
                            <div class="px-4 py-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Administration
                            </div>
                            
                            <RouterLink 
                                to="/admin/kpi" 
                                @click="closeMobileMenu"
                                class="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                            >
                                <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                KPI Dashboard
                            </RouterLink>
                            
                            <RouterLink 
                                to="/admin/cars" 
                                @click="closeMobileMenu"
                                class="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                            >
                                <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                                </svg>
                                {{ $t('nav.admin') }}
                            </RouterLink>
                            
                            <RouterLink 
                                to="/admin/reservations" 
                                @click="closeMobileMenu"
                                class="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                            >
                                <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                {{ $t('nav.reservations') }}
                            </RouterLink>
                            
                            <RouterLink 
                                to="/admin/maintenance" 
                                @click="closeMobileMenu"
                                class="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                            >
                                <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Maintenance
                            </RouterLink>

                            <RouterLink 
                                to="/admin/settings" 
                                @click="closeMobileMenu"
                                class="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                            >
                                <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Settings
                            </RouterLink>
                            
                            <RouterLink 
                                to="/admin/history" 
                                @click="closeMobileMenu"
                                class="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                            >
                                <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <History class="w-5 h-5" />
                                </svg>
                                History
                            </RouterLink>
                        </template>

                        <!-- User Section -->
                        <template v-if="authStore.user && !authStore.isAdmin">
                            <div class="px-4 py-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Mon Compte
                            </div>
                            
                            <RouterLink 
                                to="/client/reservations" 
                                @click="closeMobileMenu"
                                class="flex items-center px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                            >
                                <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                {{ $t('nav.my_bookings') }}
                            </RouterLink>
                        </template>
                    </div>

                    <!-- Bottom Actions -->
                    <div class="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
                        <template v-if="authStore.user || authStore.isAdmin">
                            <button 
                                @click="handleLogout"
                                class="flex items-center justify-center w-full px-4 py-3 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                            >
                                <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                {{ $t('nav.logout') }}
                            </button>
                        </template>
                        <template v-else>
                            <div class="space-y-2">
                                <RouterLink 
                                    to="/login" 
                                    @click="closeMobileMenu"
                                    class="flex items-center justify-center w-full px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    {{ $t('nav.login') }}
                                </RouterLink>
                                <RouterLink 
                                    to="/register" 
                                    @click="closeMobileMenu"
                                    class="flex items-center justify-center w-full px-4 py-3 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                                >
                                    {{ $t('nav.register') }}
                                </RouterLink>
                            </div>
                        </template>
                    </div>
                </div>
            </Transition>
        </Teleport>


        <GlobalCalendarModal :show="showCalendarModal" @close="showCalendarModal = false" />
    </nav>
</template>

<style scoped>
/* Desktop Navigation Icon/Text Toggle */
.nav-link .nav-text {
    display: none;
}

.nav-link:hover .nav-icon {
    display: none;
}

.nav-link:hover .nav-text {
    display: inline;
}

/* Slide animation for sidebar */
.slide-enter-active,
.slide-leave-active {
    transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
    transform: translateX(100%);
}

/* Fade animation for overlay */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
