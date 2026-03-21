import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useLocation } from 'react-router-dom'

import { login } from '@/api/auth'
import { useAuthStore } from '@/store/auth'
import { loginSchema, type LoginInput } from '@/lib/schemas/auth'
import type { ApiError } from '@/types/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const setTokens = useAuthStore((state) => state.setTokens)
  const setUser = useAuthStore((state) => state.setUser)

  const { register, handleSubmit, formState, setError } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const mutation = useMutation({
    mutationFn: (values: LoginInput) => login(values.username, values.password),
    onSuccess: (data) => {
      setTokens(data.accessToken)
      setUser(data.user)
      navigate(from, { replace: true })
    },
    onError: (err: ApiError) => {
      if (err.status === 401) {
        setError('root', { message: 'Invalid username or password' })
      } else {
        setError('root', { message: err.message ?? 'Login failed. Please try again.' })
      }
    },
  })

  const onSubmit = (values: LoginInput) => {
    mutation.mutate(values)
  }

  return (
    <main>
      <h1>Sign in to your account</h1>

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
          <label htmlFor="password">Password</label>
          <input
            id="password"
            aria-label="Password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
          {formState.errors.password && (
            <p role="alert">{formState.errors.password.message}</p>
          )}
        </div>

        {formState.errors.root && (
          <p role="alert">{formState.errors.root.message}</p>
        )}

        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p>
        Don&apos;t have an account?{' '}
        <Link to="/register">Create one</Link>
      </p>
    </main>
  )
}
