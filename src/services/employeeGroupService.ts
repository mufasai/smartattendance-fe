// ============================================
// Employee Group Service
// ============================================

import { apiClient } from "../utils/apiClient";
import type {
    Employee,
    EmployeeGroup,
    SaveEmployeeGroupsDto,
    ApiResponse,
    EmployeeGroupsResponse,
} from "../types/shiftManagement";

export const employeeGroupService = {
    /**
     * Get employee groups for shift task
     */
    async getGroups(shiftTaskId: string): Promise<EmployeeGroupsResponse> {
        const response = await apiClient.get<ApiResponse<EmployeeGroupsResponse>>(
            `/shift-tasks/${shiftTaskId}/groups`
        );
        if (!response.data) {
            throw new Error("Failed to fetch employee groups");
        }
        return response.data;
    },

    /**
     * Save employee groups
     */
    async saveGroups(
        shiftTaskId: string,
        data: SaveEmployeeGroupsDto
    ): Promise<EmployeeGroup[]> {
        const response = await apiClient.put<ApiResponse<EmployeeGroupsResponse>>(
            `/shift-tasks/${shiftTaskId}/groups`,
            data
        );
        if (!response.data) {
            throw new Error("Failed to save employee groups");
        }
        return response.data.groups;
    },

    /**
     * Get available employees for shift task
     */
    async getAvailableEmployees(shiftTaskId: string): Promise<Employee[]> {
        const response = await apiClient.get<ApiResponse<Employee[]>>(
            `/shift-tasks/${shiftTaskId}/available-employees`
        );
        return response.data || [];
    },
};
