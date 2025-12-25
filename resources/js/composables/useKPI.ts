import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { startOfMonth, endOfMonth, subMonths, format, isWithinInterval, parseISO, startOfWeek, endOfWeek, subWeeks, startOfYear, endOfYear } from 'date-fns'

export interface KPIMetrics {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    totalBookings: number
    occupancyRate: number
    averageDailyRate: number
    revenueGrowth: number // Percentage vs previous period
}

export interface FleetStatus {
    total: number
    available: number
    rented: number
    maintenance: number
}

export interface ChartData {
    labels: string[]
    datasets: {
        label: string
        data: number[]
        backgroundColor?: string | string[]
        borderColor?: string | string[]
        fill?: boolean
    }[]
}

export function useKPI() {
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Date Range State
    const dateRange = ref<{ start: Date; end: Date }>({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    })

    const periodType = ref<'month' | 'week' | 'year' | 'custom'>('month')

    // Data State
    const metrics = ref<KPIMetrics>({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        totalBookings: 0,
        occupancyRate: 0,
        averageDailyRate: 0,
        revenueGrowth: 0
    })

    const fleetStatus = ref<FleetStatus>({
        total: 0,
        available: 0,
        rented: 0,
        maintenance: 0
    })

    const revenueChartData = ref<ChartData>({ labels: [], datasets: [] })
    const statusChartData = ref<ChartData>({ labels: [], datasets: [] })

    // Helper to set date range
    const setPeriod = (type: 'month' | 'week' | 'year' | 'custom', customRange?: { start: Date; end: Date }) => {
        periodType.value = type
        const now = new Date()

        switch (type) {
            case 'week':
                dateRange.value = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
                break
            case 'month':
                dateRange.value = { start: startOfMonth(now), end: endOfMonth(now) }
                break
            case 'year':
                dateRange.value = { start: startOfYear(now), end: endOfYear(now) }
                break
            case 'custom':
                if (customRange) dateRange.value = customRange
                break
        }
        fetchData()
    }

    const fetchData = async () => {
        loading.value = true
        error.value = null
        try {
            await Promise.all([
                fetchFleetStatus(),
                fetchFinancials(),
                fetchChartData()
            ])
        } catch (e: any) {
            console.error('Error fetching KPI data:', e)
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    const fetchFleetStatus = async () => {
        const { data: cars, error: err } = await supabase
            .from('cars')
            .select('status')

        if (err) throw err

        const carData = cars as any[]
        const total = carData.length
        const available = carData.filter(c => c.status === 'disponible').length
        const rented = carData.filter(c => c.status === 'loue').length
        const maintenance = carData.filter(c => c.status === 'maintenance').length

        fleetStatus.value = { total, available, rented, maintenance }

        // Update Status Chart
        statusChartData.value = {
            labels: ['Disponible', 'Loué', 'Maintenance'],
            datasets: [{
                label: 'Fleet Status',
                data: [available, rented, maintenance],
                backgroundColor: ['#10B981', '#3B82F6', '#EF4444']
            }]
        }
    }

    const fetchFinancials = async () => {
        const startStr = dateRange.value.start.toISOString()
        const endStr = dateRange.value.end.toISOString()

        // Fetch Reservations (Revenue) - Include all non-cancelled reservations that overlap with the period
        const { data: reservations, error: resError } = await supabase
            .from('reservations')
            .select('total_price, status, created_at, start_date, end_date')
            .neq('status', 'cancelled')
            .or(`start_date.lte.${format(dateRange.value.end, 'yyyy-MM-dd')},end_date.gte.${format(dateRange.value.start, 'yyyy-MM-dd')}`)

        if (resError) throw resError

        // Fetch Maintenance (Expenses)
        const { data: maintenance, error: maintError } = await supabase
            .from('maintenance_records')
            .select('cost, maintenance_date')
            .gte('maintenance_date', startStr)
            .lte('maintenance_date', endStr)

        if (maintError) throw maintError

        const resData = reservations as any[]
        const maintData = maintenance as any[]

        // Calculate Metrics
        const revenue = resData.reduce((sum, r) => sum + Number(r.total_price), 0)
        const expenses = maintData.reduce((sum, m) => sum + Number(m.cost), 0)
        const bookings = resData.length

        // Simple Occupancy Rate Calculation (Days Rented / (Total Cars * Days in Period))
        // This is an approximation. A more accurate one would query daily availability.
        const daysInPeriod = (dateRange.value.end.getTime() - dateRange.value.start.getTime()) / (1000 * 3600 * 24)
        const totalCarDays = fleetStatus.value.total * daysInPeriod
        // Sum of duration of reservations that overlap with the period
        // For simplicity, we'll just use the count of active reservations for now or 0 if no cars
        const occupancy = totalCarDays > 0 ? (bookings * 3) / totalCarDays * 100 : 0 // Assuming avg 3 days per booking for estimation if real duration not calculated

        metrics.value = {
            totalRevenue: revenue,
            totalExpenses: expenses,
            netProfit: revenue - expenses,
            totalBookings: bookings,
            occupancyRate: Math.min(occupancy, 100), // Cap at 100%
            averageDailyRate: bookings > 0 ? revenue / bookings : 0, // Avg revenue per booking
            revenueGrowth: 0 // To be implemented with comparison logic
        }
    }

    const fetchChartData = async () => {
        // This would ideally aggregate data by day/week from the DB
        // For now, we can process the already fetched data or make a new query
        // Let's assume we want a daily breakdown of Revenue

        const startStr = dateRange.value.start.toISOString()
        const endStr = dateRange.value.end.toISOString()

        const { data: reservations } = await supabase
            .from('reservations')
            .select('total_price, created_at')
            .gte('created_at', startStr)
            .lte('created_at', endStr)
            .neq('status', 'cancelled')

        if (!reservations) return

        const resData = reservations as any[]

        // Group by Date
        const dailyRevenue: Record<string, number> = {}
        resData.forEach(r => {
            const date = format(parseISO(r.created_at), 'yyyy-MM-dd')
            dailyRevenue[date] = (dailyRevenue[date] || 0) + Number(r.total_price)
        })

        const labels = Object.keys(dailyRevenue).sort()
        const data = labels.map(date => dailyRevenue[date])

        revenueChartData.value = {
            labels,
            datasets: [{
                label: 'Revenue',
                data,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true
            }]
        }
    }

    return {
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
    }
}
