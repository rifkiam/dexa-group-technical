import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import type { Attendance, AttendanceListResponse, AuthResponse } from '../types/types';

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
    async responded(response) {
        return await response.json();
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


// Attendance requests
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
    const res = await backendApi.Post<Response<{ imageKey: string }>>(
        '/attendance/photo',
        {
            contentType: file.type,
            data,
        },
        { headers: { Authorization: `Bearer ${token}` } }
    );

    return res;
}

export async function createAttendance(imageKey: string, token: string) {
    const res = await backendApi.Post<Response<Attendance>>(
        '/attendance',
        { imageKey },
        { headers: { Authorization: `Bearer ${token}` } }
    );

    return res;
}

export async function getAttendanceList(token: string) {
    const res = await backendApi.Get<Response<AttendanceListResponse>>('/attendance', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res;
}
