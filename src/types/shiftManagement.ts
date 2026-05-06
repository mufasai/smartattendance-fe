// ============================================
// Shift Management Types
// ============================================

// SurrealDB ID can be string or object format
export type SurrealId = 
    | string 
    | { tb: string; id: { String: string } }
    | { tb: string; id: string }
    | any; // Fallback for unknown formats

export interface ShiftSchedule {
    shift_number: number;
    start_time: string;
    end_time: string;
}

export interface ShiftTask {
    id: SurrealId;
    name: string;
    department: string;
    working_location: string;
    shift_type: "2 Sesi" | "3 Sesi";
    number_of_groups: number;
    schedules: ShiftSchedule[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Helper function to extract ID string from SurrealDB format
// Returns full ID with table prefix (e.g., "shift_task:xxx")
export function extractId(id: SurrealId): string {
    console.log('extractId input:', id, 'type:', typeof id);
    
    if (typeof id === 'string') {
        // Already a string, return as-is
        console.log('extractId output (string):', id);
        return id;
    }
    
    // Handle object format from SurrealDB
    if (typeof id === 'object' && id !== null) {
        // Format 1: { tb: "shift_task", id: { String: "xxx" } }
        if ('tb' in id && 'id' in id && typeof id.id === 'object' && id.id !== null && 'String' in id.id) {
            const result = `${id.tb}:${id.id.String}`;
            console.log('extractId output (format 1):', result);
            return result;
        }
        
        // Format 2: { tb: "shift_task", id: "xxx" }
        if ('tb' in id && 'id' in id && typeof id.id === 'string') {
            const result = `${id.tb}:${id.id}`;
            console.log('extractId output (format 2):', result);
            return result;
        }
    }
    
    // Fallback: convert to string
    const result = String(id);
    console.log('extractId output (fallback):', result);
    return result;
}

export interface CreateShiftTaskDto {
    name: string;
    department: string;
    working_location: string;
    shift_type: "2 Sesi" | "3 Sesi";
    number_of_groups: number;
    schedules: ShiftSchedule[];
}

export interface UpdateShiftTaskDto {
    name?: string;
    department?: string;
    working_location?: string;
    shift_type?: "2 Sesi" | "3 Sesi";
    number_of_groups?: number;
    schedules?: ShiftSchedule[];
    is_active?: boolean;
}

export interface Employee {
    id: string;
    nik: string;
    full_name: string;
    department: string;
    email?: string;
    status?: string;
}

export interface EmployeeGroup {
    id: string;
    shift_task_id: string;
    name: string;
    employee_niks: string[];
    employees?: Employee[];
    created_at: string;
    updated_at: string;
}

export interface SaveEmployeeGroupsDto {
    groups: {
        name: string;
        employee_niks: string[];
    }[];
}

export interface ShiftAssignment {
    group_id: string;
    group_name: string;
}

export interface ShiftRotationSchedule {
    id: string;
    shift_task_id: string;
    date: string;
    day_name: string;
    week_number: number;
    shift_1?: ShiftAssignment;
    shift_2?: ShiftAssignment;
    shift_3?: ShiftAssignment;
    off?: ShiftAssignment;
    is_manual_override: boolean;
    created_at: string;
    updated_at: string;
}

export interface GenerateScheduleDto {
    start_date: string;
    weeks: number;
}

export interface UpdateScheduleDto {
    shift_1_group_id?: string;
    shift_2_group_id?: string;
    shift_3_group_id?: string;
    off_group_id?: string;
}

// API Response Types
export interface ApiResponse<T> {
    status: "success" | "error";
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
}

export interface EmployeeGroupsResponse {
    shift_task_id: string;
    shift_task_name: string;
    groups: EmployeeGroup[];
}

export interface GenerateScheduleResponse {
    shift_task_id: string;
    start_date: string;
    end_date: string;
    total_days: number;
    schedules_created: number;
}
