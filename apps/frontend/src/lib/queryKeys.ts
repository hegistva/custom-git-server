export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  sshKeys: {
    list: ['ssh-keys'] as const,
  },
  tokens: {
    list: ['tokens'] as const,
  },
  repositories: {
    list: ['repositories'] as const,
    byName: (name: string) => ['repositories', name] as const,
  },
}
