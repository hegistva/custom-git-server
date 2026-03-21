import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { registerSchema, type RegisterInput } from '@/lib/schemas/auth'

export default function RegisterPage() {
  const { register, handleSubmit, formState } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = (_values: RegisterInput) => {
    return undefined
  }

  return (
    <main>
      <h1>Register</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label htmlFor="username">Username</label>
        <input id="username" aria-label="Username" {...register('username')} />
        <p>{formState.errors.username?.message}</p>

        <label htmlFor="email">Email</label>
        <input id="email" aria-label="Email" type="email" {...register('email')} />
        <p>{formState.errors.email?.message}</p>

        <label htmlFor="password">Password</label>
        <input id="password" aria-label="Password" type="password" {...register('password')} />
        <p>{formState.errors.password?.message}</p>

        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          aria-label="Confirm password"
          type="password"
          {...register('confirmPassword')}
        />
        <p>{formState.errors.confirmPassword?.message}</p>

        <button type="submit" disabled={formState.isSubmitting}>
          Create account
        </button>
      </form>
    </main>
  )
}
