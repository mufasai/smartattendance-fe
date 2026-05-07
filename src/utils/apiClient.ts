// ============================================
// API Client with Error Handling & JWT Support
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
    _retry?: boolean; // Internal flag to prevent infinite retry loop
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
        const { params, _retry, ...fetchOptions } = options;

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

        // Add auth token if available (use jwt_token key to match authService)
        const token = localStorage.getItem("jwt_token");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
            console.log('[apiClient] Adding Authorization header:', `Bearer ${token.substring(0, 20)}...`);
        } else {
            console.warn('[apiClient] No JWT token found in localStorage');
        }

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                headers,
            });

            // Handle 401 Unauthorized - try to refresh token
            if (response.status === 401 && !_retry) {
                console.log('401 Unauthorized - attempting token refresh');
                
                // Try to refresh token
                const refreshed = await this.refreshToken();
                
                if (refreshed) {
                    // Retry original request with new token
                    return this.request<T>(endpoint, { ...options, _retry: true });
                } else {
                    // Refresh failed, redirect to login
                    this.handleAuthFailure();
                    throw new ApiError(401, "Session expired. Please login again.");
                }
            }

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

    /**
     * Refresh JWT token
     */
    private async refreshToken(): Promise<boolean> {
        try {
            const oldToken = localStorage.getItem("jwt_token");
            if (!oldToken) return false;

            const response = await fetch(`${this.baseUrl}/api/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: oldToken }),
            });

            if (!response.ok) return false;

            const data = await response.json();

            if (data.status === 'success' && data.token) {
                // Save new token
                localStorage.setItem('jwt_token', data.token);
                localStorage.setItem('user_info', JSON.stringify({
                    nik: data.nik,
                    name: data.name,
                    role: data.role,
                }));
                console.log('Token refreshed successfully');
                return true;
            }

            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }

    /**
     * Handle authentication failure
     */
    private handleAuthFailure(): void {
        // Clear tokens
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_info');
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
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

    async patch<T>(endpoint: string, body?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: "PATCH",
            body: JSON.stringify(body),
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: "DELETE" });
    }
}

export const apiClient = new ApiClient();
