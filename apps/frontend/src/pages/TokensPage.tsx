import { Link } from 'react-router-dom';
import { TokensList } from '../features/tokens/TokensList';
import { GenerateTokenForm } from '../features/tokens/GenerateTokenForm';

export default function TokensPage() {
  return (
    <main>
      <nav style={{ marginBottom: '2rem' }}>
        <Link to="/dashboard">← Back to Dashboard</Link>
      </nav>
      <h1>Personal Access Tokens</h1>
      <p>Tokens you have generated that can be used to access the API.</p>
      
      <GenerateTokenForm />
      <hr style={{ margin: '2rem 0' }} />
      <TokensList />
    </main>
  );
}
