import { pool } from "../db/db.ts";

export interface RefreshToken {
  id: string;
  jti: string;
  tokenHash: string;
  userId: string;
  tokenFamilyId: string;
  replacedById?: string | null;
  revokedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
}

interface RefreshTokenRow {
  id: string;
  jti: string;
  token_hash: string;
  user_id: string;
  token_family_id: string;
  replaced_by_id: string | null;
  issued_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

const mapRow = (row: RefreshTokenRow): RefreshToken => ({
  id: row.id,
  jti: row.jti,
  tokenHash: row.token_hash,
  userId: row.user_id,
  tokenFamilyId: row.token_family_id,
  replacedById: row.replaced_by_id,
  revokedAt: row.revoked_at,
  expiresAt: row.expires_at,
  createdAt: row.created_at,
});

interface SaveRefreshTokenInput {
  jti: string;
  tokenHash: string;
  userId: string;
  tokenFamilyId: string;
  expiresAt: Date;
}

export const saveRefreshToken = async (
  input: SaveRefreshTokenInput,
): Promise<RefreshToken> => {
  const result = await pool.query(
    "INSERT INTO refresh_tokens(jti, token_hash, user_id, token_family_id, replaced_by_id, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [
      input.jti,
      input.tokenHash,
      input.userId,
      input.tokenFamilyId,
      input.expiresAt,
    ],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to insert refresh token");
  }
  return mapRow(row);
};

export const findRefreshTokenByJti = async (
  jti: string,
): Promise<RefreshToken | null> => {
  const result = await pool.query<RefreshTokenRow>(
    `SELECT * FROM refresh_tokens WHERE jti = $1`,
    [jti],
  );
  const row = result.rows[0];
  return row ? mapRow(row) : null;
};

export const markTokenReplaced = async (
  oldTokenId: string,
  newTokenId: string,
): Promise<void> => {
  await pool.query(
    `UPDATE refresh_tokens SET repalced_by_id = $2, revoked_at = now() WHERE id = $1`,
    [oldTokenId, newTokenId],
  );
};
