<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useReservations } from '@/composables/useReservations';
import { useAuthStore } from '@/stores/auth';
import type { Car } from '@/composables/useCars';
import { formatDate } from '@/utils/date';

const props = defineProps<{
    show: boolean;
    car: Car | null;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'success'): void;
}>();

const { createReservation, checkAvailability, loading, error } = useReservations();
const authStore = useAuthStore();

const form = ref({
    client_name: '',
    client_cin: '',
    client_phone: '',
    client_email: authStore.user?.email || '',
    start_date: '',
    end_date: '',
    price_per_day: 150, // Default price per day in TND
    pickup_location: '',
    return_location: '',
    notes: '',
});

const formError = ref('');
const success = ref(false);

// Calculate duration and total price
const durationDays = computed(() => {
    if (!form.value.start_date || !form.value.end_date) return 0;
    const start = new Date(form.value.start_date);
    const end = new Date(form.value.end_date);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
});

const totalPrice = computed(() => {
    return durationDays.value * form.value.price_per_day;
});

// Hours and Minutes for time picker
const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minutes = ['00', '30'];

// Separate inputs for separate control
const startDateDate = ref('');
const startHour = ref('09');
const startMinute = ref('00');
const endDateDate = ref('');
const endHour = ref('09');
const endMinute = ref('00');

// Sync local inputs to form.start_date
watch([startDateDate, startHour, startMinute], ([date, hour, minute]) => {
    if (date && hour && minute) {
        // Ensure minute is 2 digits for ISO string
        const m = minute.padStart(2, '0');
        form.value.start_date = `${date}T${hour}:${m}`;
    } else {
        form.value.start_date = '';
    }
});

// Sync local inputs to form.end_date
watch([endDateDate, endHour, endMinute], ([date, hour, minute]) => {
    if (date && hour && minute) {
        // Ensure minute is 2 digits for ISO string
        const m = minute.padStart(2, '0');
        form.value.end_date = `${date}T${hour}:${m}`;
    } else {
        form.value.end_date = '';
    }
});

// Reset form when modal opens
watch(() => props.show, (newVal) => {
    if (newVal) {
        form.value = {
            client_name: '',
            client_cin: '',
            client_phone: '',
            client_email: authStore.user?.email || '',
            start_date: '',
            end_date: '',
            price_per_day: 150,
            pickup_location: '',
            return_location: '',
            notes: '',
        };
        // Reset local refs

        startDateDate.value = '';
        startHour.value = '09';
        startMinute.value = '00';
        endDateDate.value = '';
        endHour.value = '09';
        endMinute.value = '00';
        
        formError.value = '';
        success.value = false;
    }
});

const validateForm = () => {
    if (!form.value.client_name.trim()) {
        formError.value = 'Le nom est requis';
        return false;
    }
    if (!form.value.client_cin.trim()) {
        formError.value = 'Le CIN est requis';
        return false;
    }
    if (!form.value.client_phone.trim()) {
        formError.value = 'Le téléphone est requis';
        return false;
    }
    if (!form.value.start_date) {
        formError.value = 'La date de début est requise';
        return false;
    }
    if (!form.value.end_date) {
        formError.value = 'La date de fin est requise';
        return false;
    }
    if (durationDays.value <= 0) {
        formError.value = 'La date de fin doit être après la date de début';
        return false;
    }
    formError.value = '';
    return true;
};

const submitReservation = async () => {
    if (!validateForm() || !props.car) return;

    // Check availability first
    try {
        const isAvailable = await checkAvailability(
            props.car.id, 
            form.value.start_date, 
            form.value.end_date
        );

        if (!isAvailable) {
            formError.value = "Date deja reservé choisir un autre date";
            return;
        }

        await createReservation({
            user_id: authStore.user?.id || null, // Allow null for guests
            car_id: props.car.id,
            client_name: form.value.client_name,
            client_cin: form.value.client_cin,
            client_phone: form.value.client_phone,
            client_email: form.value.client_email || null,
            start_date: form.value.start_date,
            end_date: form.value.end_date,
            duration_days: durationDays.value,
            price_per_day: form.value.price_per_day,
            total_price: totalPrice.value,
            status: 'pending', // Set to pending (En Attente) for admin review
            pickup_location: form.value.pickup_location || null,
            return_location: form.value.return_location || null,
            notes: form.value.notes || null,
        });

        success.value = true;
        setTimeout(() => {
            emit('success');
            emit('close');
        }, 2000);
    } catch (e: any) {
        formError.value = e.message || 'Une erreur est survenue';
    }
};

const closeModal = () => {
    emit('close');
};

// Get today's date for min attribute
const today = new Date().toISOString().split('T')[0];
</script>

<template>
    <Teleport to="body">
        <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
            <!-- Backdrop -->
            <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="closeModal"></div>

            <!-- Modal -->
            <div class="flex min-h-full items-center justify-center p-4">
                <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <!-- Header -->
                    <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 class="text-xl font-semibold text-gray-900">Réserver une voiture</h2>
                            <p v-if="car" class="text-sm text-gray-500 mt-1">
                                {{ car.brand }} {{ car.model }} - {{ car.plate_number }}
                            </p>
                        </div>
                        <button @click="closeModal" class="text-gray-400 hover:text-gray-500">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!-- Success Message -->
                    <div v-if="success" class="p-6">
                        <div class="text-center">
                            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                                <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 class="mt-4 text-lg font-medium text-gray-900">Réservation envoyée !</h3>
                            <p class="mt-2 text-sm text-gray-500">
                                Votre demande de réservation a été envoyée avec succès. 
                                Vous recevrez une confirmation sous peu.
                            </p>
                        </div>
                    </div>

                    <!-- Form -->
                    <form v-else @submit.prevent="submitReservation" class="p-6 space-y-6">
                        <!-- Error Message -->
                        <div v-if="formError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                            {{ formError }}
                        </div>

                        <!-- Client Information -->
                        <div>
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Nom complet *</label>
                                    <input 
                                        v-model="form.client_name"
                                        type="text" 
                                        required
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        placeholder="Votre nom complet"
                                    >
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">CIN *</label>
                                    <input 
                                        v-model="form.client_cin"
                                        type="text" 
                                        required
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        placeholder="Numéro de carte d'identité"
                                    >
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Téléphone *</label>
                                    <input 
                                        v-model="form.client_phone"
                                        type="tel" 
                                        required
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        placeholder="+216 XX XXX XXX"
                                    >
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Email</label>
                                    <input 
                                        v-model="form.client_email"
                                        type="email"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        placeholder="votre@email.com"
                                    >
                                </div>
                            </div>
                        </div>

                        <!-- Reservation Dates -->
                        <div>
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Dates de location</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Date de début *</label>
                                    <div class="flex space-x-2 mt-1">
                                        <input 
                                            v-model="startDateDate"
                                            type="date" 
                                            :min="today"
                                            required
                                            class="block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        >
                                        <div class="flex w-1/2 items-center gap-1">
                                            <select
                                                v-model="startHour"
                                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-0 text-center"
                                            >
                                                <option v-for="h in hours" :key="h" :value="h">{{ h }}</option>
                                            </select>
                                            <span class="text-gray-500 font-bold">:</span>
                                            <select
                                                v-model="startMinute"
                                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-0 text-center"
                                            >
                                                <option v-for="m in minutes" :key="m" :value="m">{{ m }}</option>
                                            </select>
                                        </div>
                                    </div>
                                    <p v-if="form.start_date" class="mt-1 text-xs text-indigo-600 font-medium">
                                        {{ formatDate(form.start_date) }}
                                    </p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Date de fin *</label>
                                    <div class="flex space-x-2 mt-1">
                                         <input 
                                            v-model="endDateDate"
                                            type="date" 
                                            :min="startDateDate || today"
                                            required
                                            class="block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        >
                                        <div class="flex w-1/2 items-center gap-1">
                                            <select
                                                v-model="endHour"
                                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-0 text-center"
                                            >
                                                <option v-for="h in hours" :key="h" :value="h">{{ h }}</option>
                                            </select>
                                            <span class="text-gray-500 font-bold">:</span>
                                            <select
                                                v-model="endMinute"
                                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-0 text-center"
                                            >
                                                <option v-for="m in minutes" :key="m" :value="m">{{ m }}</option>
                                            </select>
                                        </div>
                                    </div>
                                    <p v-if="form.end_date" class="mt-1 text-xs text-indigo-600 font-medium">
                                        {{ formatDate(form.end_date) }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Pricing Summary -->
                        <div v-if="durationDays > 0" class="bg-indigo-50 rounded-lg p-4">
                            <h3 class="text-lg font-medium text-indigo-900 mb-2">Récapitulatif</h3>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-indigo-700">Durée</span>
                                    <span class="font-medium text-indigo-900">{{ durationDays }} jour(s)</span>
                                </div>
                            </div>
                        </div>

                        <!-- Optional Fields -->
                        <div>
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Informations supplémentaires</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Lieu de prise en charge</label>
                                    <input 
                                        v-model="form.pickup_location"
                                        type="text"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        placeholder="Aéroport, agence, etc."
                                    >
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700">Lieu de retour</label>
                                    <input 
                                        v-model="form.return_location"
                                        type="text"
                                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        placeholder="Aéroport, agence, etc."
                                    >
                                </div>
                            </div>
                            <div class="mt-4">
                                <label class="block text-sm font-medium text-gray-700">Notes</label>
                                <textarea 
                                    v-model="form.notes"
                                    rows="3"
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="Informations complémentaires..."
                                ></textarea>
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button 
                                type="button"
                                @click="closeModal"
                                class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button 
                                type="submit"
                                :disabled="loading || durationDays <= 0"
                                class="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span v-if="loading">Envoi en cours...</span>
                                <span v-else>Confirmer la réservation</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </Teleport>
</template>

