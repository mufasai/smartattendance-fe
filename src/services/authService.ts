// ============================================
// Authentication Service
// ============================================

import { apiClient } from '../utils/apiClient';

export interface LoginRequest {
  nik: string;
  password: string;
}

export interface LoginResponse {
  status: string;
  message: string;
  token?: string;
  nik?: string;
  name?: string;
  role?: string;
}

export interface RefreshTokenRequest {
  token: string;
}

export interface UserInfo {
  nik: string;
  name: string;
  role: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'jwt_token';
  private readonly USER_KEY = 'user_info';

  /**
   * Login user and save token
   */
  async login(nik: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/login', {
      nik,
      password,
    });

    if (response.status === 'success' && response.token) {
      this.saveToken(
        response.token,
        response.nik!,
        response.name!,
        response.role!
      );
    }

    return response;
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const oldToken = this.getToken();
      if (!oldToken) return false;

      const response = await apiClient.post<LoginResponse>('/api/refresh-token', {
        token: oldToken,
      });

      if (response.status === 'success' && response.token) {
        this.saveToken(
          response.token,
          response.nik!,
          response.name!,
          response.role!
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Save token and user info to localStorage
   */
  saveToken(token: string, nik: string, name: string, role: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(
      this.USER_KEY,
      JSON.stringify({ nik, name, role })
    );
  }

  /**
   * Get JWT token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get user info from localStorage
   */
  getUserInfo(): UserInfo | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Clear token and user info (logout)
   */
  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Logout user
   */
  logout(): void {
    this.clearToken();
  }

  /**
   * Check if token is about to expire and refresh if needed
   */
  async ensureValidToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decode JWT to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();

      // If expires in less than 1 hour, refresh
      if (expiresAt - now < 3600000) {
        return await this.refreshToken();
      }

      return true;
    } catch (error) {
      console.error('Failed to check token expiration:', error);
      return false;
    }
  }

  /**
   * Get user role
   */
  getUserRole(): string | null {
    const userInfo = this.getUserInfo();
    return userInfo?.role || null;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    const role = this.getUserRole();
    return role === 'admin' || role === 'manager';
  }
}

export const authService = new AuthService();
