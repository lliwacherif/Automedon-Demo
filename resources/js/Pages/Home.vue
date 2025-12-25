<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useCars, type Car } from '@/composables/useCars';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import ReservationModal from '@/components/ReservationModal.vue';
import CarAvailabilityModal from '@/components/CarAvailabilityModal.vue';
import { Eye } from 'lucide-vue-next';

const { cars, loading, fetchCars } = useCars();
const authStore = useAuthStore();
const router = useRouter();

const filters = ref({
    search: '',
    status: 'all'
});

// Modal States
const showReservationModal = ref(false);
const showAvailabilityModal = ref(false);
const selectedCar = ref<Car | null>(null);

onMounted(() => {
    fetchCars();
});

// Filtrage côté client
const filteredCars = computed(() => {
    let result = cars.value;

    // Filtre par statut
    if (filters.value.status !== 'all') {
        result = result.filter(car => car.status === filters.value.status);
    }

    // Filtre par recherche (brand ou model)
    if (filters.value.search) {
        const searchLower = filters.value.search.toLowerCase();
        result = result.filter(car => 
            car.brand.toLowerCase().includes(searchLower) ||
            car.model.toLowerCase().includes(searchLower) ||
            car.plate_number.toLowerCase().includes(searchLower)
        );
    }

    return result;
});

// Helper to get brand logo path
const getBrandLogo = (brand: string) => {
    return `/images/${brand}.png`;
};

import { formatDate } from '@/utils/date';

// Handle booking components
const openAvailabilityModal = (car: Car) => {
    selectedCar.value = car;
    showAvailabilityModal.value = true;
};

const closeAvailabilityModal = () => {
    showAvailabilityModal.value = false;
    selectedCar.value = null;
};

const openBookingModal = (car: Car) => {
    if (!authStore.user) {
        // Redirect to login if not authenticated
        router.push({ name: 'login', query: { redirect: '/' } });
        return;
    }
    selectedCar.value = car;
    showReservationModal.value = true;
};

const closeBookingModal = () => {
    showReservationModal.value = false;
    selectedCar.value = null;
};

const onReservationSuccess = () => {
    // Refresh cars to update status
    fetchCars();
};
</script>

<template>
    <div class="min-h-screen bg-gray-100">
        <main class="w-full py-6 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
            <div>
                <h1 class="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">{{ $t('fleet.title') }}</h1>

                <!-- Search & Filter Bar -->
                <div class="bg-white p-4 sm:p-5 rounded-xl shadow-sm mb-6 border border-gray-100">
                    <div class="flex flex-col sm:flex-row gap-4">
                        <div class="flex-1">
                            <input 
                                v-model="filters.search" 
                                type="text" 
                                :placeholder="$t('fleet.search_placeholder')" 
                                class="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-base py-3 px-4"
                            >
                        </div>
                        <div class="sm:w-64">
                            <select 
                                v-model="filters.status" 
                                class="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-base py-3 px-4"
                            >
                                <option value="all">{{ $t('fleet.all_statuses') }}</option>
                                <option value="disponible">{{ $t('admin.fleet.disponible') }}</option>
                                <option value="loue">{{ $t('admin.fleet.loue') }}</option>
                                <option value="maintenance">{{ $t('admin.fleet.maintenance') }}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Loading State -->
                <div v-if="loading" class="text-center py-16">
                    <div class="inline-flex items-center gap-3 text-gray-500">
                        <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span class="text-lg">{{ $t('fleet.loading') }}</span>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else-if="filteredCars.length === 0" class="text-center py-16">
                    <p class="text-gray-500 text-lg">Aucune voiture trouvée.</p>
                </div>

                <!-- Cars Grid - Responsive columns -->
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    <div 
                        v-for="car in filteredCars" 
                        :key="car.id" 
                        class="group bg-white rounded-xl shadow-sm hover:shadow-lg overflow-hidden flex flex-col h-full transition-all duration-300 border border-gray-100 hover:border-indigo-200"
                    >
                        <!-- Car Image -->
                        <div class="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                            <img 
                                :src="car.image_url || 'https://via.placeholder.com/400x300?text=No+Image'" 
                                :alt="`${car.brand} ${car.model}`" 
                                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            >
                            <!-- Brand Logo -->
                            <div class="absolute bottom-3 right-3 bg-white rounded-lg p-2 shadow-md">
                                <img 
                                    :src="getBrandLogo(car.brand)" 
                                    :alt="car.brand" 
                                    class="h-8 w-8 object-contain"
                                >
                            </div>
                        </div>
                        
                        <!-- Car Info -->
                        <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 class="text-lg sm:text-xl font-semibold text-gray-900">
                                    {{ car.brand }} {{ car.model }}
                                </h3>
                                <p class="text-sm text-gray-500 mt-1">{{ car.plate_number }}</p>
                            </div>
                            
                            <div class="mt-4">
                                <button 
                                    @click="openAvailabilityModal(car)"
                                    class="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                    <Eye class="w-5 h-5 mr-2" />
                                    Voir Plus / Disponibilité
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Reservation Modal -->
        <ReservationModal 
            :show="showReservationModal" 
            :car="selectedCar"
            @close="closeBookingModal"
            @success="onReservationSuccess"
        />

        <!-- Car Availability Modal -->
        <CarAvailabilityModal
            :show="showAvailabilityModal"
            :car="selectedCar"
            @close="closeAvailabilityModal"
        />
    </div>
</template>
