import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getRepository, deleteRepository } from '../../api/repositories';
import { queryKeys } from '../../lib/queryKeys';
import { useAuthStore } from '../../store/auth';

export function RepositoryDetail({ owner, name }: { owner: string; name: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const { data: repo, isLoading, isError } = useQuery({
    queryKey: queryKeys.repositories.byName(name),
    queryFn: () => getRepository(owner, name),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRepository(owner, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.repositories.list });
      navigate('/dashboard', { replace: true });
    },
  });

  if (isLoading) return <p>Loading repository details...</p>;
  if (isError || !repo) return <p role="alert">Failed to load repository details or it does not exist.</p>;

  const currentHost = window.location.host;
  // Based on rules: SSH uses port 2222, HTTPS uses standard domain route
  const sshUrl = `ssh://git@${currentHost}:2222/git-repos/${owner}/${name}.git`;
  const httpsUrl = `${window.location.protocol}//${currentHost}/${owner}/${name}.git`;

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2>{owner} / {name} <span style={{ fontSize: '0.85rem', padding: '0.2rem 0.5rem', border: '1px solid #ccc', borderRadius: '12px', marginLeft: '0.5rem' }}>{repo.isPrivate ? 'Private' : 'Public'}</span></h2>
          {repo.description && <p style={{ fontSize: '1.1rem', color: '#555' }}>{repo.description}</p>}
        </div>
        {user?.username === owner && (
          <div>
            {!showConfirmDelete ? (
              <button 
                onClick={() => setShowConfirmDelete(true)}
                style={{ backgroundColor: '#fff', color: 'red', border: '1px solid red' }}
              >
                Delete repository
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', border: '1px solid red', padding: '0.5rem', borderRadius: '4px' }}>
                <span>Are you sure?</span>
                <button 
                  onClick={() => deleteMutation.mutate()} 
                  disabled={deleteMutation.isPending}
                  style={{ backgroundColor: 'red', color: '#fff', border: 'none' }}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Yes, delete'}
                </button>
                <button 
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
        <h3>Clone via HTTPS</h3>
        <code style={{ display: 'block', padding: '0.5rem', background: '#f5f5f5', marginBottom: '0.5rem' }}>
          git clone {httpsUrl}
        </code>
        <p style={{ fontSize: '0.85rem', color: '#666' }}>
          Note: You must use a Personal Access Token (PAT) for HTTPS authentication. Your username is <strong>{user?.username}</strong> and password is your PAT.
        </p>

        <h3 style={{ marginTop: '1.5rem' }}>Clone via SSH</h3>
        <code style={{ display: 'block', padding: '0.5rem', background: '#f5f5f5', marginBottom: '0.5rem' }}>
          git clone {sshUrl}
        </code>
        <p style={{ fontSize: '0.85rem', color: '#666' }}>
          Note: Ensure your SSH public key is added in your account settings.
        </p>
      </div>
    </section>
  );
}
