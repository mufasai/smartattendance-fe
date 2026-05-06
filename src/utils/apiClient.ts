// ============================================
// API Client with Error Handling
// ============================================

import config from "../config/env";

export class ApiError extends Error {
    status: number;
    message: string;
    errors?: Record<string, string[]>;

    constructor(
        status: number,
        message: string,
        errors?: Record<string, string[]>
    ) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.message = message;
        this.errors = errors;
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
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        // Merge existing headers
        if (fetchOptions.headers) {
            const existingHeaders = new Headers(fetchOptions.headers);
            existingHeaders.forEach((value, key) => {
                headers[key] = value;
            });
        }

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

            // Get response text first
            const text = await response.text();
            
            // Try to parse as JSON
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                // If JSON parsing fails, treat as plain text error
                if (!response.ok) {
                    throw new ApiError(
                        response.status,
                        text || "An error occurred"
                    );
                }
                data = {};
            }

            // Handle error responses
            if (!response.ok) {
                throw new ApiError(
                    response.status,
                    data.message || text || "An error occurred",
                    data.errors
                );
            }

            return data;
        } catch (error: unknown) {
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
