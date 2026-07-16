CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

CREATE TABLE todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jti UUID NOT NULL UNIQUE,
    token_hash TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id),
    token_family_id UUID NOT NULL,
    replaced_by_id UUID REFERENCES refresh_tokens(id),
    revoked_reason TEXT CHECK (
        revoked_reason IN ('reuse_detected', 'logout', 'admin_revoked')
    ),
    revoked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        revoked_reason IS NULL
        OR revoked_at IS NOT NULL
    )
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

CREATE INDEX idx_refresh_tokens_token_family_id ON refresh_tokens(token_family_id);

CREATE UNIQUE INDEX one_active_token_per_family ON refresh_tokens (token_family_id)
WHERE
    revoked_at IS NULL;