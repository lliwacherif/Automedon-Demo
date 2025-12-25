<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';
import { RouterLink } from 'vue-router';
import type { Database } from '@/types/supabase';
import { Car, Search, History } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

type CarData = Database['public']['Tables']['cars']['Row'];

const { t } = useI18n();

const cars = ref<CarData[]>([]);
const loading = ref(true);
const searchTerm = ref('');

onMounted(async () => {
    await fetchCars();
});

async function fetchCars() {
    try {
        const { data, error } = await supabase
            .from('cars')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        cars.value = data || [];
    } catch (error) {
        console.error('Error fetching cars:', error);
    } finally {
        loading.value = false;
    }
}

const filteredCars = () => {
    if (!searchTerm.value) return cars.value;
    const term = searchTerm.value.toLowerCase();
    return cars.value.filter(car => 
        car.make?.toLowerCase().includes(term) ||
        car.model.toLowerCase().includes(term) ||
        car.license_plate.toLowerCase().includes(term)
    );
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'disponible': return 'bg-green-100 text-green-800';
        case 'loue': return 'bg-blue-100 text-blue-800';
        case 'maintenance': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};
</script>

<template>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
                <h1 class="text-2xl font-semibold text-gray-900">{{ t('admin.history.title') }}</h1>
                <p class="mt-2 text-sm text-gray-700">{{ t('admin.history.subtitle') }}</p>
            </div>
        </div>

        <!-- Search -->
        <div class="mt-6 flex justify-between items-center">
            <div class="relative max-w-sm w-full">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search class="h-5 w-5 text-gray-400" />
                </div>
                <input 
                    v-model="searchTerm"
                    type="text" 
                    class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    :placeholder="t('admin.history.search_placeholder')"
                />
            </div>
        </div>

        <!-- content -->
        <div class="mt-8 flex flex-col">
            <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table class="min-w-full divide-y divide-gray-300">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">{{ t('admin.history.vehicle') }}</th>
                                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">{{ t('admin.history.license_plate') }}</th>
                                    <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                        <span class="sr-only">{{ t('common.actions') }}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 bg-white">
                                <tr v-if="loading">
                                    <td colspan="3" class="px-6 py-4 text-center text-sm text-gray-500">{{ t('admin.history.loading') }}</td>
                                </tr>
                                <tr v-else-if="filteredCars().length === 0">
                                    <td colspan="3" class="px-6 py-4 text-center text-sm text-gray-500">{{ t('admin.history.no_cars') }}</td>
                                </tr>
                                <tr v-for="car in filteredCars()" :key="car.id">
                                    <td class="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                                        <div class="flex items-center">
                                            <div class="h-10 w-10 flex-shrink-0">
                                                <img v-if="car.image_url" :src="car.image_url" alt="" class="h-10 w-10 rounded-full object-cover">
                                                <div v-else class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <Car class="h-6 w-6 text-gray-500" />
                                                </div>
                                            </div>
                                            <div class="ml-4">
                                                <div class="font-medium text-gray-900">{{ car.make }} {{ car.model }}</div>
                                                <div class="text-gray-500">{{ car.year }}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        <span class="inline-flex rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">{{ car.license_plate }}</span>
                                    </td>
                                    <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                        <RouterLink :to="{ name: 'admin.history.show', params: { id: car.id } }" class="text-indigo-600 hover:text-indigo-900 flex items-center justify-end gap-1">
                                            <History class="w-4 h-4" />
                                            {{ t('admin.history.view_history') }}
                                        </RouterLink>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
