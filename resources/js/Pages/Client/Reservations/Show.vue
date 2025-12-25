<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useReservations, type Reservation } from '@/composables/useReservations';
import { useRoute } from 'vue-router';

const { getReservation } = useReservations();
const route = useRoute();

const reservation = ref<Reservation | null>(null);
const loading = ref(false);

onMounted(async () => {
    if (route.params.id) {
        loading.value = true;
        reservation.value = await getReservation(Number(route.params.id));
        loading.value = false;
    }
});
</script>

<template>
    <div class="p-6" v-if="reservation">
        <h1 class="text-2xl font-semibold text-gray-900 mb-6">Reservation Details</h1>

        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
            <div class="px-4 py-5 sm:px-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900">
                    {{ reservation.car?.make }} {{ reservation.car?.model }}
                </h3>
                <p class="mt-1 max-w-2xl text-sm text-gray-500">
                    Reservation #{{ reservation.reservation_number }}
                </p>
            </div>
            <div class="border-t border-gray-200">
                <dl>
                    <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt class="text-sm font-medium text-gray-500">Status</dt>
                        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ reservation.status }}</dd>
                    </div>
                    <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt class="text-sm font-medium text-gray-500">Dates</dt>
                        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ reservation.start_date }} to {{ reservation.end_date }}</dd>
                    </div>
                    <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt class="text-sm font-medium text-gray-500">Total Amount</dt>
                        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">${{ reservation.total_amount }}</dd>
                    </div>
                    <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt class="text-sm font-medium text-gray-500">Pickup Location</dt>
                        <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ reservation.pickup_location || 'N/A' }}</dd>
                    </div>
                </dl>
            </div>
        </div>
    </div>
</template>
