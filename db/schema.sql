CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL
);

CREATE TABLE todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
);

CREATE TABLE refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      jti UUID NOT NULL UNIQUE,
      token_hash TEXT NOT NULL UNIQUE,
      user_id UUID NOT NULL REFERENCES users(id),
      token_family_id UUID NOT NULL,
      replaced_by_id UUID REFERENCES refresh_tokens(id),
      revoked_at TIMESTAMPZ,
      expires_at TIMESTAMPZ NOT NULL,
      created_at TIMESTAMPZ DEFAULT NOW()
);