export interface SshKey {
  id: string;
  label: string;
  fingerprint: string;
  createdAt: string;
}

export interface AddSshKeyPayload {
  label: string;
  publicKey: string;
}
