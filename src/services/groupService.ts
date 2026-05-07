// ============================================
// Group Service
// ============================================

import { apiClient } from "../utils/apiClient";

export interface Group {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T> {
    status: string;
    message?: string;
    data: T;
}

export const groupService = {
    /**
     * Get all groups
     */
    async getAll(): Promise<Group[]> {
        const response = await apiClient.get<ApiResponse<Group[]>>("/groups");
        return response.data || [];
    },

    /**
     * Get group by ID
     */
    async getById(id: string): Promise<Group> {
        const response = await apiClient.get<ApiResponse<Group>>(
            `/groups/${id}`
        );
        if (!response.data) {
            throw new Error("Group not found");
        }
        return response.data;
    },

    /**
     * Create new group
     */
    async create(data: {
        name: string;
        description?: string;
    }): Promise<Group> {
        const response = await apiClient.post<ApiResponse<Group>>(
            "/groups",
            data
        );
        if (!response.data) {
            throw new Error("Failed to create group");
        }
        return response.data;
    },

    /**
     * Update group
     */
    async update(
        id: string,
        data: {
            name?: string;
            description?: string;
        }
    ): Promise<Group> {
        const response = await apiClient.put<ApiResponse<Group>>(
            `/groups/${id}`,
            data
        );
        if (!response.data) {
            throw new Error("Failed to update group");
        }
        return response.data;
    },

    /**
     * Delete group
     */
    async delete(id: string): Promise<void> {
        await apiClient.delete<ApiResponse<void>>(`/groups/${id}`);
    },
};
