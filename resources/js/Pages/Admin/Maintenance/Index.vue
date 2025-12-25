<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCars } from '@/composables/useCars';
import { useMaintenanceRecords, MAINTENANCE_TYPE_LABELS, type MaintenanceType } from '@/composables/useMaintenanceRecords';
import type { Database } from '@/types/supabase';
import { 
    Wrench, 
    Calendar, 
    Gauge, 
    DollarSign, 
    MapPin, 
    Edit, 
    Trash2, 
    Plus,
    Car
} from 'lucide-vue-next';

const { cars, loading: carsLoading, fetchCars, fetchCarById, updateCar } = useCars();
const {
    maintenanceRecords,
    loading: maintenanceLoading,
    totalMaintenanceCost,
    fetchMaintenanceRecords,
    createMaintenanceRecord,
    updateMaintenanceRecord,
    deleteMaintenanceRecord,
} = useMaintenanceRecords();

// Selected car state
const selectedCarId = ref<number | null>(null);
const selectedCar = ref<any>(null);

// Modal state
const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingRecordId = ref<number | null>(null);

// Form state
const formData = ref<Database['public']['Tables']['maintenance_records']['Insert']>({
    car_id: 0,
    maintenance_type: 'OIL_CHANGE',
    cost: 0,
    odometer: 0,
    maintenance_date: new Date().toISOString().split('T')[0],
    notes: '',
    provider: '',
    next_due_mileage: null,
});

// Computed
const filteredCars = computed(() => {
    return cars.value.map(car => ({
        id: car.id,
        label: `${car.plate_number} - ${car.brand} ${car.model}`,
        brand: car.brand,
        model: car.model,
        plate_number: car.plate_number,
        mileage: car.mileage || 0,
    }));
});

const maintenanceTypeOptions = computed(() => {
    return Object.entries(MAINTENANCE_TYPE_LABELS).map(([value, label]) => ({
        value: value as MaintenanceType,
        label,
    }));
});

// Methods
async function onCarSelect() {
    if (!selectedCarId.value) {
        selectedCar.value = null;
        maintenanceRecords.value = [];
        return;
    }

    // Fetch car details
    const car = await fetchCarById(selectedCarId.value);
    selectedCar.value = car;

    // Fetch maintenance records
    await fetchMaintenanceRecords(selectedCarId.value);
}

function openAddModal() {
    isEditMode.value = false;
    editingRecordId.value = null;
    formData.value = {
        car_id: selectedCarId.value!,
        maintenance_type: 'OIL_CHANGE',
        cost: 0,
        odometer: selectedCar.value?.mileage || 0,
        maintenance_date: new Date().toISOString().split('T')[0],
        notes: '',
        provider: '',
        next_due_mileage: null,
    };
    isModalOpen.value = true;
}

function openEditModal(record: any) {
    isEditMode.value = true;
    editingRecordId.value = record.id;
    formData.value = {
        car_id: record.car_id,
        maintenance_type: record.maintenance_type,
        cost: record.cost,
        odometer: record.odometer,
        maintenance_date: record.maintenance_date,
        notes: record.notes || '',
        provider: record.provider || '',
        next_due_mileage: record.next_due_mileage || null,
    };
    isModalOpen.value = true;
}

function closeModal() {
    isModalOpen.value = false;
    isEditMode.value = false;
    editingRecordId.value = null;
}

async function submitForm() {
    try {
        if (isEditMode.value && editingRecordId.value) {
            await updateMaintenanceRecord(editingRecordId.value, formData.value);
        } else {
            await createMaintenanceRecord(formData.value);
        }

        // If it's a repair, update car status to maintenance
        if (formData.value.maintenance_type === 'REPAIR' && selectedCarId.value) {
            await updateCar(selectedCarId.value, { status: 'maintenance' });
        }

        // Refresh car details to update mileage
        if (selectedCarId.value) {
            const car = await fetchCarById(selectedCarId.value);
            selectedCar.value = car;
        }

        closeModal();
    } catch (error) {
        console.error('Error submitting maintenance record:', error);
    }
}

async function handleDelete(recordId: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement?')) {
        return;
    }

    try {
        await deleteMaintenanceRecord(recordId, selectedCarId.value!);

        // Refresh car details
        if (selectedCarId.value) {
            const car = await fetchCarById(selectedCarId.value);
            selectedCar.value = car;
        }
    } catch (error) {
        console.error('Error deleting maintenance record:', error);
    }
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
    }).format(value);
}

import { formatDate } from '@/utils/date';

onMounted(() => {
    fetchCars();
});
</script>

<template>
    <div class="min-h-screen bg-gray-100">
        <main>
            <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <!-- Header -->
                <div class="px-4 py-6 sm:px-0">
                    <div class="flex items-center justify-between mb-6">
                        <h1 class="text-3xl font-bold text-gray-900">Gestion Maintenance</h1>
                    </div>

                    <!-- Car Selector -->
                    <div class="bg-white shadow rounded-lg p-6 mb-6">
                        <label for="car-select" class="block text-sm font-medium text-gray-700 mb-2">
                            Sélectionner une voiture
                        </label>
                        <select
                            id="car-select"
                            v-model="selectedCarId"
                            @change="onCarSelect"
                            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option :value="null">-- Choisir une voiture --</option>
                            <option v-for="car in filteredCars" :key="car.id" :value="car.id">
                                {{ car.label }}
                            </option>
                        </select>
                    </div>

                    <!-- Main Content (shown when car is selected) -->
                    <div v-if="selectedCar">
                        <!-- Car Info & Stats -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <!-- Car Details Card -->
                            <div class="bg-white shadow rounded-lg p-6">
                                <h2 class="text-lg font-semibold text-gray-900 mb-4">Informations Véhicule</h2>
                                <dl class="space-y-2">
                                    <div class="flex justify-between">
                                        <dt class="text-sm text-gray-500">Marque & Modèle:</dt>
                                        <dd class="text-sm font-medium text-gray-900">
                                            {{ selectedCar.brand }} {{ selectedCar.model }}
                                        </dd>
                                    </div>
                                    <div class="flex justify-between">
                                        <dt class="text-sm text-gray-500">Plaque:</dt>
                                        <dd class="text-sm font-medium text-gray-900">{{ selectedCar.plate_number }}</dd>
                                    </div>
                                    <div class="flex justify-between">
                                        <dt class="text-sm text-gray-500">Kilométrage Actuel:</dt>
                                        <dd class="text-sm font-medium text-gray-900">
                                            {{ (selectedCar.mileage || 0).toLocaleString() }} km
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <!-- Maintenance Stats Card -->
                            <div class="bg-white shadow rounded-lg p-6">
                                <h2 class="text-lg font-semibold text-gray-900 mb-4">Statistiques Maintenance</h2>
                                <dl class="space-y-2">
                                    <div class="flex justify-between">
                                        <dt class="text-sm text-gray-500">Nombre d'opérations:</dt>
                                        <dd class="text-sm font-medium text-gray-900">{{ maintenanceRecords.length }}</dd>
                                    </div>
                                    <div class="flex justify-between">
                                        <dt class="text-sm text-gray-500">Coût Total d'Entretien:</dt>
                                        <dd class="text-lg font-bold text-indigo-600">
                                            {{ formatCurrency(totalMaintenanceCost) }}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        <!-- Add Button -->
                        <div class="mb-6">
                            <button
                                @click="openAddModal"
                                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto justify-center"
                            >
                                <Plus class="h-5 w-5 mr-2" />
                                Ajouter Entretien
                            </button>
                        </div>

                        <!-- Maintenance History Table (Desktop) -->
                        <div class="hidden md:block bg-white shadow rounded-lg overflow-hidden">
                            <div class="px-6 py-4 border-b border-gray-200">
                                <h2 class="text-lg font-semibold text-gray-900">Historique d'Entretien</h2>
                            </div>

                            <div v-if="maintenanceLoading" class="p-6 text-center">
                                <p class="text-gray-500">Chargement...</p>
                            </div>

                            <div v-else-if="maintenanceRecords.length === 0" class="p-6 text-center">
                                <p class="text-gray-500">Aucun enregistrement de maintenance pour ce véhicule.</p>
                            </div>

                            <div v-else class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Kilométrage
                                            </th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Coût
                                            </th>
                                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Garage
                                            </th>
                                            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                        <tr v-for="record in maintenanceRecords" :key="record.id" class="hover:bg-gray-50">
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {{ formatDate(record.maintenance_date) }}
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {{ MAINTENANCE_TYPE_LABELS[record.maintenance_type] }}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div>{{ record.odometer.toLocaleString() }} km</div>
                                                <div v-if="record.next_due_mileage" class="text-xs text-indigo-600 font-medium mt-1">
                                                    Prochain: {{ record.next_due_mileage.toLocaleString() }} km
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {{ formatCurrency(record.cost) }}
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {{ record.provider || '-' }}
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    @click="openEditModal(record)"
                                                    class="text-indigo-600 hover:text-indigo-900 mr-3"
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    @click="handleDelete(record.id)"
                                                    class="text-red-600 hover:text-red-900"
                                                >
                                                    Supprimer
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Maintenance History Cards (Mobile) -->
                        <div class="md:hidden space-y-4">
                            <div v-if="maintenanceLoading" class="text-center py-8">
                                <p class="text-gray-500">Chargement...</p>
                            </div>
                            <div v-else-if="maintenanceRecords.length === 0" class="text-center py-8 bg-white rounded-lg shadow">
                                <p class="text-gray-500">Aucun enregistrement.</p>
                            </div>
                            <div v-else v-for="record in maintenanceRecords" :key="record.id" class="bg-white rounded-lg shadow p-4 space-y-3">
                                <!-- Header: Date & Type -->
                                <div class="flex justify-between items-start">
                                    <div class="flex items-center space-x-2">
                                        <Calendar class="h-4 w-4 text-gray-400" />
                                        <span class="text-sm font-medium text-gray-900">{{ formatDate(record.maintenance_date) }}</span>
                                    </div>
                                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        {{ MAINTENANCE_TYPE_LABELS[record.maintenance_type] }}
                                    </span>
                                </div>

                                <!-- Odometer -->
                                <div class="flex items-center space-x-2 text-sm text-gray-600">
                                    <Gauge class="h-4 w-4 text-gray-400" />
                                    <span>{{ record.odometer.toLocaleString() }} km</span>
                                    <span v-if="record.next_due_mileage" class="text-xs text-indigo-600 font-medium ml-2">
                                        (Prochain: {{ record.next_due_mileage.toLocaleString() }} km)
                                    </span>
                                </div>

                                <!-- Cost & Provider -->
                                <div class="flex justify-between items-center text-sm">
                                    <div class="flex items-center space-x-2 text-gray-900 font-semibold">
                                        <DollarSign class="h-4 w-4 text-gray-400" />
                                        <span>{{ formatCurrency(record.cost) }}</span>
                                    </div>
                                    <div class="flex items-center space-x-2 text-gray-500">
                                        <MapPin class="h-4 w-4 text-gray-400" />
                                        <span>{{ record.provider || '-' }}</span>
                                    </div>
                                </div>

                                <!-- Actions -->
                                <div class="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                                    <button
                                        @click="openEditModal(record)"
                                        class="flex items-center text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                    >
                                        <Edit class="h-4 w-4 mr-1" />
                                        Modifier
                                    </button>
                                    <button
                                        @click="handleDelete(record.id)"
                                        class="flex items-center text-red-600 hover:text-red-900 text-sm font-medium"
                                    >
                                        <Trash2 class="h-4 w-4 mr-1" />
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div v-else class="bg-white shadow rounded-lg p-12 text-center">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h3 class="mt-2 text-sm font-medium text-gray-900">Aucune voiture sélectionnée</h3>
                        <p class="mt-1 text-sm text-gray-500">Sélectionnez une voiture pour voir son historique de maintenance.</p>
                    </div>
                </div>
            </div>
        </main>

        <!-- Add/Edit Modal -->
        <Teleport to="body">
            <Transition name="fade">
                <div
                    v-if="isModalOpen"
                    class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center"
                    @click.self="closeModal"
                >
                    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <!-- Modal Header -->
                        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-gray-900">
                                {{ isEditMode ? 'Modifier Entretien' : 'Ajouter Entretien' }}
                            </h3>
                            <button @click="closeModal" class="text-gray-400 hover:text-gray-500">
                                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <!-- Modal Body -->
                        <form @submit.prevent="submitForm" class="px-6 py-4">
                            <div class="space-y-4">
                                <!-- Maintenance Type -->
                                <div>
                                    <label for="maintenance-type" class="block text-sm font-medium text-gray-700 mb-1">
                                        Type d'Entretien *
                                    </label>
                                    <select
                                        id="maintenance-type"
                                        v-model="formData.maintenance_type"
                                        required
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        <option v-for="option in maintenanceTypeOptions" :key="option.value" :value="option.value">
                                            {{ option.label }}
                                        </option>
                                    </select>
                                </div>

                                <!-- Odometer -->
                                <div>
                                    <label for="odometer" class="block text-sm font-medium text-gray-700 mb-1">
                                        Kilométrage *
                                    </label>
                                    <input
                                        id="odometer"
                                        v-model.number="formData.odometer"
                                        type="number"
                                        min="0"
                                        required
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Ex: 45000"
                                    />
                                </div>

                                <!-- Next Due Mileage (only for Oil Change) -->
                                <div v-if="formData.maintenance_type === 'OIL_CHANGE'">
                                    <label for="next-due-mileage" class="block text-sm font-medium text-gray-700 mb-1">
                                        Prochaine Vidange à (km)
                                    </label>
                                    <input
                                        id="next-due-mileage"
                                        v-model.number="formData.next_due_mileage"
                                        type="number"
                                        min="0"
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Ex: 50000"
                                    />
                                    <p class="mt-1 text-xs text-gray-500">Kilométrage auquel faire la prochaine vidange</p>
                                </div>

                                <!-- Cost -->
                                <div>
                                    <label for="cost" class="block text-sm font-medium text-gray-700 mb-1">
                                        Coût (TND) *
                                    </label>
                                    <input
                                        id="cost"
                                        v-model.number="formData.cost"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Ex: 150.00"
                                    />
                                </div>

                                <!-- Date -->
                                <div>
                                    <label for="maintenance-date" class="block text-sm font-medium text-gray-700 mb-1">
                                        {{ formData.maintenance_type === 'REPAIR' ? 'Date de début *' : 'Date *' }}
                                    </label>
                                    <input
                                        id="maintenance-date"
                                        v-model="formData.maintenance_date"
                                        type="date"
                                        required
                                        :max="new Date().toISOString().split('T')[0]"
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>

                                <!-- Provider (Hidden for financial types) -->
                                <div v-if="!['ASSURANCE', 'VIGNETTE', 'LEASING'].includes(formData.maintenance_type)">
                                    <label for="provider" class="block text-sm font-medium text-gray-700 mb-1">
                                        Garage / Fournisseur
                                    </label>
                                    <input
                                        id="provider"
                                        v-model="formData.provider"
                                        type="text"
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Ex: Garage Central"
                                    />
                                </div>

                                <!-- Notes -->
                                <div>
                                    <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
                                        Description / Notes
                                    </label>
                                    <textarea
                                        id="notes"
                                        v-model="formData.notes"
                                        rows="3"
                                        class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Détails de l'entretien..."
                                    ></textarea>
                                </div>
                            </div>

                            <!-- Modal Footer -->
                            <div class="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    @click="closeModal"
                                    class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    :disabled="maintenanceLoading"
                                    class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {{ maintenanceLoading ? 'Enregistrement...' : (isEditMode ? 'Modifier' : 'Ajouter') }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
