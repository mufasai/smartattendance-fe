// ============================================
// API Client with Error Handling
// ============================================

import config from "../config/env";

export class ApiError extends Error {
    constructor(
        public status: number,
        public message: string,
        public errors?: Record<string, string[]>
    ) {
        super(message);
        this.name = "ApiError";
    }
}

interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | boolean>;
}

class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = config.apiUrl;
    }

    private async request<T>(
        endpoint: string,
        options: RequestOptions = {}
    ): Promise<T> {
        const { params, ...fetchOptions } = options;

        // Build URL with query params
        let url = `${this.baseUrl}${endpoint}`;
        if (params) {
            const queryString = new URLSearchParams(
                Object.entries(params).reduce((acc, [key, value]) => {
                    acc[key] = String(value);
                    return acc;
                }, {} as Record<string, string>)
            ).toString();
            if (queryString) {
                url += `?${queryString}`;
            }
        }

        // Default headers
        const headers: HeadersInit = {
            "Content-Type": "application/json",
            ...fetchOptions.headers,
        };

        // Add auth token if available
        const token = localStorage.getItem("auth_token");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                headers,
            });

            // Parse response
            const data = await response.json();

            // Handle error responses
            if (!response.ok) {
                throw new ApiError(
                    response.status,
                    data.message || "An error occurred",
                    data.errors
                );
            }

            return data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            // Network or other errors
            throw new ApiError(
                0,
                error instanceof Error ? error.message : "Network error"
            );
        }
    }

    async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
        return this.request<T>(endpoint, { method: "GET", params });
    }

    async post<T>(endpoint: string, body?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: "POST",
            body: JSON.stringify(body),
        });
    }

    async put<T>(endpoint: string, body?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: "PUT",
            body: JSON.stringify(body),
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: "DELETE" });
    }
}

export const apiClient = new ApiClient();
