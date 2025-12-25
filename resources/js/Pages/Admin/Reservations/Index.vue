<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useReservations } from '@/composables/useReservations';
import { useReservationDocuments } from '@/composables/useReservationDocuments';
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { 
    Search, 
    Filter, 
    Calendar, 
    Car, 
    User, 
    FileText, 
    MoreVertical, 
    Edit, 
    Trash2, 
    ChevronDown, 
    ChevronUp,
    Download,
    Eye
} from 'lucide-vue-next';

const { t } = useI18n();
const { reservations, loading, fetchReservations, deleteReservation } = useReservations();
const { documents, fetchDocuments } = useReservationDocuments();

const search = ref('');
const statusFilter = ref('all');
const expandedReservation = ref<number | null>(null);

onMounted(() => {
    loadReservations();
});

async function loadReservations() {
    await fetchReservations(1, search.value, statusFilter.value);
}

function getStatusClass(status: string) {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'confirmed':
            return 'bg-blue-100 text-blue-800';
        case 'active':
            return 'bg-green-100 text-green-800';
        case 'completed':
            return 'bg-gray-100 text-gray-800';
        case 'cancelled':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

async function handleDelete(id: number, reservationNumber: string) {
    if (confirm(t('admin.reservations.confirm_delete', { number: reservationNumber }))) {
        await deleteReservation(id);
        loadReservations();
    }
}

async function toggleExpand(id: number) {
    if (expandedReservation.value === id) {
        expandedReservation.value = null;
    } else {
        expandedReservation.value = id;
        await fetchDocuments(id);
    }
}

import { formatDate, formatDateTime } from '@/utils/date';
</script>

<template>
    <div class="p-6">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-semibold text-gray-900">{{ t('admin.reservations.title') }}</h1>
            <RouterLink 
                to="/admin/reservations/new" 
                class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
                {{ t('admin.reservations.new_reservation') }}
            </RouterLink>
        </div>

        <!-- Filters -->
        <div class="bg-white p-4 rounded-lg shadow mb-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ t('admin.reservations.search') }}
                    </label>
                    <input 
                        v-model="search"
                        @input="loadReservations"
                        type="text"
                        :placeholder="t('admin.reservations.search_placeholder')"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ t('admin.reservations.status_filter') }}
                    </label>
                    <select 
                        v-model="statusFilter"
                        @change="loadReservations"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">{{ t('admin.reservations.all_statuses') }}</option>
                        <option value="pending">{{ t('admin.reservations.status_pending') }}</option>
                        <option value="confirmed">{{ t('admin.reservations.status_confirmed') }}</option>
                        <option value="active">{{ t('admin.reservations.status_active') }}</option>
                        <option value="completed">{{ t('admin.reservations.status_completed') }}</option>
                        <option value="cancelled">{{ t('admin.reservations.status_cancelled') }}</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
            <p class="text-gray-500">{{ t('common.loading') }}...</p>
        </div>

        <!-- Reservations List -->
        <div v-else>
            <!-- Desktop Table (Hidden on Mobile) -->
            <div class="hidden md:block bg-white shadow overflow-hidden sm:rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {{ t('admin.reservations.reservation_number') }}
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {{ t('admin.reservations.client') }}
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {{ t('admin.reservations.car') }}
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {{ t('admin.reservations.dates') }}
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {{ t('admin.reservations.total') }}
                        </th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {{ t('common.status') }}
                        </th>
                        <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Documents
                        </th>
                        <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {{ t('common.actions') }}
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-if="reservations.length === 0">
                        <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                            {{ t('admin.reservations.no_reservations') }}
                        </td>
                    </tr>
                    <template v-for="res in reservations" :key="res.id">
                        <tr class="hover:bg-gray-50 cursor-pointer" @click="toggleExpand(res.id)">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                {{ res.reservation_number }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900">{{ res.client_name }}</div>
                                <div class="text-sm text-gray-500">{{ res.client_cin }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="text-sm font-medium text-gray-900">{{ res.car?.brand }} {{ res.car?.model }}</div>
                                <div class="text-sm text-gray-500">{{ res.car?.plate_number }}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div>{{ formatDateTime(res.start_date) }}</div>
                                <div>{{ formatDateTime(res.end_date) }}</div>
                                <div class="text-xs text-gray-400">({{ res.duration_days }} {{ t('admin.reservations.days') }})</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                ${{ res.total_price.toFixed(2) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span :class="getStatusClass(res.status)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                                    {{ t(`admin.reservations.status_${res.status}`) }}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                <button class="text-indigo-600 hover:text-indigo-900 flex items-center justify-center mx-auto">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :class="{'rotate-180': expandedReservation === res.id}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2" @click.stop>
                                <RouterLink 
                                    :to="`/admin/reservations/${res.id}`" 
                                    class="text-indigo-600 hover:text-indigo-900"
                                >
                                    {{ t('common.edit') }}
                                </RouterLink>
                                <button 
                                    @click="handleDelete(res.id, res.reservation_number)"
                                    class="text-red-600 hover:text-red-900"
                                >
                                    {{ t('common.delete') }}
                                </button>
                            </td>
                        </tr>
                        
                        <!-- Expanded Documents Section -->
                        <tr v-if="expandedReservation === res.id">
                            <td colspan="8" class="px-6 py-4 bg-gray-50">
                                <div class="max-w-4xl">
                                    <h4 class="text-sm font-semibold text-gray-900 mb-3">Documents du Contrat</h4>
                                    <div v-if="documents.length > 0" class="space-y-2">
                                        <div v-for="doc in documents" :key="doc.id" class="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                            <div class="flex items-center space-x-3">
                                                <div class="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-lg text-indigo-600">
                                                    <!-- PDF Icon -->
                                                    <svg v-if="doc.file_name.toLowerCase().endsWith('.pdf')" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <!-- Image Icon -->
                                                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <div class="text-sm font-medium text-gray-900">{{ doc.file_name }}</div>
                                                    <div class="text-xs text-gray-500">Ajouté le {{ formatDateTime(doc.uploaded_at) }}</div>
                                                </div>
                                            </div>
                                            <div class="flex space-x-2">
                                                <a :href="doc.file_url" target="_blank" download class="px-3 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100">
                                                    Télécharger
                                                </a>
                                                <a :href="doc.file_url" target="_blank" class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                                                    Voir
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-else class="text-sm text-gray-500 italic py-2">
                                        Aucun document disponible.
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <!-- Mobile Card View (Hidden on Desktop) -->
        <div class="md:hidden space-y-4">
            <div v-if="reservations.length === 0" class="text-center py-12 bg-white rounded-lg shadow">
                <p class="text-gray-500">{{ t('admin.reservations.no_reservations') }}</p>
            </div>
            
            <div v-for="res in reservations" :key="res.id" class="bg-white rounded-lg shadow p-4 space-y-3">
                <!-- Header: Number & Status -->
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-sm font-bold text-indigo-600">#{{ res.reservation_number }}</span>
                        <div class="text-xs text-gray-500 mt-1">{{ formatDateTime(res.created_at) }}</div>
                    </div>
                    <span :class="getStatusClass(res.status)" class="px-2 py-1 text-xs font-semibold rounded-full">
                        {{ t(`admin.reservations.status_${res.status}`) }}
                    </span>
                </div>

                <!-- Client Info -->
                <div class="flex items-center space-x-3 pt-2 border-t border-gray-100">
                    <User class="h-4 w-4 text-gray-400" />
                    <div>
                        <div class="text-sm font-medium text-gray-900">{{ res.client_name }}</div>
                        <div class="text-xs text-gray-500">{{ res.client_phone }}</div>
                    </div>
                </div>

                <!-- Car Info -->
                <div class="flex items-center space-x-3">
                    <Car class="h-4 w-4 text-gray-400" />
                    <div>
                        <div class="text-sm font-medium text-gray-900">{{ res.car?.brand }} {{ res.car?.model }}</div>
                        <div class="text-xs text-gray-500">{{ res.car?.plate_number }}</div>
                    </div>
                </div>

                <!-- Dates -->
                <div class="flex items-center space-x-3">
                    <Calendar class="h-4 w-4 text-gray-400" />
                    <div class="text-sm text-gray-600">
                        {{ formatDateTime(res.start_date) }} - {{ formatDateTime(res.end_date) }}
                        <span class="text-xs text-gray-400">({{ res.duration_days }}j)</span>
                    </div>
                </div>

                <!-- Price -->
                <div class="flex justify-between items-center pt-2 border-t border-gray-100">
                    <div class="text-sm font-bold text-gray-900">
                        {{ res.total_price.toFixed(2) }} TND
                    </div>
                    
                    <!-- Actions -->
                    <div class="flex space-x-2">
                        <button 
                            @click="toggleExpand(res.id)" 
                            class="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100"
                        >
                            <FileText class="h-4 w-4" />
                        </button>
                        <RouterLink 
                            :to="`/admin/reservations/${res.id}`" 
                            class="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                        >
                            <Edit class="h-4 w-4" />
                        </RouterLink>
                        <button 
                            @click="handleDelete(res.id, res.reservation_number)"
                            class="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                        >
                            <Trash2 class="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <!-- Expanded Documents (Mobile) -->
                <div v-if="expandedReservation === res.id" class="mt-3 pt-3 border-t border-gray-100 bg-gray-50 rounded-md p-3">
                    <h4 class="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Documents</h4>
                    <div v-if="documents.length > 0" class="space-y-2">
                        <div v-for="doc in documents" :key="doc.id" class="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                            <span class="text-xs font-medium text-gray-700 truncate max-w-[150px]">{{ doc.file_name }}</span>
                            <div class="flex space-x-1">
                                <a :href="doc.file_url" target="_blank" download class="p-1 text-indigo-600 hover:bg-indigo-50 rounded">
                                    <Download class="h-3 w-3" />
                                </a>
                                <a :href="doc.file_url" target="_blank" class="p-1 text-gray-600 hover:bg-gray-50 rounded">
                                    <Eye class="h-3 w-3" />
                                </a>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-xs text-gray-500 italic text-center py-1">
                        Aucun document.
                    </div>
                </div>
            </div>
        </div>
        </div>
    </div>
</template>
