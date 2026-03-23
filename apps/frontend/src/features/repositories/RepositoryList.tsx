import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listRepositories } from '../../api/repositories';
import { queryKeys } from '../../lib/queryKeys';

export function RepositoryList() {
  const {
    data: repos,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.repositories.list,
    queryFn: listRepositories,
  });

  if (isLoading) return <p>Loading repositories...</p>;
  if (isError) return <p role="alert">Failed to load repositories.</p>;

  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h2>Your Repositories</h2>
        <Link to="/repositories/new">
          <button type="button">New repository</button>
        </Link>
      </div>

      {!repos || repos.length === 0 ? (
        <p>You don't have any repositories yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {repos.map((repo) => (
            <li
              key={repo.id}
              style={{
                border: '1px solid #ccc',
                padding: '1rem',
                marginBottom: '0.5rem',
                borderRadius: '4px',
              }}
            >
              <h3>
                <Link to={`/repositories/${repo.name}`}>{repo.name}</Link>
              </h3>
              {repo.description && <p>{repo.description}</p>}
              <div
                style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  gap: '1rem',
                  fontSize: '0.85rem',
                  color: '#666',
                }}
              >
                <span>{repo.isPrivate ? 'Private' : 'Public'}</span>
                <span>Created {new Date(repo.createdAt).toLocaleDateString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
