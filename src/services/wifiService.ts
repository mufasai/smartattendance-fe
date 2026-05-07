// ============================================
// WiFi Settings Service
// ============================================

import { apiClient } from "../utils/apiClient";

export interface WiFiSetting {
    id: string;
    ssid: string;
    bssid: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

export const wifiService = {
    /**
     * Get all WiFi settings
     */
    async getAll(): Promise<WiFiSetting[]> {
        const response = await apiClient.get<ApiResponse<WiFiSetting[]>>(
            "/wifi-settings/all"
        );
        return response.data || [];
    },

    /**
     * Create new WiFi setting
     */
    async create(data: { ssid: string; bssid: string }): Promise<WiFiSetting> {
        const response = await apiClient.post<ApiResponse<WiFiSetting>>(
            "/wifi-settings",
            data
        );
        if (!response.data) {
            throw new Error("Failed to create WiFi setting");
        }
        return response.data;
    },

    /**
     * Update WiFi setting
     */
    async update(
        id: string,
        data: { ssid?: string; bssid?: string }
    ): Promise<WiFiSetting> {
        const response = await apiClient.put<ApiResponse<WiFiSetting>>(
            `/wifi-settings/${id}`,
            data
        );
        if (!response.data) {
            throw new Error("Failed to update WiFi setting");
        }
        return response.data;
    },

    /**
     * Toggle WiFi setting active status
     */
    async toggleActive(id: string): Promise<WiFiSetting> {
        const response = await apiClient.put<ApiResponse<WiFiSetting>>(
            `/wifi-settings/${id}`,
            {}
        );
        if (!response.data) {
            throw new Error("Failed to toggle WiFi setting");
        }
        return response.data;
    },

    /**
     * Delete WiFi setting
     */
    async delete(id: string): Promise<void> {
        await apiClient.delete<ApiResponse<void>>(`/wifi-settings/${id}`);
    },
};
