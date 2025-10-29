import { FormEvent, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { getRememberedEmail, isAuthenticated, markAuthenticated, setRememberedEmail } from '../lib/auth'
import './Login.css'

const ICONS = {
  manager: String.fromCodePoint(0x1f9d1, 0x200d, 0x1f4bc),
  handWave: String.fromCodePoint(0x1f44b),
  cart: String.fromCodePoint(0x1f6d2),
  group: String.fromCodePoint(0x1f465),
  downArrow: String.fromCodePoint(0x2193),
  facebook: String.fromCodePoint(0x1f4d8),
  twitter: String.fromCodePoint(0x1f426),
  github: String.fromCodePoint(0x1f419),
  google: String.fromCodePoint(0x1f50d),
  eye: String.fromCodePoint(0x1f441, 0xfe0f),
  monkey: String.fromCodePoint(0x1f648),
} as const

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const redirectTarget = from && from !== '/login' ? from : '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const redirectTimer = useRef<number | null>(null)

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(redirectTarget, { replace: true })
    }
  }, [navigate, redirectTarget])

  useEffect(() => {
    const storedEmail = getRememberedEmail()
    if (storedEmail) {
      setEmail(storedEmail)
      setRemember(true)
    }

    return () => {
      if (redirectTimer.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(redirectTimer.current)
        redirectTimer.current = null
      }
    }
  }, [])

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Please enter both email and password.')
      return
    }

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (remember) {
        setRememberedEmail(trimmedEmail)
      } else {
        setRememberedEmail(null)
      }
      markAuthenticated()

      console.log('Login attempt:', {
        email: trimmedEmail,
        remember,
        redirectTo: redirectTarget,
      })

      setSuccess('Login successful! Redirecting to your dashboard...')
      if (typeof window !== 'undefined') {
        redirectTimer.current = window.setTimeout(() => {
          navigate(redirectTarget, { replace: true })
          redirectTimer.current = null
        }, 700)
      }
    } catch (err) {
      console.error('Login failed', err)
      setError('Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <section className="login-left" aria-hidden="true">
          <div className="login-logo">
            <div className="login-logo-icon">S</div>
            <span>Stock Control</span>
          </div>

          <div className="login-illustration">
            <div
              className="login-character"
              role="img"
              aria-label="Shop manager illustration"
            >
              {ICONS.manager}
            </div>

            <div className="login-stats-grid">
              <article className="login-stat-card">
                <div className="login-stat-header">
                  <div
                    className="login-stat-icon login-stat-icon--blue"
                    aria-hidden="true"
                  >
                    {ICONS.cart}
                  </div>
                  <div className="login-stat-change login-stat-change--up">
                    +22%
                  </div>
                </div>
                <div className="login-stat-value">155k</div>
                <div className="login-stat-label">Total Orders</div>
                <div className="login-stat-label" style={{ fontSize: 11, marginTop: 5 }}>
                  Last 4 months
                </div>
              </article>

              <article className="login-stat-card">
                <div className="login-stat-header">
                  <div
                    className="login-stat-icon login-stat-icon--purple"
                    aria-hidden="true"
                  >
                    {ICONS.group}
                  </div>
                  <div className="login-stat-change login-stat-change--down">
                    {`${ICONS.downArrow} 8%`}
                  </div>
                </div>
                <div className="login-stat-value">2,856</div>
                <div className="login-stat-label">New Customers</div>
              </article>

              <article className="login-stat-card login-stat-card--full">
                <div className="login-stat-value">
                  $38.5k{' '}
                  <span className="login-stat-change login-stat-change--up">
                    +62%
                  </span>
                </div>
                <div className="login-stat-label">Sessions</div>
                <div className="login-chart">
                  <svg viewBox="0 0 200 60" role="presentation">
                    <polyline
                      points="0,50 40,45 80,35 120,25 160,20 200,10"
                      fill="none"
                      stroke="#667eea"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="200" cy="10" r="4" fill="#667eea" />
                  </svg>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="login-right">
          <div className="login-welcome">
            <h1>
              Welcome to Stock Control!{' '}
              <span role="img" aria-label="Waving hand">
                {ICONS.handWave}
              </span>
            </h1>
            <p>Please sign in to your account to continue.</p>
          </div>

          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="login-form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="login-input"
                placeholder="Enter your email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="password">Password</label>
              <div className="login-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? ICONS.monkey : ICONS.eye}
                </button>
              </div>
            </div>

            <div className="login-form-footer">
              <label className="login-remember" htmlFor="remember">
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  disabled={isSubmitting}
                />
                Remember me
              </label>
              <a className="login-forgot-link" href="#forgot">
                Forgot password?
              </a>
            </div>

            <button type="submit" className="login-button" disabled={isSubmitting}>
              {isSubmitting ? 'Signing you in...' : 'Log In'}
            </button>
          </form>

          <div className="login-signup">
            New on our platform? <a href="#signup">Create an account</a>
          </div>

          <div className="login-divider">or</div>

          <div className="login-social">
            {[
              { icon: ICONS.facebook, label: 'Facebook' },
              { icon: ICONS.twitter, label: 'Twitter / X' },
              { icon: ICONS.github, label: 'GitHub' },
              { icon: ICONS.google, label: 'Google' },
            ].map((social) => (
              <button
                key={social.label}
                type="button"
                className="login-social-button"
                title={social.label}
                onClick={() => alert(`${social.label} login is coming soon!`)}
              >
                {social.icon}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
