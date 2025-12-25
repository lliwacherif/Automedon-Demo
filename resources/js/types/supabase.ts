export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            cars: {
                Row: {
                    id: number
                    created_at: string
                    make: string | null
                    model: string
                    brand: string | null
                    year: number | null
                    license_plate: string
                    color: string | null
                    price_per_day: number | null
                    mileage: number
                    transmission: string | null
                    seats: number | null
                    fuel_type: string | null
                    description: string | null
                    status: string | null
                    image_url: string | null
                    auto_manage_status: boolean | null
                }
                Insert: {
                    id?: number
                    created_at?: string
                    make?: string | null
                    model: string
                    brand?: string | null
                    year?: number | null
                    license_plate: string
                    color?: string | null
                    price_per_day?: number | null
                    mileage?: number
                    transmission?: string | null
                    seats?: number | null
                    fuel_type?: string | null
                    description?: string | null
                    status?: string | null
                    image_url?: string | null
                    auto_manage_status?: boolean | null
                }
                Update: {
                    id?: number
                    created_at?: string
                    make?: string | null
                    model?: string
                    brand?: string | null
                    year?: number | null
                    license_plate?: string
                    color?: string | null
                    price_per_day?: number | null
                    mileage?: number
                    transmission?: string | null
                    seats?: number | null
                    fuel_type?: string | null
                    description?: string | null
                    status?: string | null
                    image_url?: string | null
                    auto_manage_status?: boolean | null
                }
            },
            admin_settings: {
                Row: {
                    id: number
                    password_hash: string
                    updated_at: string
                }
                Insert: {
                    id?: number
                    password_hash: string
                    updated_at?: string
                }
                Update: {
                    id?: number
                    password_hash?: string
                    updated_at?: string
                }
            },
            reservations: {
                Row: {
                    id: number
                    reservation_number: string
                    // User Reference
                    user_id: string | null
                    // Client Information
                    client_name: string
                    client_cin: string
                    client_phone: string
                    client_email: string | null
                    // Reservation Details
                    car_id: number
                    start_date: string
                    end_date: string
                    duration_days: number
                    // Pricing
                    price_per_day: number
                    total_price: number
                    // Status
                    status: string
                    // Optional
                    pickup_location: string | null
                    return_location: string | null
                    notes: string | null
                    // Timestamps
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: number
                    reservation_number?: string
                    // User Reference
                    user_id?: string | null
                    // Client Information
                    client_name: string
                    client_cin: string
                    client_phone: string
                    client_email?: string | null
                    // Reservation Details
                    car_id: number
                    start_date: string
                    end_date: string
                    duration_days: number
                    // Pricing
                    price_per_day: number
                    total_price: number
                    // Status
                    status?: string
                    // Optional
                    pickup_location?: string | null
                    return_location?: string | null
                    notes?: string | null
                    // Timestamps
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: number
                    reservation_number?: string
                    // User Reference
                    user_id?: string | null
                    // Client Information
                    client_name?: string
                    client_cin?: string
                    client_phone?: string
                    client_email?: string | null
                    // Reservation Details
                    car_id?: number
                    start_date?: string
                    end_date?: string
                    duration_days?: number
                    // Pricing
                    price_per_day?: number
                    total_price?: number
                    // Status
                    status?: string
                    // Optional
                    pickup_location?: string | null
                    return_location?: string | null
                    notes?: string | null
                    // Timestamps
                    created_at?: string
                    updated_at?: string
                }
            }
            maintenance_records: {
                Row: {
                    id: number
                    created_at: string
                    updated_at: string
                    car_id: number
                    maintenance_type: 'OIL_CHANGE' | 'BRAKE_SERVICE' | 'REPAIR' | 'ROUTINE_CHECK' | 'LAVAGE' | 'ASSURANCE' | 'VIGNETTE' | 'LEASING'
                    cost: number
                    odometer: number
                    maintenance_date: string
                    notes: string | null
                    provider: string | null
                    next_due_mileage: number | null
                }
                Insert: {
                    id?: number
                    created_at?: string
                    updated_at?: string
                    car_id: number
                    maintenance_type: 'OIL_CHANGE' | 'BRAKE_SERVICE' | 'REPAIR' | 'ROUTINE_CHECK' | 'LAVAGE' | 'ASSURANCE' | 'VIGNETTE' | 'LEASING'
                    cost: number
                    odometer: number
                    maintenance_date: string
                    notes?: string | null
                    provider?: string | null
                    next_due_mileage?: number | null
                }
                Update: {
                    id?: number
                    created_at?: string
                    updated_at?: string
                    car_id?: number
                    maintenance_type?: 'OIL_CHANGE' | 'BRAKE_SERVICE' | 'REPAIR' | 'ROUTINE_CHECK' | 'LAVAGE' | 'ASSURANCE' | 'VIGNETTE' | 'LEASING'
                    cost?: number
                    odometer?: number
                    maintenance_date?: string
                    notes?: string | null
                    provider?: string | null
                    next_due_mileage?: number | null
                }
            }
        }
        Views: {
            [_: string]: {
                Row: {
                    [key: string]: any
                }
            }
        }
        Functions: {
            [_: string]: {
                Args: {
                    [key: string]: any
                }
                Returns: any
            }
        }
        Enums: {
            [_: string]: any
        }
    }
}
