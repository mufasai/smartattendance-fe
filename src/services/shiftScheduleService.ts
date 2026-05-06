// ============================================
// Shift Schedule Service
// ============================================

import { apiClient } from "../utils/apiClient";
import type {
    ShiftRotationSchedule,
    GenerateScheduleDto,
    GenerateScheduleResponse,
    UpdateScheduleDto,
    ApiResponse,
} from "../types/shiftManagement";

export const shiftScheduleService = {
    /**
     * Generate shift schedule
     */
    async generate(
        shiftTaskId: string,
        data: GenerateScheduleDto
    ): Promise<GenerateScheduleResponse> {
        const response = await apiClient.post<ApiResponse<GenerateScheduleResponse>>(
            `/shift-tasks/${shiftTaskId}/schedules/generate`,
            data
        );
        if (!response.data) {
            throw new Error("Failed to generate schedule");
        }
        return response.data;
    },

    /**
     * Get schedules for shift task
     */
    async getSchedules(
        shiftTaskId: string,
        filters?: {
            start_date?: string;
            end_date?: string;
            week_number?: number;
        }
    ): Promise<ShiftRotationSchedule[]> {
        const response = await apiClient.get<ApiResponse<ShiftRotationSchedule[]>>(
            `/shift-tasks/${shiftTaskId}/schedules`,
            filters
        );
        return response.data || [];
    },

    /**
     * Update schedule for specific date (manual override)
     */
    async updateSchedule(
        shiftTaskId: string,
        date: string,
        data: UpdateScheduleDto
    ): Promise<ShiftRotationSchedule> {
        const response = await apiClient.put<ApiResponse<ShiftRotationSchedule>>(
            `/shift-tasks/${shiftTaskId}/schedules/${date}`,
            data
        );
        if (!response.data) {
            throw new Error("Failed to update schedule");
        }
        return response.data;
    },

    /**
     * Delete all schedules for shift task
     */
    async deleteSchedules(shiftTaskId: string): Promise<void> {
        await apiClient.delete<ApiResponse<void>>(
            `/shift-tasks/${shiftTaskId}/schedules`
        );
    },
};
