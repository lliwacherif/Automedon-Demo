<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useReservations, type Reservation } from '@/composables/useReservations';
import { useReservationDocuments } from '@/composables/useReservationDocuments';
import { useCars } from '@/composables/useCars';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { getReservation, createReservation, updateReservation, checkAvailability } = useReservations();
const { documents, loading: docsLoading, fetchDocuments, uploadDocument, deleteDocument } = useReservationDocuments();
const { cars, fetchCars, updateCar, fetchCarById } = useCars();
const route = useRoute();
const router = useRouter();

const isEditMode = computed(() => !!route.params.id && route.params.id !== 'new');
const loading = ref(false);
const initialLoading = ref(true);
const previewFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const showPreview = ref(false);
const reservation = ref<Partial<Reservation>>({
    client_name: '',
    client_cin: '',
    client_phone: '',
    client_email: '',
    start_date: '',
    end_date: '',
    duration_days: 0,
    price_per_day: 0,
    total_price: 0,
    advance_payment: 0,
    car_id: 0,
    status: 'confirmed',
    pickup_location: '',
    return_location: '',
    notes: '',
});

// Helper function to format ISO date to datetime-local format
function formatDateForInput(isoDate: string): string {
    if (!isoDate) return '';
    try {
        const date = new Date(isoDate);
        // Format: YYYY-MM-DDTHH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
        return '';
    }
}

// Fetch cars and reservation data
onMounted(async () => {
    await fetchCars();
    
    if (isEditMode.value) {
        const data = await getReservation(Number(route.params.id));
        if (data) {
            // Format dates for datetime-local input
            reservation.value = {
                ...data,
                start_date: formatDateForInput(data.start_date),
                end_date: formatDateForInput(data.end_date),
            };
            // Fetch documents
            await fetchDocuments(Number(route.params.id));
        }
    }
    
    initialLoading.value = false;
});

// Auto-calculate duration when dates change (skip during initial load)
watch([() => reservation.value.start_date, () => reservation.value.end_date], () => {
    if (initialLoading.value) return;
    
    if (reservation.value.start_date && reservation.value.end_date) {
        const start = new Date(reservation.value.start_date);
        const end = new Date(reservation.value.end_date);
        const diff = end.getTime() - start.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        reservation.value.duration_days = days > 0 ? days : 0;
        calculateTotal();
    }
});

// Auto-calculate total when price per day or duration changes (skip during initial load)
watch([() => reservation.value.price_per_day, () => reservation.value.duration_days], () => {
    if (initialLoading.value) return;
    calculateTotal();
});

function calculateTotal() {
    const days = reservation.value.duration_days || 0;
    const pricePerDay = reservation.value.price_per_day || 0;
    reservation.value.total_price = days * pricePerDay;
}

const restToPay = computed(() => {
    const total = reservation.value.total_price || 0;
    const advance = reservation.value.advance_payment || 0;
    return Math.max(0, total - advance);
});

async function handleSubmit() {
    loading.value = true;
    try {
        // Validation
        if (!reservation.value.client_name || !reservation.value.client_cin || 
            !reservation.value.client_phone || !reservation.value.car_id ||
            !reservation.value.start_date || !reservation.value.end_date) {
            alert(t('admin.reservations.validation_error'));
            loading.value = false;
            return;
        }

        if ((reservation.value.duration_days || 0) <= 0) {
            alert(t('admin.reservations.invalid_dates'));
            loading.value = false;
            return;
        }

        const data = {
            client_name: reservation.value.client_name!,
            client_cin: reservation.value.client_cin!,
            client_phone: reservation.value.client_phone!,
            client_email: reservation.value.client_email || null,
            car_id: reservation.value.car_id!,
            start_date: new Date(reservation.value.start_date!).toISOString(),
            end_date: new Date(reservation.value.end_date!).toISOString(),
            duration_days: reservation.value.duration_days!,
            price_per_day: reservation.value.price_per_day!,
            total_price: reservation.value.total_price!,
            advance_payment: reservation.value.advance_payment || 0,
            status: reservation.value.status || 'confirmed',
            pickup_location: reservation.value.pickup_location || null,
            return_location: reservation.value.return_location || null,
            notes: reservation.value.notes || null,
        };

        // Check availability
        const isAvailable = await checkAvailability(
            reservation.value.car_id!,
            data.start_date, // Use the UTC converted date
            data.end_date,   // Use the UTC converted date
            isEditMode.value ? Number(route.params.id) : undefined
        );

        if (!isAvailable) {
            alert(t('admin.reservations.error_dates_conflict') || 'These dates conflict with another confirmed or active reservation.');
            loading.value = false;
            return;
        }

        // Validate 'Active' status - can only be set if start_date is today or in the past
        if (reservation.value.status === 'active') {
            const startDate = new Date(reservation.value.start_date!);
            const now = new Date();
            // Reset hours to ignore time for simple date comparison if needed, 
            // but strict comparison is safer. Let's start with strict timestamp comparison.
            // Actually user said: "only in that future day can make it active"
            // So we check if start_date > now.
            
            if (startDate > now) {
                alert('⚠️ Impossible de mettre le statut sur "Actif" pour une réservation future. Veuillez utiliser "Confirmé".');
                loading.value = false;
                return;
            }
        }

        if (isEditMode.value) {
            await updateReservation(Number(route.params.id), data);
            
            // Update car status based on reservation status
            const carId = reservation.value.car_id || reservation.value.car?.id;
            if (carId && carId > 0) {
                // Check if we're trying to activate this reservation
                if (data.status === 'active') {
                   // Force car status to 'loue'
                    await updateCar(carId, { status: 'loue' });
                    // alert(`✅ Réservation activée.`);
                } else if (data.status === 'completed' || data.status === 'cancelled') {
                    // When reservation is completed or cancelled, car becomes available
                    // BUT only if there isn't another active reservation right now? 
                    // For simplicity, we set it to available. The next active reservation will set it to rented.
                    await updateCar(carId, { status: 'disponible' });
                }
            }
        } else {
             // NO longer checking if selectedCar.status === 'loue' to block.
             
            await createReservation(data);
            const carId = reservation.value.car_id || reservation.value.car?.id;
            if (carId && carId > 0 && data.status === 'active') {
                await updateCar(carId, { status: 'loue' });
            } else {
                alert(t('admin.reservations.saved_success'));
            }
        }

        router.push('/admin/reservations');
    } catch (error: any) {
        alert(t('admin.reservations.save_error') + ': ' + error.message);
    } finally {
        loading.value = false;
    }
}

// Filter available cars
const availableCars = computed(() => cars.value || []);

async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        previewFile.value = file;
        
        // Create preview URL for images
        if (file.type.startsWith('image/')) {
            previewUrl.value = URL.createObjectURL(file);
        } else {
            previewUrl.value = null;
        }
        
        showPreview.value = true;
        // Clear input
        input.value = '';
    }
}

async function confirmUpload() {
    if (previewFile.value && isEditMode.value && route.params.id) {
        try {
            await uploadDocument(Number(route.params.id), previewFile.value);
            cancelPreview();
        } catch (e) {
            alert(t('admin.reservations.upload_error'));
        }
    }
}

function cancelPreview() {
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
    }
    previewFile.value = null;
    previewUrl.value = null;
    showPreview.value = false;
}

import { formatDateTime } from '@/utils/date';
import DateTimeInput from '@/components/DateTimeInput.vue';
</script>

<template>
    <div class="max-w-4xl mx-auto p-6">
        <div class="mb-6">
            <h1 class="text-2xl font-semibold text-gray-900">
                {{ isEditMode ? t('admin.reservations.edit_title') : t('admin.reservations.new_title') }}
            </h1>
            <p v-if="isEditMode && reservation.reservation_number" class="text-sm text-gray-500 mt-1">
                {{ reservation.reservation_number }}
            </p>
        </div>

        <!-- Loading State -->
        <div v-if="initialLoading" class="bg-white shadow-md rounded-lg p-6 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-4 text-gray-500">{{ t('common.loading') }}...</p>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="bg-white shadow-md rounded-lg p-6 space-y-6">
            <!-- Client Information -->
            <div class="border-b pb-4">
                <h2 class="text-lg font-medium text-gray-900 mb-4">{{ t('admin.reservations.client_info') }}</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            {{ t('admin.reservations.client_name') }} *
                        </label>
                        <input 
                            v-model="reservation.client_name"
                            type="text"
                            required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            {{ t('admin.reservations.client_cin') }} *
                        </label>
                        <input 
                            v-model="reservation.client_cin"
                            type="text"
                            required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            {{ t('admin.reservations.client_phone') }} *
                        </label>
                        <input 
                            v-model="reservation.client_phone"
                            type="tel"
                            required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            {{ t('admin.reservations.client_email') }}
                        </label>
                        <input 
                            v-model="reservation.client_email"
                            type="email"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                    </div>
                </div>
            </div>

            <!-- Reservation Details -->
            <div class="border-b pb-4">
                <h2 class="text-lg font-medium text-gray-900 mb-4">{{ t('admin.reservations.reservation_details') }}</h2>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ t('admin.reservations.select_car') }} *
                    </label>
                    <select 
                        v-model="reservation.car_id"
                        required
                        :disabled="isEditMode"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option :value="0">{{ t('admin.reservations.choose_car') }}</option>
                        <option v-for="car in availableCars" :key="car.id" :value="car.id">
                            {{ car.brand }} {{ car.model }} - {{ car.plate_number }}
                        </option>
                    </select>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            {{ t('admin.reservations.start_date') }} *
                        </label>
                        <DateTimeInput 
                            v-model="reservation.start_date"
                            :required="true"
                        />
                        <p v-if="reservation.start_date" class="mt-1 text-xs text-indigo-600 font-medium">
                            {{ formatDateTime(reservation.start_date) }}
                        </p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            {{ t('admin.reservations.end_date') }} *
                        </label>
                        <DateTimeInput 
                            v-model="reservation.end_date"
                            :required="true"
                        />
                        <p v-if="reservation.end_date" class="mt-1 text-xs text-indigo-600 font-medium">
                            {{ formatDateTime(reservation.end_date) }}
                        </p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            {{ t('admin.reservations.duration') }}
                        </label>
                        <input 
                            v-model="reservation.duration_days"
                            type="number"
                            readonly
                            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        >
                        <p class="text-xs text-gray-500 mt-1">{{ t('admin.reservations.auto_calculated') }}</p>
                    </div>
                </div>
            </div>

            <!-- Pricing -->
            <div class="border-b pb-4">
                <h2 class="text-lg font-medium text-gray-900 mb-4">{{ t('admin.reservations.pricing') }}</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            {{ t('admin.reservations.price_per_day') }} * (€)
                        </label>
                        <input 
                            v-model.number="reservation.price_per_day"
                            type="number"
                            step="0.01"
                            required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            {{ t('admin.reservations.total_price') }} (€)
                        </label>
                        <input 
                            v-model="reservation.total_price"
                            type="number"
                            step="0.01"
                            readonly
                            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-lg font-semibold"
                        >
                        <p class="text-xs text-gray-500 mt-1">{{ t('admin.reservations.auto_calculated') }}</p>
                    </div>
                </div>

                <!-- Payment Section -->
                <div class="mt-4 pt-4 border-t border-gray-100">
                    <h3 class="text-sm font-medium text-gray-900 mb-4">{{ t('admin.reservations.payment_details') || 'Paiement' }}</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-indigo-50 p-3 rounded-md border border-indigo-100">
                            <label class="block text-sm font-medium text-indigo-900 mb-1">
                                Acompte / Avance (€)
                            </label>
                            <input 
                                v-model.number="reservation.advance_payment"
                                type="number"
                                step="0.01"
                                class="w-full px-3 py-2 border border-indigo-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                placeholder="0.00"
                            >
                        </div>

                        <div 
                            class="p-3 rounded-md border"
                            :class="restToPay > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'"
                        >
                            <label 
                                class="block text-sm font-bold mb-1"
                                :class="restToPay > 0 ? 'text-red-800' : 'text-green-800'"
                            >
                                Reste à Payer (€)
                            </label>
                            <div class="text-2xl font-bold" :class="restToPay > 0 ? 'text-red-600' : 'text-green-600'">
                                {{ restToPay.toFixed(2) }} €
                            </div>
                            <p v-if="restToPay === 0" class="text-xs text-green-700 mt-1 font-medium">✅ Payé en totalité</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Status (only in edit mode) -->
            <div v-if="isEditMode" class="border-b pb-4">
                <h2 class="text-lg font-medium text-gray-900 mb-4">{{ t('common.status') }}</h2>
                <div class="max-w-xs">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ t('admin.reservations.status_filter') }}
                    </label>
                    <select 
                        v-model="reservation.status"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="pending">{{ t('admin.reservations.status_pending') }}</option>
                        <option value="confirmed">{{ t('admin.reservations.status_confirmed') }}</option>
                        <option value="active">{{ t('admin.reservations.status_active') }}</option>
                        <option value="completed">{{ t('admin.reservations.status_completed') }}</option>
                        <option value="cancelled">{{ t('admin.reservations.status_cancelled') }}</option>
                    </select>
                    
                    <!-- Status indicator -->
                    <div class="mt-3 flex items-center space-x-2">
                        <span class="text-sm text-gray-500">Statut actuel:</span>
                        <span 
                            :class="{
                                'bg-yellow-100 text-yellow-800': reservation.status === 'pending',
                                'bg-blue-100 text-blue-800': reservation.status === 'confirmed',
                                'bg-green-100 text-green-800': reservation.status === 'active',
                                'bg-gray-100 text-gray-800': reservation.status === 'completed',
                                'bg-red-100 text-red-800': reservation.status === 'cancelled'
                            }"
                            class="px-3 py-1 text-sm font-semibold rounded-full capitalize"
                        >
                            {{ reservation.status }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Documents & Contracts (Only in Edit Mode) -->
            <div v-if="isEditMode" class="border-b pb-4">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Documents & Contrats</h2>
                
                <!-- Upload Section -->
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Capturer / Téléverser Contrat
                    </label>
                    <div class="flex items-center space-x-4">
                        <input 
                            type="file" 
                            accept="image/*,application/pdf"
                            capture="environment"
                            @change="handleFileUpload"
                            class="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100"
                        />
                        <div v-if="docsLoading" class="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    </div>
                </div>

                <!-- Documents List -->
                <div v-if="documents.length > 0" class="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-100">
                            <tr>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fichier
                                </th>
                                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date d'ajout
                                </th>
                                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-for="doc in documents" :key="doc.id">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                        <div class="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-indigo-100 rounded-lg text-indigo-600">
                                            <!-- PDF Icon -->
                                            <svg v-if="doc.file_name.toLowerCase().endsWith('.pdf')" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <!-- Image Icon -->
                                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div class="ml-4">
                                            <div class="text-sm font-medium text-gray-900">{{ doc.file_name }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {{ formatDateTime(doc.uploaded_at) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                    <a :href="doc.file_url" target="_blank" class="text-indigo-600 hover:text-indigo-900">
                                        Voir
                                    </a>
                                    <button @click="deleteDocument(doc.id, doc.file_url)" class="text-red-600 hover:text-red-900">
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="text-sm text-gray-500 italic">
                    Aucun document téléversé.
                </div>
            </div>

            <!-- Optional Fields -->
            <div>
                <h2 class="text-lg font-medium text-gray-900 mb-4">{{ t('admin.reservations.optional') }}</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            {{ t('admin.reservations.pickup_location') }}
                        </label>
                        <input 
                            v-model="reservation.pickup_location"
                            type="text"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            {{ t('admin.reservations.return_location') }}
                        </label>
                        <input 
                            v-model="reservation.return_location"
                            type="text"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ t('admin.reservations.notes') }}
                    </label>
                    <textarea 
                        v-model="reservation.notes"
                        rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    ></textarea>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 pt-4">
                <button 
                    type="button"
                    @click="router.push('/admin/reservations')"
                    class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                    {{ t('common.cancel') }}
                </button>
                <button 
                    type="submit"
                    :disabled="loading"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                    {{ loading ? t('common.saving') : t('common.save') }}
                </button>
            </div>
        </form>

        <!-- Preview Modal -->
        <div v-if="showPreview" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Aperçu du document</h3>
                    
                    <!-- Image Preview -->
                    <div v-if="previewUrl" class="mb-4 border rounded-lg overflow-hidden">
                        <img :src="previewUrl" alt="Preview" class="w-full h-auto" />
                    </div>
                    
                    <!-- PDF or other file info -->
                    <div v-else class="mb-4 p-6 bg-gray-50 rounded-lg text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-indigo-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p class="text-sm font-medium text-gray-900">{{ previewFile?.name }}</p>
                        <p class="text-xs text-gray-500 mt-1">{{ ((previewFile?.size || 0) / 1024 / 1024).toFixed(2) }} MB</p>
                    </div>
                    
                    <div class="flex justify-end space-x-3">
                        <button 
                            @click="cancelPreview"
                            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Annuler
                        </button>
                        <button 
                            @click="confirmUpload"
                            :disabled="docsLoading"
                            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {{ docsLoading ? 'Téléversement...' : 'Confirmer' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
