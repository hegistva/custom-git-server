import { Link } from 'react-router-dom';
import { SshKeyList } from '../features/ssh-keys/SshKeyList';
import { AddSshKeyForm } from '../features/ssh-keys/AddSshKeyForm';

export default function SshKeysPage() {
  return (
    <main>
      <nav style={{ marginBottom: '2rem' }}>
        <Link to="/dashboard">← Back to Dashboard</Link>
      </nav>
      <h1>SSH Keys</h1>
      <p>Manage your public SSH keys to authenticate via SSH.</p>
      <SshKeyList />
      <AddSshKeyForm />
    </main>
  );
}
