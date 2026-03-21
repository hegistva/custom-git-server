import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <main>
      <h1>Custom Git Hosting</h1>
      <p>Manage your repositories, SSH keys, and personal access tokens.</p>
      <nav>
        <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
      </nav>
    </main>
  )
}
