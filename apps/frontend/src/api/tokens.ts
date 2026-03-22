import { apiClient } from '../lib/api';
import type { GenerateTokenPayload, GenerateTokenResponse, Token } from '../types/tokens';

export const tokensApi = {
  list: async () => {
    return apiClient.get('tokens').json<Token[]>();
  },
  generate: async (payload: GenerateTokenPayload) => {
    return apiClient.post('tokens', { json: payload }).json<GenerateTokenResponse>();
  },
  revoke: async (id: string) => {
    return apiClient.delete(`tokens/${id}`);
  },
};
