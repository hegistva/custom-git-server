export interface Token {
  id: string;
  label: string;
  tokenPrefix: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface GenerateTokenPayload {
  label: string;
}

export interface GenerateTokenResponse {
  token: Token;
  rawToken: string;
}
