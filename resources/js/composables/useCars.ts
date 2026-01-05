import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabase';

export type CarBrand = 'Renault' | 'Dacia' | 'Skoda' | 'Hyundai' | 'Seat' | 'MG' | 'Mahindra' | 'Kia' | 'Honda' | 'Peugeot' | 'Cherry' | 'Geely';
export type CarStatus = 'disponible' | 'loue' | 'maintenance';

export interface Car {
    id: number;
    brand: CarBrand;
    model: string;
    plate_number: string;
    status: CarStatus;
    image_url?: string;
    mileage?: number | null;
    auto_manage_status?: boolean;
    created_at: string;
    next_reservation?: {
        start_date: string;
        end_date: string;
    };
}

export interface CarsByBrand {
    [key: string]: Car[];
}

export function useCars() {
    const cars = ref<Car[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const carsByBrand = computed(() => {
        const grouped: CarsByBrand = {
            'Renault': [],
            'Dacia': [],
            'Skoda': [],
            'Hyundai': [],
            'Seat': [],
            'MG': [],
            'Mahindra': [],
            'Kia': [],
            'Honda': [],
            'Peugeot': [],
            'Cherry': [],
            'Geely': []
        };

        cars.value.forEach(car => {
            if (grouped[car.brand]) {
                grouped[car.brand].push(car);
            }
        });

        return grouped;
    });

    // Helper to map DB result to Car interface
    const mapCar = (dbCar: any): Car => ({
        id: dbCar.id,
        brand: dbCar.brand,
        model: dbCar.model,
        plate_number: dbCar.license_plate, // Map license_plate to plate_number
        status: dbCar.status,
        image_url: dbCar.image_url,
        mileage: dbCar.mileage,
        auto_manage_status: dbCar.auto_manage_status,
        created_at: dbCar.created_at
    });

    async function fetchCars() {
        loading.value = true;
        error.value = null;

        try {
            // Fetch cars
            const { data: carsData, error: carsError } = await (supabase
                .from('cars')
                .select('id, brand, model, license_plate, status, image_url, mileage, auto_manage_status, created_at')
                .order('brand', { ascending: true })
                .order('model', { ascending: true }) as any);

            if (carsError) throw carsError;

            // Fetch future reservations
            const now = new Date().toISOString();
            const { data: reservationsData, error: resError } = await (supabase
                .from('reservations')
                .select('car_id, start_date, end_date')
                .in('status', ['confirmed', 'active'])
                .gt('start_date', now)
                .order('start_date', { ascending: true }) as any);

            if (resError) throw resError;

            // Map reservations to cars
            const mappedCars = (carsData || []).map((dbCar: any) => {
                const car = mapCar(dbCar);

                // Find nearest future reservation for this car
                const futureRes = (reservationsData || []).find((r: any) => r.car_id === car.id);
                if (futureRes) {
                    car.next_reservation = {
                        start_date: futureRes.start_date,
                        end_date: futureRes.end_date
                    };
                }

                return car;
            });

            cars.value = mappedCars;
        } catch (e: any) {
            error.value = e.message;
            console.error('Error fetching cars:', e);
        } finally {
            loading.value = false;
        }
    }

    async function fetchCarById(id: number) {
        loading.value = true;
        error.value = null;

        try {
            const { data, error: supabaseError } = await (supabase
                .from('cars')
                .select('id, brand, model, license_plate, status, image_url, mileage, auto_manage_status, created_at')
                .eq('id', id)
                .single() as any);

            if (supabaseError) throw supabaseError;

            return mapCar(data);
        } catch (e: any) {
            error.value = e.message;
            console.error('Error fetching car:', e);
            return null;
        } finally {
            loading.value = false;
        }
    }

    async function createCar(carData: Omit<Car, 'id' | 'created_at'>) {
        loading.value = true;
        error.value = null;

        try {
            // Use 'as any' to avoid complex type errors but keep manual mapping logic
            const { data, error: supabaseError } = await (supabase
                .from('cars') as any)
                .insert([
                    {
                        brand: carData.brand,
                        model: carData.model,
                        license_plate: carData.plate_number,
                        status: carData.status,
                        image_url: carData.image_url || null
                    }
                ])
                .select('id, brand, model, license_plate, status, image_url, mileage, auto_manage_status, created_at')
                .single();

            if (supabaseError) throw supabaseError;

            await fetchCars();
            return mapCar(data);
        } catch (e: any) {
            error.value = e.message;
            console.error('Error creating car:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function updateCar(id: number, carData: Partial<Car>) {
        loading.value = true;
        error.value = null;

        try {
            const updateData: Record<string, any> = {};

            if (carData.brand !== undefined) updateData.brand = carData.brand;
            if (carData.model !== undefined) updateData.model = carData.model;
            if (carData.plate_number !== undefined) updateData.license_plate = carData.plate_number;
            if (carData.status !== undefined) updateData.status = carData.status;
            if (carData.image_url !== undefined) updateData.image_url = carData.image_url || null;

            const { data, error: supabaseError } = await (supabase
                .from('cars') as any)
                .update(updateData)
                .eq('id', id)
                .select('id, brand, model, license_plate, status, image_url, mileage, auto_manage_status, created_at');

            if (supabaseError) throw supabaseError;

            await fetchCars();
            return data?.[0] ? mapCar(data[0]) : null;
        } catch (e: any) {
            error.value = e.message;
            console.error('Error updating car:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    async function deleteCar(id: number) {
        loading.value = true;
        error.value = null;

        try {
            const { error: supabaseError } = await supabase
                .from('cars')
                .delete()
                .eq('id', id);

            if (supabaseError) throw supabaseError;

            await fetchCars();
        } catch (e: any) {
            error.value = e.message;
            console.error('Error deleting car:', e);
            throw e;
        } finally {
            loading.value = false;
        }
    }

    return {
        cars,
        carsByBrand,
        loading,
        error,
        fetchCars,
        fetchCarById,
        createCar,
        updateCar,
        deleteCar,
    };
}
