export type User = {
    id: string;
    name: string;
    email: string;
    role: string;
    employeeId: string;
}

export type ManagedUser = User & {
    createdAt: string;
    updatedAt: string;
}

export type UserFormData = {
    name: string;
    email: string;
    employeeId: string;
    role: 'user' | 'admin';
    password?: string;
}

export type AuthResponse = {
    user: User;
    accessToken: string;
    expiresIn: number;
}

export type Attendance = {
    id: string;
    userId: string;
    email: string;
    employeeId: string;
    imageKey: string;
    createdAt: string;
    updatedAt: string;
}

export type AttendanceListResponse = {
    data: Attendance[];
    total: number;
    page: number;
    limit: number;
}
