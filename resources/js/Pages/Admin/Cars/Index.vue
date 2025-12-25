g<script setup lang="ts">
import { onMounted } from 'vue';
import { useCars, type CarStatus } from '@/composables/useCars';
import { RouterLink } from 'vue-router';
import { 
    Car, 
    Edit, 
    Trash2, 
    CheckCircle, 
    AlertCircle, 
    Clock 
} from 'lucide-vue-next';

const { carsByBrand, loading, fetchCars, deleteCar, updateCar } = useCars();

onMounted(() => {
    fetchCars();
});

async function handleDelete(id: number) {
    if (confirm('Are you sure you want to delete this car?')) {
        await deleteCar(id);
    }
}

async function handleStatusChange(id: number, newStatus: CarStatus) {
    await updateCar(id, { status: newStatus });
}
</script>

<template>
    <div class="p-6">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-semibold text-gray-900">{{ $t('admin.fleet.title') }}</h1>
            <RouterLink to="/admin/cars/create" class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                {{ $t('admin.fleet.add_car') }}
            </RouterLink>
        </div>

        <div v-if="loading" class="text-center py-12">
            <p class="text-gray-500">Loading...</p>
        </div>

        <div v-else class="space-y-8">
            <!-- Iterate over each brand -->
            <div v-for="(brand, brandName) in carsByBrand" :key="brandName" class="bg-white shadow rounded-lg overflow-hidden">
                <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h2 class="text-xl font-bold text-gray-900">{{ brandName }}</h2>
                </div>
                
                <div v-if="brand.length === 0" class="px-6 py-8 text-center text-gray-500">
                    {{ $t('admin.fleet.no_cars') }}
                </div>

                <div v-else>
                    <!-- Desktop Table -->
                    <div class="hidden md:block overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {{ $t('admin.fleet.model') }}
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {{ $t('admin.fleet.plate_number') }}
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {{ $t('admin.fleet.status') }}
                                    </th>
                                    <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr v-for="car in brand" :key="car.id">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {{ car.model }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                        {{ car.plate_number }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                    <select 
                                        :value="car.status"
                                        @change="handleStatusChange(car.id, ($event.target as HTMLSelectElement).value as CarStatus)"
                                        :disabled="car.status !== 'maintenance'"
                                        title="Le statut ne peut être modifié manuellement que s'il est en maintenance."
                                        :class="{
                                            'bg-green-100 text-green-800': car.status === 'disponible',
                                            'bg-red-100 text-red-800': car.status === 'loue',
                                            'bg-yellow-100 text-yellow-800': car.status === 'maintenance',
                                            'opacity-50 cursor-not-allowed': car.status !== 'maintenance'
                                        }"
                                        class="text-xs font-semibold rounded-md border-0 py-1 px-2 focus:ring-2 focus:ring-indigo-500"
                                    >
                                            <option value="disponible">{{ $t('admin.fleet.disponible') }}</option>
                                            <option value="loue">{{ $t('admin.fleet.loue') }}</option>
                                            <option value="maintenance">{{ $t('admin.fleet.maintenance') }}</option>
                                        </select>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <RouterLink 
                                            :to="`/admin/cars/${car.id}/edit`" 
                                            class="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            {{ $t('admin.fleet.edit_car') }}
                                        </RouterLink>
                                        <button 
                                            @click="handleDelete(car.id)" 
                                            class="text-red-600 hover:text-red-900"
                                        >
                                            {{ $t('admin.fleet.delete') }}
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Mobile Cards -->
                    <div class="md:hidden p-4 space-y-4">
                        <div v-for="car in brand" :key="car.id" class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div class="flex justify-between items-start mb-3">
                                <div>
                                    <h3 class="text-sm font-bold text-gray-900">{{ car.model }}</h3>
                                    <p class="text-xs text-gray-500 font-mono mt-1">{{ car.plate_number }}</p>
                                </div>
                                <select 
                                    :value="car.status"
                                    @change="handleStatusChange(car.id, ($event.target as HTMLSelectElement).value as CarStatus)"
                                    :disabled="car.status !== 'maintenance'"
                                    :class="{
                                        'bg-green-100 text-green-800': car.status === 'disponible',
                                        'bg-red-100 text-red-800': car.status === 'loue',
                                        'bg-yellow-100 text-yellow-800': car.status === 'maintenance',
                                        'opacity-50 cursor-not-allowed': car.status !== 'maintenance'
                                    }"
                                    class="text-xs font-semibold rounded-full border-0 py-1 px-2 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="disponible">{{ $t('admin.fleet.disponible') }}</option>
                                    <option value="loue">{{ $t('admin.fleet.loue') }}</option>
                                    <option value="maintenance">{{ $t('admin.fleet.maintenance') }}</option>
                                </select>
                            </div>
                            
                            <div class="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                                <RouterLink 
                                    :to="`/admin/cars/${car.id}/edit`" 
                                    class="flex items-center text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                >
                                    <Edit class="h-4 w-4 mr-1" />
                                    {{ $t('admin.fleet.edit_car') }}
                                </RouterLink>
                                <button 
                                    @click="handleDelete(car.id)" 
                                    class="flex items-center text-red-600 hover:text-red-900 text-sm font-medium"
                                >
                                    <Trash2 class="h-4 w-4 mr-1" />
                                    {{ $t('admin.fleet.delete') }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
