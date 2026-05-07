// ============================================
// Employee Service
// ============================================

import { apiClient } from "../utils/apiClient";

export interface Employee {
    id: string;
    nik: string;
    full_name: string;
    email?: string;
    phone?: string;
    department?: string;
    position?: string;
    role: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T> {
    status: string;
    message?: string;
    data: T;
}

export const employeeService = {
    /**
     * Get all employees
     */
    async getAll(filters?: {
        department?: string;
        role?: string;
        is_active?: boolean;
    }): Promise<Employee[]> {
        const response = await apiClient.get<ApiResponse<Employee[]>>(
            "/employees",
            filters
        );
        return response.data || [];
    },

    /**
     * Get employee by ID
     */
    async getById(id: string): Promise<Employee> {
        const response = await apiClient.get<ApiResponse<Employee>>(
            `/employees/${id}`
        );
        if (!response.data) {
            throw new Error("Employee not found");
        }
        return response.data;
    },

    /**
     * Get employee by NIK
     */
    async getByNik(nik: string): Promise<Employee> {
        const response = await apiClient.get<ApiResponse<Employee>>(
            `/employees/nik/${nik}`
        );
        if (!response.data) {
            throw new Error("Employee not found");
        }
        return response.data;
    },

    /**
     * Create new employee
     */
    async create(data: {
        nik: string;
        full_name: string;
        email?: string;
        phone?: string;
        department?: string;
        position?: string;
        role: string;
        password: string;
    }): Promise<Employee> {
        const response = await apiClient.post<ApiResponse<Employee>>(
            "/employees",
            data
        );
        if (!response.data) {
            throw new Error("Failed to create employee");
        }
        return response.data;
    },

    /**
     * Update employee
     */
    async update(
        id: string,
        data: {
            full_name?: string;
            email?: string;
            phone?: string;
            department?: string;
            position?: string;
            role?: string;
        }
    ): Promise<Employee> {
        const response = await apiClient.put<ApiResponse<Employee>>(
            `/employees/${id}`,
            data
        );
        if (!response.data) {
            throw new Error("Failed to update employee");
        }
        return response.data;
    },

    /**
     * Delete employee
     */
    async delete(id: string): Promise<void> {
        await apiClient.delete<ApiResponse<void>>(`/employees/${id}`);
    },

    /**
     * Toggle employee active status
     */
    async toggleActive(id: string): Promise<Employee> {
        const response = await apiClient.patch<ApiResponse<Employee>>(
            `/employees/${id}/toggle-active`,
            {}
        );
        if (!response.data) {
            throw new Error("Failed to toggle employee status");
        }
        return response.data;
    },

    /**
     * Bulk update attendance requirements
     */
    async bulkUpdateAttendance(data: {
        employee_niks: string[];
        attendance_requirement: any;
    }): Promise<void> {
        await apiClient.put<ApiResponse<void>>(
            "/employees/bulk-attendance",
            data
        );
    },

    /**
     * Bulk create employees
     */
    async bulkCreate(data: { employees: any[] }): Promise<void> {
        await apiClient.post<ApiResponse<void>>("/employees/bulk", data);
    },
};
