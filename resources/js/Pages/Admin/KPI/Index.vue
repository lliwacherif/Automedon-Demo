<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useKPI } from '@/composables/useKPI';
import Chart from 'chart.js/auto';
import { format } from 'date-fns';
import { 
    TrendingUp, 
    Wallet, 
    Calendar, 
    Car, 
    ArrowUpRight, 
    ArrowDownRight 
} from 'lucide-vue-next';

const { 
    loading, 
    error, 
    metrics, 
    fleetStatus, 
    revenueChartData, 
    statusChartData, 
    dateRange, 
    periodType, 
    setPeriod, 
    fetchData 
} = useKPI();

const revenueChartCanvas = ref<HTMLCanvasElement | null>(null);
const statusChartCanvas = ref<HTMLCanvasElement | null>(null);
let revenueChartInstance: Chart | null = null;
let statusChartInstance: Chart | null = null;

onMounted(async () => {
    await fetchData();
    renderCharts();
});

watch([revenueChartData, statusChartData], () => {
    renderCharts();
});

function renderCharts() {
    if (revenueChartCanvas.value) {
        if (revenueChartInstance) revenueChartInstance.destroy();
        revenueChartInstance = new Chart(revenueChartCanvas.value, {
            type: 'line',
            data: revenueChartData.value,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    if (statusChartCanvas.value) {
        if (statusChartInstance) statusChartInstance.destroy();
        statusChartInstance = new Chart(statusChartCanvas.value, {
            type: 'doughnut',
            data: statusChartData.value,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(value);
};
</script>

<template>
    <div class="p-6 space-y-6 bg-gray-50 min-h-screen">
        <!-- Header & Filters -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Tableau de Bord KPI</h1>
                <p class="text-sm text-gray-500">Analysez la performance de votre flotte</p>
            </div>
            
            <div class="flex bg-white rounded-lg shadow-sm p-1 border border-gray-200 overflow-x-auto">
                <button 
                    @click="setPeriod('week')"
                    :class="['px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap', periodType === 'week' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50']"
                >
                    Semaine
                </button>
                <button 
                    @click="setPeriod('month')"
                    :class="['px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap', periodType === 'month' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50']"
                >
                    Mois
                </button>
                <button 
                    @click="setPeriod('year')"
                    :class="['px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap', periodType === 'year' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50']"
                >
                    Année
                </button>
            </div>
        </div>

        <div v-if="loading" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-4 text-gray-500">Chargement des données...</p>
        </div>

        <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {{ error }}
        </div>

        <div v-else class="space-y-6">
            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Revenue -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Chiffre d'Affaires</p>
                            <h3 class="text-2xl font-bold text-gray-900 mt-2">{{ formatCurrency(metrics.totalRevenue) }}</h3>
                        </div>
                        <div class="p-2 bg-green-50 rounded-lg">
                            <TrendingUp class="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div class="mt-4 flex items-center text-sm">
                        <span class="text-green-600 font-medium flex items-center">
                            <ArrowUpRight class="w-4 h-4 mr-1" />
                            {{ metrics.revenueGrowth }}%
                        </span>
                        <span class="text-gray-400 ml-2">vs période précédente</span>
                    </div>
                </div>

                <!-- Net Profit -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Bénéfice Net</p>
                            <h3 class="text-2xl font-bold text-gray-900 mt-2">{{ formatCurrency(metrics.netProfit) }}</h3>
                        </div>
                        <div class="p-2 bg-indigo-50 rounded-lg">
                            <Wallet class="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                    <div class="mt-4 text-sm text-gray-500">
                        Dépenses: <span class="font-medium text-red-500">{{ formatCurrency(metrics.totalExpenses) }}</span>
                    </div>
                </div>

                <!-- Bookings -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Réservations</p>
                            <h3 class="text-2xl font-bold text-gray-900 mt-2">{{ metrics.totalBookings }}</h3>
                        </div>
                        <div class="p-2 bg-blue-50 rounded-lg">
                            <Calendar class="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div class="mt-4 text-sm text-gray-500">
                        Taux d'occupation: <span class="font-medium text-gray-900">{{ metrics.occupancyRate.toFixed(1) }}%</span>
                    </div>
                </div>

                <!-- Fleet Status -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-sm font-medium text-gray-500">Flotte Totale</p>
                            <h3 class="text-2xl font-bold text-gray-900 mt-2">{{ fleetStatus.total }}</h3>
                        </div>
                        <div class="p-2 bg-purple-50 rounded-lg">
                            <Car class="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <div class="mt-4 flex gap-2 text-xs">
                        <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full">{{ fleetStatus.available }} Dispo</span>
                        <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{{ fleetStatus.rented }} Loué</span>
                        <span class="px-2 py-1 bg-red-100 text-red-700 rounded-full">{{ fleetStatus.maintenance }} Maint.</span>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Revenue Chart -->
                <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Évolution du Chiffre d'Affaires</h3>
                    <div class="h-80 relative">
                        <canvas ref="revenueChartCanvas"></canvas>
                    </div>
                </div>

                <!-- Fleet Status Chart -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">État de la Flotte</h3>
                    <div class="h-64 relative flex items-center justify-center">
                        <canvas ref="statusChartCanvas"></canvas>
                    </div>
                    <div class="mt-6 space-y-3">
                        <div class="flex justify-between items-center text-sm">
                            <span class="flex items-center text-gray-600"><span class="w-3 h-3 rounded-full bg-green-500 mr-2"></span>Disponible</span>
                            <span class="font-medium">{{ fleetStatus.available }}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="flex items-center text-gray-600"><span class="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>Loué</span>
                            <span class="font-medium">{{ fleetStatus.rented }}</span>
                        </div>
                        <div class="flex justify-between items-center text-sm">
                            <span class="flex items-center text-gray-600"><span class="w-3 h-3 rounded-full bg-red-500 mr-2"></span>Maintenance</span>
                            <span class="font-medium">{{ fleetStatus.maintenance }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
