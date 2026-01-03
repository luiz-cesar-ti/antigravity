export interface User {
    id: string;
    totvs_number: string;
    full_name: string;
    email: string;
    units: string[];
    role: 'teacher';
    active: boolean;
    recurring_booking_enabled: boolean;
    recurring_booking_units: string[];
    created_at: string;
}

export interface Admin {
    id: string;
    username: string;
    unit: string;
    role: 'admin';
}

export interface Equipment {
    id: string;
    unit: string;
    name: string;
    brand?: string;
    model?: string;
    total_quantity: number;
    created_at: string;
    updated_at: string;
}

export interface Booking {
    id: string;
    user_id: string;
    unit: string;
    local: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    equipment_id: string;
    quantity: number;
    observations?: string;
    status: 'active' | 'encerrado' | 'cancelled' | 'cancelled_by_user';
    term_signed: boolean;
    term_document?: any;
    display_id?: string;
    is_recurring?: boolean;
    recurring_id?: string;
    created_at: string;
    updated_at: string;

    // Joins
    equipment?: Equipment;
    users?: User;
}

export interface RecurringBooking {
    id: string;
    user_id: string;
    unit: string;
    local: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    equipments: any[];
    is_active: boolean;
    last_generated_month: string | null;
    created_at: string;
    updated_at: string;
}

export interface Settings {
    id: string;
    unit: string;
    min_advance_time_enabled: boolean;
    min_advance_time_hours: number;
    updated_at: string;
}

export interface EquipmentLoan {
    id: string;
    unit: string;
    user_full_name: string;
    user_role: string;
    location: string;
    start_at: string;
    end_at: string;
    equipment_id: string;
    quantity: number;
    asset_number: string;
    cpf?: string;
    status: 'active' | 'returned' | 'cancelled';
    created_at: string;
    updated_at: string;

    // Joins
    equipment?: Equipment;
}

export type UserRole = 'teacher' | 'admin';

export interface AuthState {
    user: User | Admin | null;
    role: UserRole | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
