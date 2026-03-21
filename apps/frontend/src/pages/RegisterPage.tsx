import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { register as registerUser } from '@/api/auth'
import { useAuthStore } from '@/store/auth'
import { registerSchema, type RegisterInput } from '@/lib/schemas/auth'
import type { ApiError } from '@/types/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((state) => state.setTokens)
  const setUser = useAuthStore((state) => state.setUser)

  const { register, handleSubmit, formState, setError } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const mutation = useMutation({
    mutationFn: (values: RegisterInput) =>
      registerUser({ username: values.username, email: values.email, password: values.password }),
    onSuccess: (data) => {
      setTokens(data.accessToken)
      setUser(data.user)
      navigate('/dashboard', { replace: true })
    },
    onError: (err: ApiError) => {
      if (err.status === 409 && err.field === 'username') {
        setError('username', { message: 'This username is already taken' })
      } else if (err.status === 409 && err.field === 'email') {
        setError('email', { message: 'This email is already registered' })
      } else {
        setError('root', { message: err.message ?? 'Registration failed. Please try again.' })
      }
    },
  })

  const onSubmit = (values: RegisterInput) => {
    mutation.mutate(values)
  }

  return (
    <main>
      <h1>Create an account</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            aria-label="Username"
            autoComplete="username"
            {...register('username')}
          />
          {formState.errors.username && (
            <p role="alert">{formState.errors.username.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            aria-label="Email"
            type="email"
            autoComplete="email"
            {...register('email')}
          />
          {formState.errors.email && (
            <p role="alert">{formState.errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            aria-label="Password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
          {formState.errors.password && (
            <p role="alert">{formState.errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            aria-label="Confirm password"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
          {formState.errors.confirmPassword && (
            <p role="alert">{formState.errors.confirmPassword.message}</p>
          )}
        </div>

        {formState.errors.root && (
          <p role="alert">{formState.errors.root.message}</p>
        )}

        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p>
        Already have an account?{' '}
        <Link to="/login">Sign in</Link>
      </p>
    </main>
  )
}
