<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';
import { 
    format, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameMonth, 
    isToday, 
    isWithinInterval,
    parseISO,
    startOfDay,
    endOfDay,
    addDays,
    isBefore
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, AlertCircle } from 'lucide-vue-next';

// Props & Emits
const props = defineProps<{
    show: boolean;
}>();

const emit = defineEmits(['close']);

// State
const currentMonth = ref(new Date()); // The reference date for the large calendar
const selectedCarId = ref<number | null>(null);
const cars = ref<any[]>([]);
const reservations = ref<any[]>([]);
const loading = ref(false);

// Fetch Cars
onMounted(async () => {
    await fetchCars();
});

async function fetchCars() {
    const { data } = await supabase.from('cars').select('id, brand, model, license_plate');
    cars.value = data || [];
}

// Fetch Reservations when car changes
watch(selectedCarId, async (newId) => {
    if (newId) {
        await fetchReservations(newId);
    } else {
        reservations.value = [];
    }
});

watch(() => props.show, (val) => {
    if (val && !selectedCarId.value && cars.value.length > 0) {
        // Optionally auto-select first car or leave empty
    }
});

async function fetchReservations(carId: number) {
    loading.value = true;
    try {
        const { data, error } = await supabase
            .from('reservations')
            .select('start_date, end_date, status')
            .eq('car_id', carId)
            .in('status', ['confirmed', 'active']);

        if (error) throw error;
        reservations.value = data || [];
    } catch (e) {
        console.error('Error fetching reservations:', e);
    } finally {
        loading.value = false;
    }
}

// Helpers
function getDaysForMonth(date: Date) {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
}

// Large Calendar (Left)
const largeCalendarDays = computed(() => getDaysForMonth(currentMonth.value));

// Small Calendars (Right)
// Let's show the next 4 months
const smallMonths = computed(() => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
        months.push(addMonths(currentMonth.value, i));
    }
    return months;
});

function isReserved(date: Date) {
    if (!selectedCarId.value) return false;
    // Check if date is in the past
    // if (isBefore(date, startOfDay(new Date()))) return false; // Optional: Treat past as not reserved or ignored?
    // User wants red for reserved, green for available.
    
    return reservations.value.some(res => {
        const start = startOfDay(parseISO(res.start_date));
        const end = endOfDay(parseISO(res.end_date));
        return isWithinInterval(date, { start, end });
    });
}

// Navigation
function prevMonth() {
    currentMonth.value = subMonths(currentMonth.value, 1);
}

function nextMonth() {
    currentMonth.value = addMonths(currentMonth.value, 1);
}

function close() {
    emit('close');
}

// Mobile weekday abbreviations
const weekdaysMobile = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const weekdaysDesktop = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition-opacity duration-200 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="show" class="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
                <!-- Backdrop -->
                <div class="fixed inset-0 bg-black/60 transition-opacity backdrop-blur-sm" aria-hidden="true" @click="close"></div>

                <!-- Modal Content - Full screen on mobile, large card on desktop -->
                <div class="fixed inset-0 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 
                            w-full h-full lg:w-[95vw] lg:max-w-[1200px] lg:h-[90vh] lg:rounded-xl
                            bg-white shadow-2xl overflow-hidden flex flex-col">
                    
                    <!-- Header: Title & Car Selector -->
                    <div class="sticky top-0 z-20 flex flex-col gap-3 px-4 py-3 lg:px-6 lg:py-4 border-b border-gray-100 bg-white">
                        <!-- Title Row -->
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2 lg:gap-3">
                                <div class="p-1.5 lg:p-2 bg-indigo-50 rounded-lg">
                                    <CalendarIcon class="w-5 h-5 lg:w-6 lg:h-6 text-indigo-600" />
                                </div>
                                <h2 class="text-base lg:text-xl font-bold text-gray-900">Calendrier Global des Disponibilités</h2>
                            </div>
                            <button @click="close" class="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                                <X class="w-5 h-5 lg:w-6 lg:h-6" />
                            </button>
                        </div>
                        
                        <!-- Car Selector -->
                        <div class="w-full">
                            <select 
                                v-model="selectedCarId"
                                class="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block"
                            >
                                <option :value="null">Sélectionner une voiture...</option>
                                <option v-for="car in cars" :key="car.id" :value="car.id">
                                    {{ car.brand }} {{ car.model }} - {{ car.license_plate }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <!-- MOBILE LAYOUT: Single scrollable column -->
                    <div class="flex-1 overflow-y-auto lg:hidden">
                        <!-- Current Month Section - Mobile -->
                        <div class="p-4 bg-white border-b border-gray-200">
                            <!-- Month Navigation -->
                            <div class="flex items-center justify-between mb-4">
                                <button @click="prevMonth" class="p-2 hover:bg-gray-100 rounded-lg transition-colors active:bg-gray-200">
                                    <ChevronLeft class="w-5 h-5 text-gray-600" />
                                </button>
                                <h3 class="text-lg font-bold text-gray-900 capitalize">
                                    {{ format(currentMonth, 'MMMM yyyy', { locale: fr }) }}
                                </h3>
                                <button @click="nextMonth" class="p-2 hover:bg-gray-100 rounded-lg transition-colors active:bg-gray-200">
                                    <ChevronRight class="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            <!-- Calendar Grid - Mobile Optimized -->
                            <div class="select-none">
                                <!-- Weekdays -->
                                <div class="grid grid-cols-7 mb-2">
                                    <div v-for="day in weekdaysMobile" :key="day" 
                                        class="text-center text-xs font-semibold text-gray-500 py-2">
                                        {{ day }}
                                    </div>
                                </div>
                                
                                <!-- Days Grid -->
                                <div class="grid grid-cols-7 gap-1">
                                    <div 
                                        v-for="date in largeCalendarDays" 
                                        :key="date.toISOString()" 
                                        class="aspect-square relative"
                                    >
                                        <div
                                            class="absolute inset-0.5 flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-all"
                                            :class="[
                                                !isSameMonth(date, currentMonth) ? 'text-gray-300' : '',
                                                isToday(date) && isSameMonth(date, currentMonth) ? 'ring-2 ring-indigo-500' : '',
                                                selectedCarId && isSameMonth(date, currentMonth) ? (
                                                    isReserved(date) 
                                                        ? 'bg-red-100 text-red-700' 
                                                        : 'bg-green-50 text-green-700'
                                                ) : ''
                                            ]"
                                        >
                                            <span>{{ format(date, 'd') }}</span>
                                            <!-- Status dot -->
                                            <div 
                                                v-if="selectedCarId && isSameMonth(date, currentMonth)"
                                                class="w-1 h-1 rounded-full mt-0.5"
                                                :class="isReserved(date) ? 'bg-red-500' : 'bg-green-500'"
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Legend - Mobile -->
                            <div v-if="selectedCarId" class="mt-4 pt-3 border-t border-gray-200 flex justify-center gap-6">
                                <div class="flex items-center gap-2">
                                    <span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                                    <span class="text-xs text-gray-600">Disponible</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                                    <span class="text-xs text-gray-600">Réservé</span>
                                </div>
                            </div>
                        </div>

                        <!-- Future Months Section - Mobile -->
                        <div class="p-4 bg-gray-50">
                            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                                Mois Suivants (Prochains 12 mois)
                            </h3>
                            
                            <div class="grid grid-cols-2 gap-3">
                                <div 
                                    v-for="monthDate in smallMonths" 
                                    :key="monthDate.toISOString()" 
                                    class="bg-white rounded-xl p-3 shadow-sm border border-gray-100"
                                >
                                    <h4 class="text-sm font-bold text-gray-900 capitalize mb-2 text-center">
                                        {{ format(monthDate, 'MMMM', { locale: fr }) }}
                                    </h4>
                                    
                                    <!-- Small Weekdays -->
                                    <div class="grid grid-cols-7 gap-0.5 mb-1">
                                        <div v-for="day in ['L', 'M', 'M', 'J', 'V', 'S', 'D']" :key="day" 
                                            class="text-center text-[9px] font-medium text-gray-400">
                                            {{ day }}
                                        </div>
                                    </div>

                                    <!-- Small Days -->
                                    <div class="grid grid-cols-7 gap-0.5">
                                        <div 
                                            v-for="date in getDaysForMonth(monthDate)" 
                                            :key="date.toISOString()" 
                                            class="aspect-square flex items-center justify-center rounded text-[9px] relative"
                                            :class="[
                                                !isSameMonth(date, monthDate) ? 'text-transparent' : 'text-gray-700'
                                            ]"
                                        >
                                            <span class="z-10 relative">{{ isSameMonth(date, monthDate) ? format(date, 'd') : '' }}</span>
                                            <div v-if="selectedCarId && isSameMonth(date, monthDate)" 
                                                class="absolute inset-0 rounded transition-colors"
                                                :class="isReserved(date) ? 'bg-red-100' : 'bg-green-50'"
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- DESKTOP LAYOUT: Side by side (hidden on mobile) -->
                    <div class="hidden lg:flex flex-1 overflow-hidden">
                        <!-- LEFT SIDE: Large Current Month -->
                        <div class="flex-1 p-6 overflow-y-auto bg-white border-r border-gray-100">
                            <div class="h-full flex flex-col">
                                <!-- Controls -->
                                <div class="flex items-center justify-between mb-6">
                                    <button @click="prevMonth" class="p-2 hover:bg-gray-100 rounded-lg transition-colors group">
                                        <ChevronLeft class="w-6 h-6 text-gray-400 group-hover:text-gray-900" />
                                    </button>
                                    <h3 class="text-2xl font-bold text-gray-900 capitalize">
                                        {{ format(currentMonth, 'MMMM yyyy', { locale: fr }) }}
                                    </h3>
                                    <button @click="nextMonth" class="p-2 hover:bg-gray-100 rounded-lg transition-colors group">
                                        <ChevronRight class="w-6 h-6 text-gray-400 group-hover:text-gray-900" />
                                    </button>
                                </div>

                                <!-- Calendar Grid -->
                                <div class="flex-1 flex flex-col">
                                    <!-- Weekdays -->
                                    <div class="grid grid-cols-7 mb-4">
                                        <div v-for="day in weekdaysDesktop" :key="day" 
                                            class="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider py-2">
                                            {{ day }}
                                        </div>
                                    </div>
                                    
                                    <!-- Days -->
                                    <div class="grid grid-cols-7 grid-rows-6 gap-2 flex-1">
                                        <div 
                                            v-for="date in largeCalendarDays" 
                                            :key="date.toISOString()" 
                                            class="relative border rounded-xl p-2 transition-all duration-200 flex flex-col justify-between"
                                            :class="[
                                                !isSameMonth(date, currentMonth) ? 'bg-gray-50/50 text-gray-300 border-transparent' : 'bg-white border-gray-100',
                                                isToday(date) ? 'ring-2 ring-indigo-500 ring-offset-2' : '',
                                                // Availability Coloring
                                                selectedCarId && isSameMonth(date, currentMonth) ? (
                                                    isReserved(date) 
                                                        ? 'bg-red-50 border-red-100' 
                                                        : 'bg-green-50 border-green-100'
                                                ) : ''
                                            ]"
                                        >
                                            <div class="flex justify-between items-start">
                                                <span class="text-lg font-medium" 
                                                    :class="[
                                                        isToday(date) ? 'text-indigo-600' : 'text-gray-700',
                                                        selectedCarId && isSameMonth(date, currentMonth) && isReserved(date) ? 'text-red-700' : '',
                                                        selectedCarId && isSameMonth(date, currentMonth) && !isReserved(date) ? 'text-green-700' : ''
                                                    ]">
                                                    {{ format(date, 'd') }}
                                                </span>
                                                <!-- Status Icon -->
                                                <div v-if="selectedCarId && isSameMonth(date, currentMonth)">
                                                    <AlertCircle v-if="isReserved(date)" class="w-4 h-4 text-red-500" />
                                                    <Check v-else class="w-4 h-4 text-green-500" />
                                                </div>
                                            </div>
                                            
                                            <!-- Label -->
                                            <div v-if="selectedCarId && isSameMonth(date, currentMonth)" class="mt-auto text-xs font-medium truncate"
                                                :class="isReserved(date) ? 'text-red-600' : 'text-green-600'">
                                                {{ isReserved(date) ? 'Loué' : 'Libre' }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- RIGHT SIDE: Smaller Upcoming Months -->
                        <div class="w-[60%] p-6 bg-gray-50 overflow-y-auto border-l border-gray-200">
                            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Mois Suivants (Prochains 12 mois)</h3>
                            
                            <div class="grid grid-cols-4 gap-4">
                                <div v-for="monthDate in smallMonths" :key="monthDate.toISOString()" class="bg-white rounded-lg p-3 shadow-sm border border-gray-100 flex flex-col items-center">
                                    <h4 class="text-sm font-bold text-gray-900 capitalize mb-2 text-center">
                                        {{ format(monthDate, 'MMMM', { locale: fr }) }}
                                    </h4>
                                    
                                    <!-- Small Weekdays -->
                                    <div class="grid grid-cols-7 gap-0.5 mb-2">
                                        <div v-for="day in ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']" :key="day" 
                                            class="text-center text-[10px] font-medium text-gray-400">
                                            {{ day }}
                                        </div>
                                    </div>

                                    <!-- Small Days -->
                                    <div class="grid grid-cols-7 gap-0.5 w-full">
                                        <div 
                                            v-for="date in getDaysForMonth(monthDate)" 
                                            :key="date.toISOString()" 
                                            class="aspect-square flex items-center justify-center rounded-full text-[10px] relative"
                                            :class="[
                                                !isSameMonth(date, monthDate) ? 'text-transparent pointer-events-none' : 'text-gray-700'
                                            ]"
                                        >
                                            <!-- Wrapper to center content -->
                                            <span class="z-10 relative">{{ isSameMonth(date, monthDate) ? format(date, 'd') : '' }}</span>

                                            <!-- Dot / Background -->
                                            <div v-if="selectedCarId && isSameMonth(date, monthDate)" 
                                                class="absolute inset-0 rounded-full transition-colors"
                                                :class="isReserved(date) ? 'bg-red-100 text-red-700 font-bold' : 'bg-green-50 text-green-700'"
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Legend Footer - Desktop only -->
                    <div class="hidden lg:flex bg-white border-t border-gray-100 px-6 py-3 justify-between items-center text-sm">
                        <div v-if="selectedCarId" class="flex gap-6">
                            <div class="flex items-center gap-2">
                                <span class="w-3 h-3 rounded-full bg-green-500"></span>
                                <span class="text-gray-600 font-medium">Disponible</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="w-3 h-3 rounded-full bg-red-500"></span>
                                <span class="text-gray-600 font-medium">Loué / Réservé</span>
                            </div>
                        </div>
                        <div v-else class="text-gray-500 italic">
                            Veuillez sélectionner un véhicule pour voir les disponibilités
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
/* Custom Scrollbar */
div::-webkit-scrollbar {
    width: 6px;
}
div::-webkit-scrollbar-track {
    background: transparent;
}
div::-webkit-scrollbar-thumb {
    background-color: #e5e7eb;
    border-radius: 20px;
}

/* Prevent text selection on calendar */
.select-none {
    -webkit-user-select: none;
    user-select: none;
}
</style>
