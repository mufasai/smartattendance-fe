// ============================================
// Patrol Service
// ============================================

import { apiClient } from "../utils/apiClient";

export interface PatrolCheckpoint {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    area_id: string;
    area_name?: string;
    qr_code?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PatrolArea {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PatrolAssignment {
    id: string;
    employee_id: string;
    employee_name?: string;
    area_id: string;
    area_name?: string;
    group_id?: string;
    group_name?: string;
    shift_type: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PatrolIncident {
    id: string;
    patrol_id: string;
    checkpoint_id: string;
    employee_id: string;
    title: string;
    description: string;
    severity: "low" | "medium" | "high";
    status: "pending" | "investigating" | "resolved";
    photo_url?: string;
    created_at: string;
    updated_at: string;
}

export interface CheckpointReport {
    id: string;
    patrol_id: string;
    checkpoint_id: string;
    checkpoint_name?: string;
    employee_id: string;
    employee_name?: string;
    visited_at: string;
    latitude: number;
    longitude: number;
    notes?: string;
    photo_url?: string;
}

export interface ActivePatrol {
    id: string;
    employee_id: string;
    employee_name?: string;
    area_id: string;
    area_name?: string;
    started_at: string;
    status: "in_progress" | "completed" | "incomplete";
    checkpoints_visited: number;
    checkpoints_total: number;
}

export interface ApiResponse<T> {
    status: string;
    message?: string;
    data: T;
}

export const patrolService = {
    // ============================================
    // Checkpoints
    // ============================================
    async getCheckpoints(): Promise<PatrolCheckpoint[]> {
        const response = await apiClient.get<ApiResponse<PatrolCheckpoint[]>>(
            "/patrol/checkpoints"
        );
        return response.data || [];
    },

    async createCheckpoint(data: {
        name: string;
        latitude: number;
        longitude: number;
        area_id: string;
    }): Promise<PatrolCheckpoint> {
        const response = await apiClient.post<ApiResponse<PatrolCheckpoint>>(
            "/patrol/checkpoints",
            data
        );
        if (!response.data) {
            throw new Error("Failed to create checkpoint");
        }
        return response.data;
    },

    async updateCheckpoint(
        id: string,
        data: {
            name?: string;
            latitude?: number;
            longitude?: number;
            area_id?: string;
        }
    ): Promise<PatrolCheckpoint> {
        const response = await apiClient.put<ApiResponse<PatrolCheckpoint>>(
            `/patrol/checkpoints/${id}`,
            data
        );
        if (!response.data) {
            throw new Error("Failed to update checkpoint");
        }
        return response.data;
    },

    async deleteCheckpoint(id: string): Promise<void> {
        await apiClient.delete<ApiResponse<void>>(`/patrol/checkpoints/${id}`);
    },

    // ============================================
    // Areas
    // ============================================
    async getAreas(): Promise<PatrolArea[]> {
        const response = await apiClient.get<ApiResponse<PatrolArea[]>>(
            "/patrol/areas"
        );
        return response.data || [];
    },

    async createArea(data: {
        name: string;
        description?: string;
    }): Promise<PatrolArea> {
        const response = await apiClient.post<ApiResponse<PatrolArea>>(
            "/patrol/areas",
            data
        );
        if (!response.data) {
            throw new Error("Failed to create area");
        }
        return response.data;
    },

    async updateArea(
        id: string,
        data: {
            name?: string;
            description?: string;
        }
    ): Promise<PatrolArea> {
        const response = await apiClient.put<ApiResponse<PatrolArea>>(
            `/patrol/areas/${id}`,
            data
        );
        if (!response.data) {
            throw new Error("Failed to update area");
        }
        return response.data;
    },

    async deleteArea(id: string): Promise<void> {
        await apiClient.delete<ApiResponse<void>>(`/patrol/areas/${id}`);
    },

    // ============================================
    // Assignments
    // ============================================
    async getAssignments(): Promise<PatrolAssignment[]> {
        const response = await apiClient.get<ApiResponse<PatrolAssignment[]>>(
            "/patrol/assignments"
        );
        return response.data || [];
    },

    async createAssignment(data: {
        employee_id: string;
        area_id: string;
        group_id?: string;
        shift_type: string;
        start_time: string;
        end_time: string;
    }): Promise<PatrolAssignment> {
        const response = await apiClient.post<ApiResponse<PatrolAssignment>>(
            "/patrol/assignments",
            data
        );
        if (!response.data) {
            throw new Error("Failed to create assignment");
        }
        return response.data;
    },

    async updateAssignment(
        id: string,
        data: {
            employee_id?: string;
            area_id?: string;
            group_id?: string;
            shift_type?: string;
            start_time?: string;
            end_time?: string;
        }
    ): Promise<PatrolAssignment> {
        const response = await apiClient.put<ApiResponse<PatrolAssignment>>(
            `/patrol/assignments/${id}`,
            data
        );
        if (!response.data) {
            throw new Error("Failed to update assignment");
        }
        return response.data;
    },

    async deleteAssignment(id: string): Promise<void> {
        await apiClient.delete<ApiResponse<void>>(
            `/patrol/assignments/${id}`
        );
    },

    // ============================================
    // Incidents
    // ============================================
    async getIncidents(): Promise<PatrolIncident[]> {
        const response = await apiClient.get<ApiResponse<PatrolIncident[]>>(
            "/patrol/incidents"
        );
        return response.data || [];
    },

    async createIncident(data: {
        patrol_id: string;
        checkpoint_id: string;
        employee_id: string;
        title: string;
        description: string;
        severity: "low" | "medium" | "high";
        photo_url?: string;
    }): Promise<PatrolIncident> {
        const response = await apiClient.post<ApiResponse<PatrolIncident>>(
            "/patrol/incident",
            data
        );
        if (!response.data) {
            throw new Error("Failed to create incident");
        }
        return response.data;
    },

    // ============================================
    // Checkpoint Reports
    // ============================================
    async getCheckpointReports(): Promise<CheckpointReport[]> {
        const response = await apiClient.get<ApiResponse<CheckpointReport[]>>(
            "/patrol/checkpoint-reports"
        );
        return response.data || [];
    },

    // ============================================
    // Active Patrols
    // ============================================
    async getActivePatrols(): Promise<ActivePatrol[]> {
        const response = await apiClient.get<ApiResponse<ActivePatrol[]>>(
            "/patrol/status/active"
        );
        return response.data || [];
    },
};
