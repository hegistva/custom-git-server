import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { loginSchema, type LoginInput } from '@/lib/schemas/auth'

export default function LoginPage() {
  const { register, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (_values: LoginInput) => {
    return undefined
  }

  return (
    <main>
      <h1>Login</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="username">Username</label>
        <input id="username" aria-label="Username" {...register('username')} />
        <p>{formState.errors.username?.message}</p>

        <label htmlFor="password">Password</label>
        <input id="password" aria-label="Password" type="password" {...register('password')} />
        <p>{formState.errors.password?.message}</p>

        <button type="submit" disabled={formState.isSubmitting}>
          Sign in
        </button>
      </form>
    </main>
  )
}
