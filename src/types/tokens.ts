export type RevokedReason = "reuse_detected" | "logout" | "admin_revoked";

export interface RefreshToken {
    id: string;
    refreshTokenHash: string;
    userId: string;
    tokenFamilyId: string;
    replacedById?: string | null;
    revokedAt: Date | null;
    revokedReason: RevokedReason | null;
    expiresAt: Date;
    createdAt: Date;
}