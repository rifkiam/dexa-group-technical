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

async function attendanceRequest<T>(path: string, token: string, body: unknown): Promise<Response<T>> {
    if (!API_URL) throw new Error('Attendance API URL is not configured');
    const response = await fetch(`${API_URL.replace(/\/$/, '')}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });
    return await response.json() as Response<T>;
}

function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read the selected photo'));
        reader.onload = () => {
            const result = reader.result;
            if (typeof result !== 'string') {
                reject(new Error('Could not read the selected photo'));
                return;
            }
            resolve(result.slice(result.indexOf(',') + 1));
        };
        reader.readAsDataURL(file);
    });
}

export async function uploadAttendancePhoto(file: File, token: string) {
    const data = await readFileAsBase64(file);
    const response = await attendanceRequest<{ imageKey: string }>('/attendance/photo', token, {
        contentType: file.type,
        data,
    });
    if (response.statusCode < 200 || response.statusCode >= 300 || !response.data) {
        throw new Error(response.message ?? 'Photo upload failed');
    }
    return response.data;
}

export async function createAttendance(imageKey: string, token: string) {
    const response = await attendanceRequest('/attendance', token, { imageKey });
    if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error(response.message ?? 'Attendance submission failed');
    }
    return response.data;
}
