export type User = {
    id: string;
    name: string;
    email: string;
    role: string;
    employeeId: string;
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
