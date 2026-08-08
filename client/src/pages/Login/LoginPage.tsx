import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { getApiError } from '../../utils/format';
import './Login.css';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState('');
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setApiError('');
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(getApiError(err));
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div>
            <div className="login-brand-name">Mini ERP CRM</div>
            <div className="login-brand-sub">Business Operations Portal</div>
          </div>
        </div>

        <div className="login-hero">
          <h1 className="login-hero-title">
            Manage your business
            <br />
            operations, smarter.
          </h1>
          <p className="login-hero-desc">
            A complete ERP and CRM solution for wholesale and distribution businesses.
            Track customers, inventory, and sales challans in one place.
          </p>

          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-dot" />
              <span>Customer relationship management</span>
            </div>
            <div className="login-feature">
              <div className="login-feature-dot" />
              <span>Real-time inventory tracking</span>
            </div>
            <div className="login-feature">
              <div className="login-feature-dot" />
              <span>Sales challan generation</span>
            </div>
            <div className="login-feature">
              <div className="login-feature-dot" />
              <span>Role-based access control</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-title">Sign in to your account</h2>
            <p className="login-subtitle">Enter your credentials to access the portal</p>
          </div>

          {apiError && (
            <div className="alert alert-danger" style={{ marginBottom: 20 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label required" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className={`form-control ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label required" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={isSubmitting}
              id="login-submit"
            >
              {isSubmitting ? <span className="loading-spinner" /> : 'Sign in'}
            </button>
          </form>

          <div className="login-test-creds">
            <div className="login-creds-title">Test credentials (password: Admin@123)</div>
            <div className="login-creds-grid">
              <span>admin@minicrm.com</span>
              <span>sales@minicrm.com</span>
              <span>warehouse@minicrm.com</span>
              <span>accounts@minicrm.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
