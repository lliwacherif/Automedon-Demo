<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import { type Car } from '@/composables/useCars';
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
    isSameDay,
    compareAsc,
    startOfDay,
    endOfDay
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, ChevronLeft, ChevronRight, Check, AlertCircle, Calendar as CalendarIcon, Clock } from 'lucide-vue-next';
import { formatDateTime } from '@/utils/date';

const props = defineProps<{
    show: boolean;
    car: Car | null;
}>();

const emit = defineEmits(['close']);

const currentMonth = ref(new Date());
const reservations = ref<any[]>([]);
const loading = ref(false);

// Fetch reservations when car changes or modal opens
watch(() => [props.show, props.car], async ([isShow, newCar]) => {
    if (isShow && newCar) {
        await fetchReservations((newCar as Car).id);
    }
}, { immediate: true });

async function fetchReservations(carId: number) {
    loading.value = true;
    try {
        const { data, error } = await supabase
            .from('reservations')
            .select('start_date, end_date, status')
            .eq('car_id', carId)
            .in('status', ['confirmed', 'active']);

        if (error) throw error;
        
        // Filter out past reservations (those that ended before today)
        const today = startOfDay(new Date());
        reservations.value = (data || []).filter(res => {
            const endDate = endOfDay(parseISO(res.end_date));
            return compareAsc(endDate, today) >= 0;
        });
    } catch (e) {
        console.error('Error fetching reservations:', e);
    } finally {
        loading.value = false;
    }
}

const calendarDays = computed(() => {
    // Start of the month
    const monthStart = startOfMonth(currentMonth.value);
    // End of the month
    const monthEnd = endOfMonth(currentMonth.value);
    
    // Start of the week for the first day of month (Monday start)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // 1 = Monday
    // End of the week for the last day of month
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: startDate, end: endDate });
});

function isDateReserved(date: Date) {
    return reservations.value.some(res => {
        const startDate = startOfDay(parseISO(res.start_date));
        const endDate = endOfDay(parseISO(res.end_date));
        return isWithinInterval(date, { start: startDate, end: endDate });
    });
}

const activeReservation = computed(() => {
    const today = new Date();
    return reservations.value.find(res => {
        const startDate = startOfDay(parseISO(res.start_date));
        const endDate = endOfDay(parseISO(res.end_date));
        return isWithinInterval(today, { start: startDate, end: endDate });
    });
});

const futureReservations = computed(() => {
    const today = startOfDay(new Date());
    // Filter for reservations starting today or later
    const future = reservations.value.filter(res => {
        const startDate = startOfDay(parseISO(res.start_date));
        return compareAsc(startDate, today) >= 0; // startDate >= today
    });
    // Sort by date ascending
    return future.sort((a, b) => compareAsc(parseISO(a.start_date), parseISO(b.start_date)));
});

function nextMonth() {
    currentMonth.value = addMonths(currentMonth.value, 1);
}

function prevMonth() {
    currentMonth.value = subMonths(currentMonth.value, 1);
}

function close() {
    emit('close');
}

const isAvailableToday = computed(() => {
    return !activeReservation.value;
});

// Short weekday names for mobile
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
                <div class="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" @click="close"></div>

                <!-- Modal Content - Full screen on mobile, centered card on desktop -->
                <div class="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 
                            w-full h-full sm:w-[95vw] sm:max-w-[900px] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl
                            bg-white shadow-2xl overflow-hidden flex flex-col">
                    
                    <!-- Header - Sticky on mobile -->
                    <div class="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-white/95 backdrop-blur-sm">
                        <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div class="p-1.5 sm:p-2 bg-indigo-100 rounded-lg shrink-0">
                                <CalendarIcon class="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                            </div>
                            <div class="min-w-0">
                                <h3 class="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                                    {{ car?.brand }} {{ car?.model }}
                                </h3>
                                <p class="text-xs text-gray-500 hidden sm:block">Calendrier de disponibilité</p>
                            </div>
                        </div>
                        <button 
                            @click="close" 
                            class="p-2 -mr-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                        >
                            <X class="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
                            <span class="sr-only">Fermer</span>
                        </button>
                    </div>

                    <!-- Scrollable Content -->
                    <div class="flex-1 overflow-y-auto overscroll-contain">
                        <div class="p-4 sm:p-6">
                            <!-- Status Banner - Mobile optimized -->
                            <div 
                                class="flex items-center gap-3 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 transition-all"
                                :class="isAvailableToday 
                                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
                                    : 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'"
                            >
                                <div 
                                    class="p-2 sm:p-2.5 rounded-full shrink-0"
                                    :class="isAvailableToday ? 'bg-green-100' : 'bg-red-100'"
                                >
                                    <Check v-if="isAvailableToday" class="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                    <AlertCircle v-else class="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p 
                                        class="font-semibold text-sm sm:text-base"
                                        :class="isAvailableToday ? 'text-green-700' : 'text-red-700'"
                                    >
                                        {{ isAvailableToday ? '✓ Disponible aujourd\'hui' : '✗ Actuellement Loué' }}
                                    </p>
                                    <p v-if="!isAvailableToday && activeReservation" class="text-xs sm:text-sm text-red-600/80 mt-0.5">
                                        Jusqu'au {{ formatDateTime(activeReservation.end_date) }}
                                    </p>
                                </div>
                            </div>

                            <!-- Main Grid - Stacked on mobile, side by side on desktop -->
                            <div class="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
                                
                                <!-- CALENDAR SECTION -->
                                <div class="flex-1 min-w-0">
                                    <div class="bg-gray-50/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100">
                                        
                                        <!-- Month Navigation -->
                                        <div class="flex items-center justify-between mb-3 sm:mb-4">
                                            <button 
                                                @click="prevMonth" 
                                                class="p-2 sm:p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation shadow-sm"
                                            >
                                                <ChevronLeft class="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                                            </button>
                                            <div class="text-base sm:text-lg font-semibold text-gray-800 capitalize">
                                                {{ format(currentMonth, 'MMMM yyyy', { locale: fr }) }}
                                            </div>
                                            <button 
                                                @click="nextMonth" 
                                                class="p-2 sm:p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation shadow-sm"
                                            >
                                                <ChevronRight class="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                                            </button>
                                        </div>

                                        <!-- Calendar Grid -->
                                        <div class="select-none">
                                            <!-- Weekday Headers -->
                                            <div class="grid grid-cols-7 gap-1 mb-2">
                                                <div 
                                                    v-for="(day, index) in weekdaysDesktop" 
                                                    :key="day" 
                                                    class="text-center py-2 text-xs sm:text-sm font-medium text-gray-500"
                                                >
                                                    <span class="sm:hidden">{{ weekdaysMobile[index] }}</span>
                                                    <span class="hidden sm:inline">{{ day }}</span>
                                                </div>
                                            </div>
                                            
                                            <!-- Days Grid -->
                                            <div class="grid grid-cols-7 gap-1">
                                                <div 
                                                    v-for="date in calendarDays" 
                                                    :key="date.toISOString()" 
                                                    class="relative aspect-square"
                                                >
                                                    <div
                                                        class="absolute inset-0.5 sm:inset-1 flex flex-col items-center justify-center rounded-lg sm:rounded-xl transition-all duration-150"
                                                        :class="[
                                                            // Current month vs other months
                                                            isSameMonth(date, currentMonth) 
                                                                ? '' 
                                                                : 'opacity-25',
                                                            
                                                            // Today highlight
                                                            isToday(date) && isSameMonth(date, currentMonth)
                                                                ? 'ring-2 ring-indigo-400 ring-offset-1' 
                                                                : '',
                                                            
                                                            // Reserved (Red) vs Available (Green)
                                                            isSameMonth(date, currentMonth) && isDateReserved(date)
                                                                ? 'bg-red-100 text-red-700' 
                                                                : isSameMonth(date, currentMonth) 
                                                                    ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                                                                    : 'bg-gray-100 text-gray-400'
                                                        ]"
                                                    >
                                                        <time 
                                                            :datetime="format(date, 'yyyy-MM-dd')"
                                                            class="text-xs sm:text-sm font-medium"
                                                        >
                                                            {{ format(date, 'd') }}
                                                        </time>
                                                        
                                                        <!-- Status dot indicator -->
                                                        <div 
                                                            v-if="isSameMonth(date, currentMonth)"
                                                            class="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full mt-0.5"
                                                            :class="isDateReserved(date) ? 'bg-red-500' : 'bg-green-500'"
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Legend -->
                                        <div class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 flex items-center justify-center gap-4 sm:gap-6">
                                            <div class="flex items-center gap-1.5 sm:gap-2">
                                                <span class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></span>
                                                <span class="text-xs sm:text-sm text-gray-600">Disponible</span>
                                            </div>
                                            <div class="flex items-center gap-1.5 sm:gap-2">
                                                <span class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></span>
                                                <span class="text-xs sm:text-sm text-gray-600">Réservé</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- RESERVATIONS SECTION -->
                                <div class="lg:w-80 shrink-0">
                                    <div class="bg-gray-50/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 h-full">
                                        <div class="flex items-center justify-between mb-3 sm:mb-4">
                                            <h4 class="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
                                                <Clock class="w-4 h-4 text-indigo-500" />
                                                Réservations à venir
                                            </h4>
                                            <span class="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                                                {{ futureReservations.length }}
                                            </span>
                                        </div>
                                        
                                        <!-- Empty State -->
                                        <div 
                                            v-if="futureReservations.length === 0" 
                                            class="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
                                        >
                                            <div class="p-3 sm:p-4 bg-gray-100 rounded-full mb-3">
                                                <CalendarIcon class="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                                            </div>
                                            <p class="text-sm text-gray-500">Aucune réservation</p>
                                            <p class="text-xs text-gray-400 mt-1">Ce véhicule est libre</p>
                                        </div>

                                        <!-- Reservation Cards -->
                                        <div v-else class="space-y-2 sm:space-y-3 max-h-[200px] lg:max-h-[300px] overflow-y-auto overscroll-contain pr-1 custom-scrollbar">
                                            <div 
                                                v-for="res in futureReservations" 
                                                :key="res.id"
                                                class="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm"
                                            >
                                                <div class="flex items-start gap-2 sm:gap-3">
                                                    <div class="p-1.5 sm:p-2 bg-indigo-50 rounded-lg shrink-0">
                                                        <CalendarIcon class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                                                    </div>
                                                    <div class="flex-1 min-w-0 space-y-1.5">
                                                        <div class="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
                                                            <span class="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></span>
                                                            <span class="truncate">{{ formatDateTime(res.start_date) }}</span>
                                                        </div>
                                                        <div class="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
                                                            <span class="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                                                            <span class="truncate">{{ formatDateTime(res.end_date) }}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer - Sticky on mobile -->
                    <div class="sticky bottom-0 bg-white/95 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 border-t flex justify-end gap-3 safe-bottom">
                        <button 
                            @click="close"
                            class="flex-1 sm:flex-none px-6 py-2.5 sm:py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 active:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors touch-manipulation"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
/* Custom scrollbar for reservation list */
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    border-radius: 20px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #9ca3af;
}

/* Safe area padding for notched phones */
.safe-bottom {
    padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
}

/* Smooth touch scrolling */
.overscroll-contain {
    -webkit-overflow-scrolling: touch;
}

/* Better touch targets */
.touch-manipulation {
    touch-action: manipulation;
}

/* Prevent text selection on calendar */
.select-none {
    -webkit-user-select: none;
    user-select: none;
}
</style>
