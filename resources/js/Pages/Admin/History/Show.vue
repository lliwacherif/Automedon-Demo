<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import { ArrowLeft } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { MAINTENANCE_TYPE_LABELS } from '@/composables/useMaintenanceRecords';

// Types
type Car = Database['public']['Tables']['cars']['Row'];
type Reservation = Database['public']['Tables']['reservations']['Row'];
type Maintenance = Database['public']['Tables']['maintenance_records']['Row'];

const { t } = useI18n();

const route = useRoute();
const carId = route.params.id as string;

const car = ref<Car | null>(null);
const reservations = ref<Reservation[]>([]);
const maintenanceRecords = ref<Maintenance[]>([]);
const loading = ref(true);

const filterStartDate = ref('');
const filterEndDate = ref('');

onMounted(async () => {
    await fetchData();
});

async function fetchData() {
    loading.value = true;
    try {
        // Fetch Car Details
        const { data: carData, error: carError } = await supabase
            .from('cars')
            .select('*')
            .eq('id', carId)
            .single();
        
        if (carError) throw carError;
        car.value = carData;

        // Fetch Reservations
        const { data: resData, error: resError } = await supabase
            .from('reservations')
            .select('*')
            .eq('car_id', carId)
            .order('start_date', { ascending: false });
        
        if (resError) throw resError;
        reservations.value = resData || [];

        // Fetch Maintenance Records
        const { data: maintData, error: maintError } = await supabase
            .from('maintenance_records')
            .select('*')
            .eq('car_id', carId)
            .order('maintenance_date', { ascending: false });

        if (maintError) throw maintError;
        maintenanceRecords.value = maintData || [];

    } catch (error) {
        console.error('Error fetching car history:', error);
    } finally {
        loading.value = false;
    }
}

import { formatDate } from '@/utils/date';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(amount);
};

const dateInRange = (dateStr: string) => {
    if (!filterStartDate.value && !filterEndDate.value) return true;
    const date = new Date(dateStr);
    const start = filterStartDate.value ? new Date(filterStartDate.value) : null;
    const end = filterEndDate.value ? new Date(filterEndDate.value) : null;

    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
};

const filteredReservations = computed(() => {
    return reservations.value.filter(res => dateInRange(res.start_date));
});

const filteredMaintenance = computed(() => {
    return maintenanceRecords.value.filter(rec => dateInRange(rec.maintenance_date));
});

const grandTotal = computed(() => {
    return filteredReservations.value.reduce((sum, res) => sum + (res.total_price || 0), 0);
});

const totalMaintenanceCost = computed(() => {
    return filteredMaintenance.value.reduce((sum, rec) => sum + (rec.cost || 0), 0);
});

const netRevenue = computed(() => {
    return grandTotal.value - totalMaintenanceCost.value;
});
</script>

<template>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" v-if="!loading && car">
        <!-- Back Button -->
        <div class="mb-6 flex justify-between items-center">
            <RouterLink to="/admin/history" class="flex items-center text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft class="w-4 h-4 mr-1" />
                {{ t('admin.history.back_to_list') }}
            </RouterLink>

            <!-- Date Filters -->
            <div class="flex items-center space-x-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                <div class="flex items-center space-x-2">
                    <label class="text-sm font-medium text-gray-700">Du:</label>
                    <input type="date" v-model="filterStartDate" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <div class="flex items-center space-x-2">
                    <label class="text-sm font-medium text-gray-700">Au:</label>
                    <input type="date" v-model="filterEndDate" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <button 
                    v-if="filterStartDate || filterEndDate"
                    @click="filterStartDate = ''; filterEndDate = ''"
                    class="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    Réinitialiser
                </button>
            </div>
        </div>

        <!-- Car Header Card -->
        <div class="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div class="px-4 py-5 sm:px-6 flex justify-between items-start">
                <div>
                    <h3 class="text-2xl font-bold leading-6 text-gray-900 flex items-center gap-2">
                        {{ car.brand }} {{ car.model }} 
                    </h3>
                    <p class="mt-1 text-sm text-gray-500 flex items-center gap-2">
                        <span class="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-mono">{{ car.license_plate }}</span>
                        <span :class="{'text-green-600': car.status === 'disponible', 'text-blue-600': car.status === 'loue', 'text-red-600': car.status === 'maintenance'}">
                            ● {{ car.status ? t(`admin.fleet.${car.status}`) : car.status }}
                        </span>
                    </p>
                </div>
                <div v-if="car.image_url" class="h-16 w-24 flex-shrink-0">
                    <img :src="car.image_url" alt="" class="h-full w-full object-cover rounded-md">
                </div>
            </div>
            <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div class="flex items-center justify-end">
                     <div class="text-xl font-bold" :class="netRevenue >= 0 ? 'text-green-600' : 'text-red-600'">
                        Revenu Net: {{ formatCurrency(netRevenue) }}
                     </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Reservations Table -->
            <div class="bg-white shadow overflow-hidden sm:rounded-lg">
                <div class="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                        {{ t('admin.history.reservations_history') }}
                    </h3>
                    <div class="text-sm font-bold text-green-600">
                        Total: {{ formatCurrency(grandTotal) }}
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-300">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                    {{ t('admin.reservations.client') }}
                                </th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    {{ t('admin.reservations.dates') }}
                                </th>
                                <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                                    {{ t('admin.reservations.total_price') }}
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 bg-white">
                            <tr v-for="res in filteredReservations" :key="res.id">
                                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                    {{ res.client_name }}
                                </td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {{ formatDate(res.start_date) }} - {{ formatDate(res.end_date) }}
                                </td>
                                <td class="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-900 font-medium">
                                    {{ formatCurrency(res.total_price) }}
                                </td>
                            </tr>
                            <tr v-if="filteredReservations.length === 0">
                                <td colspan="3" class="px-3 py-8 text-center text-sm text-gray-500">
                                    {{ t('admin.history.no_reservations') }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Maintenance/Cost History Table -->
            <div class="bg-white shadow overflow-hidden sm:rounded-lg">
                <div class="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                        Historique des Coûts
                    </h3>
                    <div class="text-sm font-bold text-red-600">
                        Total: {{ formatCurrency(totalMaintenanceCost) }}
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-300">
                        <thead class="bg-gray-50">
                            <tr>
                                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                    Type
                                </th>
                                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Date
                                </th>
                                <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                                    Coût
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 bg-white">
                            <tr v-for="rec in filteredMaintenance" :key="rec.id">
                                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                    {{ MAINTENANCE_TYPE_LABELS[rec.maintenance_type] || rec.maintenance_type }}
                                </td>
                                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {{ formatDate(rec.maintenance_date) }}
                                </td>
                                <td class="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-900 font-medium">
                                    {{ formatCurrency(rec.cost) }}
                                </td>
                            </tr>
                             <tr v-if="filteredMaintenance.length === 0">
                                <td colspan="3" class="px-3 py-8 text-center text-sm text-gray-500">
                                    Aucun entretien enregistré.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <div v-else class="flex justify-center items-center h-64">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
</template>
