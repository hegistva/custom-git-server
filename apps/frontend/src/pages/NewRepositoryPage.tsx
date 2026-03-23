import { Link } from 'react-router-dom';
import { CreateRepositoryForm } from '@/features/repositories/CreateRepositoryForm';

export default function NewRepositoryPage() {
  return (
    <main>
      <nav style={{ marginBottom: '2rem' }}>
        <ul>
          <li>
            <Link to="/dashboard">Back to Dashboard</Link>
          </li>
        </ul>
      </nav>
      <h1>Create a new repository</h1>
      <p style={{ marginBottom: '2rem' }}>
        A repository contains all project files, including the revision history.
      </p>
      <CreateRepositoryForm />
    </main>
  );
}
