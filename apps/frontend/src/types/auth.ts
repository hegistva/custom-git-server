export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
