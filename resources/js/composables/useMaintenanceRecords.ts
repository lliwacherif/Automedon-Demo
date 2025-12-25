import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

export type MaintenanceType = 'OIL_CHANGE' | 'BRAKE_SERVICE' | 'REPAIR' | 'ROUTINE_CHECK' | 'LAVAGE' | 'ASSURANCE' | 'VIGNETTE' | 'LEASING';

export interface MaintenanceRecord {
    id: number;
    created_at: string;
    updated_at: string;
    car_id: number;
    maintenance_type: MaintenanceType;
    cost: number;
    odometer: number;
    maintenance_date: string;
    notes: string | null;
    provider: string | null;
    next_due_mileage: number | null;
}

// French labels for maintenance types
export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
    OIL_CHANGE: 'Vidange',
    BRAKE_SERVICE: 'Freins',
    REPAIR: 'Réparation',
    ROUTINE_CHECK: 'Visite Technique',
    LAVAGE: 'Lavage',
    ASSURANCE: 'Assurance',
    VIGNETTE: 'Vignette',
    LEASING: 'Leasing (Cambiale)',
};

export function useMaintenanceRecords() {
    const maintenanceRecords = ref<MaintenanceRecord[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Calculate total maintenance cost for a specific car
    const totalMaintenanceCost = computed(() => {
        return maintenanceRecords.value.reduce((sum, record) => sum + Number(record.cost), 0);
    });

    // Fetch all maintenance records for a specific car
    async function fetchMaintenanceRecords(carId: number) {
        loading.value = true;
        error.value = null;

        try {
            const { data, error: supabaseError } = await supabase
                .from('maintenance_records')
                .select('*')
                .eq('car_id', carId)
                .order('maintenance_date', { ascending: false });

            if (supabaseError) throw supabaseError;

            maintenanceRecords.value = (data || []) as MaintenanceRecord[];
        } catch (e: any) {
            error.value = e.message;
            console.error('Error fetching maintenance records:', e);
        } finally {
            loading.value = false;
        }
    }

    // Get a single maintenance record by ID
    async function getMaintenanceRecord(id: number) {
        loading.value = true;
        error.value = null;

        try {
            const { data, error: supabaseError } = await supabase
                .from('maintenance_records')
                .select('*')
                .eq('id', id)
                .single();

            if (supabaseError) throw supabaseError;

            return data as MaintenanceRecord;
        } catch (e: any) {
            error.value = e.message;
            console.error('Error fetching maintenance record:', e);
            return null;
        } finally {
            loading.value = false;
        }
    }

    // Create a new maintenance record
    async function createMaintenanceRecord(
        record: Database['public']['Tables']['maintenance_records']['Insert']
    ) {
        loading.value = true;
        error.value = null;

        try {
            const { data, error: supabaseError } = await (supabase
                .from('maintenance_records') as any)
                .insert([record])
                .select()
                .single();

            if (supabaseError) throw supabaseError;

            // Refresh the list to include the new record
            if (record.car_id) {
                await fetchMaintenanceRecords(record.car_id);
            }

            return data as MaintenanceRecord;
        } catch (e: any) {
            error.value = e.message;
            console.error('Error creating maintenance record:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    // Update an existing maintenance record
    async function updateMaintenanceRecord(
        id: number,
        record: Database['public']['Tables']['maintenance_records']['Update']
    ) {
        loading.value = true;
        error.value = null;

        try {
            const { data, error: supabaseError } = await (supabase
                .from('maintenance_records') as any)
                .update(record)
                .eq('id', id)
                .select()
                .single();

            if (supabaseError) throw supabaseError;

            // Refresh the list to show updated record
            if (data && data.car_id) {
                await fetchMaintenanceRecords(data.car_id);
            }

            return data as MaintenanceRecord;
        } catch (e: any) {
            error.value = e.message;
            console.error('Error updating maintenance record:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    // Delete a maintenance record
    async function deleteMaintenanceRecord(id: number, carId: number) {
        loading.value = true;
        error.value = null;

        try {
            const { error: supabaseError } = await supabase
                .from('maintenance_records')
                .delete()
                .eq('id', id);

            if (supabaseError) throw supabaseError;

            // Refresh the list
            await fetchMaintenanceRecords(carId);
        } catch (e: any) {
            error.value = e.message;
            console.error('Error deleting maintenance record:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    // Calculate total cost for a specific car
    async function calculateTotalMaintenanceCost(carId: number): Promise<number> {
        try {
            const { data, error: supabaseError } = await supabase
                .from('maintenance_records')
                .select('cost')
                .eq('car_id', carId);

            if (supabaseError) throw supabaseError;

            return (data || []).reduce((sum, record) => sum + Number((record as any).cost), 0);
        } catch (e: any) {
            console.error('Error calculating total maintenance cost:', e);
            return 0;
        }
    }

    return {
        maintenanceRecords,
        loading,
        error,
        totalMaintenanceCost,
        fetchMaintenanceRecords,
        getMaintenanceRecord,
        createMaintenanceRecord,
        updateMaintenanceRecord,
        deleteMaintenanceRecord,
        calculateTotalMaintenanceCost,
    };
}
