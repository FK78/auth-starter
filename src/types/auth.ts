export interface AuthUser {
  id: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}