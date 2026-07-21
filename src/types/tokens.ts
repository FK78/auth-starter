export type RevokedReason = "reuse_detected" | "logout" | "admin_revoked";

export interface RefreshToken {
    id: string;
    jti: string;
    tokenHash: string;
    userId: string;
    tokenFamilyId: string;
    replacedById?: string | null;
    revokedAt: Date | null;
    revokedReason: RevokedReason | null;
    expiresAt: Date;
    createdAt: Date;
}