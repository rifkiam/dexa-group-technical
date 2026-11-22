type AccessTokenPayload = {
    role?: string;
    exp?: number;
};

export function decodeAccessToken(token?: string): AccessTokenPayload | null {
    if (!token) return null;

    try {
        const payload = token.split('.')[1];
        if (!payload) return null;

        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(base64)) as AccessTokenPayload;
        if (decoded.exp && decoded.exp * 1000 <= Date.now()) return null;
        return decoded;
    } catch {
        return null;
    }
}