<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useReservations } from '@/composables/useReservations';
import { useAuthStore } from '@/stores/auth';
import { RouterLink } from 'vue-router';

const { reservations, loading, total, fetchUserReservations } = useReservations();
const authStore = useAuthStore();

const currentPage = ref(1);
const statusFilter = ref('all');

const loadReservations = () => {
    if (authStore.user) {
        fetchUserReservations(authStore.user.id, currentPage.value, statusFilter.value);
    }
};

onMounted(() => {
    loadReservations();
});

watch([currentPage, statusFilter], () => {
    loadReservations();
});

const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        active: 'bg-green-100 text-green-800',
        completed: 'bg-gray-100 text-gray-800',
        cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
};

import { formatDate } from '@/utils/date';
</script>

<template>
    <div class="min-h-screen bg-gray-100">
        <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ $t('nav.my_bookings') }}</h1>

            <!-- Filters -->
            <div class="bg-white p-4 rounded-lg shadow mb-6">
                <select 
                    v-model="statusFilter"
                    class="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-48 sm:text-sm"
                >
                    <option value="all">{{ $t('admin.reservations.all_statuses') }}</option>
                    <option value="pending">{{ $t('admin.reservations.status_pending') }}</option>
                    <option value="confirmed">{{ $t('admin.reservations.status_confirmed') }}</option>
                    <option value="active">{{ $t('admin.reservations.status_active') }}</option>
                    <option value="completed">{{ $t('admin.reservations.status_completed') }}</option>
                    <option value="cancelled">{{ $t('admin.reservations.status_cancelled') }}</option>
                </select>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="bg-white shadow rounded-lg p-8 text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p class="mt-4 text-gray-500">{{ $t('common.loading') }}...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="reservations.length === 0" class="bg-white shadow rounded-lg p-8 text-center">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">{{ $t('admin.reservations.no_reservations') }}</h3>
                <p class="mt-1 text-sm text-gray-500">Vous n'avez pas encore de réservations.</p>
                <div class="mt-6">
                    <RouterLink to="/fleet" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        {{ $t('home.view_fleet') }}
                    </RouterLink>
                </div>
            </div>

            <!-- Reservations List -->
            <div v-else class="space-y-4">
                <div 
                    v-for="res in reservations" 
                    :key="res.id" 
                    class="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                    <RouterLink :to="`/client/reservations/${res.id}`" class="block">
                        <div class="p-6">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4">
                                    <!-- Car Image -->
                                    <div class="flex-shrink-0">
                                        <img 
                                            :src="res.car?.image_url || '/images/car-default.jpg'" 
                                            :alt="res.car?.brand + ' ' + res.car?.model"
                                            class="h-16 w-24 object-cover rounded-md"
                                        >
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold text-gray-900">
                                            {{ res.car?.brand }} {{ res.car?.model }}
                                        </h3>
                                        <p class="text-sm text-gray-500">{{ res.reservation_number }}</p>
                                    </div>
                                </div>
                                <span :class="getStatusColor(res.status)" class="px-3 py-1 text-xs font-semibold rounded-full capitalize">
                                    {{ res.status }}
                                </span>
                            </div>
                            
                            <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p class="text-gray-500">{{ $t('admin.reservations.start_date') }}</p>
                                    <p class="font-medium text-gray-900">{{ formatDate(res.start_date) }}</p>
                                </div>
                                <div>
                                    <p class="text-gray-500">{{ $t('admin.reservations.end_date') }}</p>
                                    <p class="font-medium text-gray-900">{{ formatDate(res.end_date) }}</p>
                                </div>
                                <div>
                                    <p class="text-gray-500">{{ $t('admin.reservations.duration') }}</p>
                                    <p class="font-medium text-gray-900">{{ res.duration_days }} {{ $t('admin.reservations.days') }}</p>
                                </div>
                                <div>
                                    <p class="text-gray-500">{{ $t('admin.reservations.total') }}</p>
                                    <p class="font-medium text-indigo-600">{{ res.total_price }} TND</p>
                                </div>
                            </div>
                        </div>
                    </RouterLink>
                </div>

                <!-- Pagination -->
                <div v-if="total > 10" class="flex justify-center mt-6">
                    <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button 
                            @click="currentPage > 1 && currentPage--"
                            :disabled="currentPage === 1"
                            class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                            &laquo;
                        </button>
                        <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            {{ currentPage }} / {{ Math.ceil(total / 10) }}
                        </span>
                        <button 
                            @click="currentPage < Math.ceil(total / 10) && currentPage++"
                            :disabled="currentPage >= Math.ceil(total / 10)"
                            class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                            &raquo;
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    </div>
</template>
