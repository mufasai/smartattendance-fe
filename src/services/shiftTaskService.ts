// ============================================
// Shift Task Service
// ============================================

import { apiClient } from "../utils/apiClient";
import type {
    ShiftTask,
    CreateShiftTaskDto,
    UpdateShiftTaskDto,
    ApiResponse,
} from "../types/shiftManagement";

export const shiftTaskService = {
    /**
     * Get all shift tasks
     */
    async getAll(filters?: {
        department?: string;
        shift_type?: string;
        is_active?: boolean;
    }): Promise<ShiftTask[]> {
        const response = await apiClient.get<ApiResponse<ShiftTask[]>>(
            "/shift-tasks",
            filters
        );
        return response.data || [];
    },

    /**
     * Get shift task by ID
     */
    async getById(id: string): Promise<ShiftTask> {
        const response = await apiClient.get<ApiResponse<ShiftTask>>(
            `/shift-tasks/${id}`
        );
        if (!response.data) {
            throw new Error("Shift task not found");
        }
        return response.data;
    },

    /**
     * Create new shift task
     */
    async create(data: CreateShiftTaskDto): Promise<ShiftTask> {
        const response = await apiClient.post<ApiResponse<ShiftTask>>(
            "/shift-tasks",
            data
        );
        if (!response.data) {
            throw new Error("Failed to create shift task");
        }
        return response.data;
    },

    /**
     * Update shift task
     */
    async update(id: string, data: UpdateShiftTaskDto): Promise<ShiftTask> {
        const response = await apiClient.put<ApiResponse<ShiftTask>>(
            `/shift-tasks/${id}`,
            data
        );
        if (!response.data) {
            throw new Error("Failed to update shift task");
        }
        return response.data;
    },

    /**
     * Delete shift task
     */
    async delete(id: string): Promise<void> {
        await apiClient.delete<ApiResponse<void>>(`/shift-tasks/${id}`);
    },
};
