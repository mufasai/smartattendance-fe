// ============================================
// Location Boundaries Service
// ============================================

import { apiClient } from "../utils/apiClient";

export interface LocationBoundary {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

export const locationService = {
    /**
     * Get all location boundaries
     */
    async getAll(): Promise<LocationBoundary[]> {
        const response = await apiClient.get<ApiResponse<LocationBoundary[]>>(
            "/location-boundaries/all"
        );
        return response.data || [];
    },

    /**
     * Create new location boundary
     */
    async create(data: {
        name: string;
        latitude: number;
        longitude: number;
        radius: number;
    }): Promise<LocationBoundary> {
        const response = await apiClient.post<ApiResponse<LocationBoundary>>(
            "/location-boundaries",
            data
        );
        if (!response.data) {
            throw new Error("Failed to create location boundary");
        }
        return response.data;
    },

    /**
     * Update location boundary
     */
    async update(
        id: string,
        data: {
            name?: string;
            latitude?: number;
            longitude?: number;
            radius?: number;
        }
    ): Promise<LocationBoundary> {
        const response = await apiClient.patch<ApiResponse<LocationBoundary>>(
            `/location-boundaries/${id}`,
            data
        );
        if (!response.data) {
            throw new Error("Failed to update location boundary");
        }
        return response.data;
    },

    /**
     * Toggle location boundary active status
     */
    async toggleActive(id: string): Promise<LocationBoundary> {
        const response = await apiClient.patch<ApiResponse<LocationBoundary>>(
            `/location-boundaries/${id}`,
            {}
        );
        if (!response.data) {
            throw new Error("Failed to toggle location boundary");
        }
        return response.data;
    },

    /**
     * Delete location boundary
     */
    async delete(id: string): Promise<void> {
        await apiClient.delete<ApiResponse<void>>(
            `/location-boundaries/${id}`
        );
    },
};
