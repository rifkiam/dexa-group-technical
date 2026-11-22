type AccessTokenPayload = {
    role: string;
    exp: number;
};

export function decodeAccessToken(token?: string): AccessTokenPayload | null {
    if (!token) return null;

    try {
        const payload = token.split('.')[1];
        if (!payload) return null;

        let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        base64 += '='.repeat((4 - (base64.length % 4)) % 4);
        const binary = atob(base64);
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        const decoded = JSON.parse(new TextDecoder().decode(bytes)) as AccessTokenPayload;
        if (
            typeof decoded.role !== 'string' ||
            typeof decoded.exp !== 'number' ||
            decoded.exp * 1000 <= Date.now()
        ) return null;
        return decoded;
    } catch {
        return null;
    }
}
