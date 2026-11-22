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
