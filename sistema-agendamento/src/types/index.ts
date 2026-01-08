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
    terms_accepted?: boolean;
    terms_accepted_at?: string;
    terms_version?: string;
    created_at: string;
}

export interface Admin {
    id: string;
    username: string;
    unit: string;
    role: 'admin' | 'super_admin';
    session_token?: string;
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

export interface Room {
    id: string;
    name: string;
    unit: string;
    description?: string;
    min_time?: string; // "07:00:00"
    max_time?: string; // "22:00:00"
    available_days?: number[]; // [1, 2, 3, 4, 5]
    is_active?: boolean;
    is_available?: boolean;
    created_at: string;
}

export interface RoomBooking {
    id: string;
    room_id: string;
    user_id: string;
    start_ts: string; // ISO String
    end_ts: string;   // ISO String
    status: 'confirmed' | 'cancelled';
    created_at: string;

    // Joins
    room?: Room;
    users?: User;
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
    manual_term_url?: string;
    display_id?: string;
    is_recurring?: boolean;
    recurring_id?: string;
    term_hash?: string;
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
    min_advance_time_enabled: boolean;        // For equipment bookings
    min_advance_time_hours: number;           // For equipment bookings
    room_min_advance_time_enabled: boolean;   // For room bookings
    room_min_advance_time_hours: number;      // For room bookings
    room_booking_enabled: boolean;
    notification_email?: string;
    notification_email_enabled?: boolean;
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
    manual_term_url?: string;
    created_at: string;
    updated_at: string;

    // Joins
    equipment?: Equipment;
}

export type UserRole = 'teacher' | 'admin' | 'super_admin';

export interface AuthState {
    user: User | Admin | null;
    role: UserRole | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export type RoomBookingData = {
    unit: string;
    totvs_number: string;
    full_name: string;
    date: string;       // YYYY-MM-DD
    startTime: string;  // HH:mm
    endTime: string;    // HH:mm
    roomId: string;
    roomName: string;
    isRecurring: boolean;
    dayOfWeek?: number;
    termAccepted: boolean;
    displayId?: string;
    term_hash?: string;
    version_tag?: string;
    term_document?: any;
    observations?: string;
};
