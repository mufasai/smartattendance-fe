// ============================================
// Leave Request Service
// ============================================

import { apiClient } from "../utils/apiClient";

export interface LeaveRequest {
    id: string;
    nik: string;
    full_name: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: "pending" | "approved" | "rejected";
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T> {
    status: string;
    message?: string;
    data: T;
}

export const leaveService = {
    /**
     * Get all leave requests
     */
    async getAll(filters?: {
        status?: string;
        nik?: string;
        start_date?: string;
        end_date?: string;
    }): Promise<LeaveRequest[]> {
        const response = await apiClient.get<ApiResponse<LeaveRequest[]>>(
            "/leave",
            filters
        );
        return response.data || [];
    },

    /**
     * Get leave request by ID
     */
    async getById(id: string): Promise<LeaveRequest> {
        const response = await apiClient.get<ApiResponse<LeaveRequest>>(
            `/leave/${id}`
        );
        if (!response.data) {
            throw new Error("Leave request not found");
        }
        return response.data;
    },

    /**
     * Update leave request status
     */
    async updateStatus(
        id: string,
        status: "approved" | "rejected"
    ): Promise<LeaveRequest> {
        const response = await apiClient.put<ApiResponse<LeaveRequest>>(
            "/leave/status",
            { id, status }
        );
        if (!response.data) {
            throw new Error("Failed to update leave request status");
        }
        return response.data;
    },
};
