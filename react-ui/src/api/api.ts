import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import type { AuthResponse } from '../types/types';

const API_URL = import.meta.env.VITE_ATTENDANCE_API_URL;
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL;

export type Response<T> = {
    statusCode: number;
    data?: T;
    message?: string;
    error?: string;
}

export const backendApi = createAlova({
    baseURL: API_URL,
    requestAdapter: adapterFetch(),
    beforeRequest(method) {
        method.config.headers['Content-Type'] = 'application/json';
    },
});

export const authApi = createAlova({
    baseURL: AUTH_API_URL,
    requestAdapter: adapterFetch(),
    beforeRequest(method) {
        method.config.headers['Content-Type'] = 'application/json';
    },
    async responded(response) {
        return await response.json();
    },
});

export async function login(email: string, password: string) {
    const res = await authApi.Post<Response<AuthResponse>>('/login', {
        email,
        password,
    });
    return res;
}

export async function register(name: string, email: string, password: string, employeeId: string) {
    const res = await authApi.Post<Response<AuthResponse>>('/register', {
        name,
        email,
        employeeId,
        password,
    });
    return res;
}



export async function logout(refreshToken: string) {
    const res = await authApi.Post<Response<{ message: string }>>(
        '/logout',
        {
            refreshToken,
        }
    );
    return res;
}