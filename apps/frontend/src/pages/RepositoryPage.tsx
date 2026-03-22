import { Link, useParams } from 'react-router-dom';
import { RepositoryDetail } from '@/features/repositories/RepositoryDetail';
import { useAuthStore } from '@/store/auth';

export default function RepositoryPage() {
  const { name } = useParams<{ name: string }>();
  // Assuming the owner is the current user since it's MVP
  const user = useAuthStore((state) => state.user);

  if (!name || !user) return <p>Invalid repository</p>;

  return (
    <main>
      <nav style={{ marginBottom: '2rem' }}>
        <ul>
          <li><Link to="/dashboard">Back to Dashboard</Link></li>
        </ul>
      </nav>
      <RepositoryDetail owner={user.username} name={name} />
    </main>
  );
}
