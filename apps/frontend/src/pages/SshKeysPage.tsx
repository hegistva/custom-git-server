import { SshKeyList } from '../features/ssh-keys/SshKeyList';
import { AddSshKeyForm } from '../features/ssh-keys/AddSshKeyForm';

export default function SshKeysPage() {
  return (
    <main>
      <h1>SSH Keys</h1>
      <p>Manage your public SSH keys to authenticate via SSH.</p>
      <SshKeyList />
      <AddSshKeyForm />
    </main>
  )
}
