// ============================================
// Attendance Service
// ============================================

import { apiClient } from "../utils/apiClient";

export interface AttendanceLog {
    id: string;
    nik: string;
    full_name: string;
    check_in_time?: string;
    check_out_time?: string;
    status: string;
    location?: string;
    created_at: string;
}

export interface ApiResponse<T> {
    status: string;
    message?: string;
    data: T;
}

export const attendanceService = {
    /**
     * Get all attendance logs
     */
    async getLogs(filters?: {
        start_date?: string;
        end_date?: string;
        nik?: string;
    }): Promise<AttendanceLog[]> {
        const response = await apiClient.get<ApiResponse<AttendanceLog[]>>(
            "/attendance/logs",
            filters
        );
        return response.data || [];
    },

    /**
     * Get attendance log by ID
     */
    async getById(id: string): Promise<AttendanceLog> {
        const response = await apiClient.get<ApiResponse<AttendanceLog>>(
            `/attendance/logs/${id}`
        );
        if (!response.data) {
            throw new Error("Attendance log not found");
        }
        return response.data;
    },
};
