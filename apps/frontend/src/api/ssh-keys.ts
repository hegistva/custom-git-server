import { apiClient } from '../lib/api';
import type { AddSshKeyPayload, SshKey } from '../types/ssh-keys';

export const sshKeysApi = {
  list: async () => {
    return apiClient.get('ssh-keys').json<SshKey[]>();
  },
  add: async (payload: AddSshKeyPayload) => {
    return apiClient.post('ssh-keys', { json: payload }).json<SshKey>();
  },
  delete: async (id: string) => {
    return apiClient.delete(`ssh-keys/${id}`);
  },
};
