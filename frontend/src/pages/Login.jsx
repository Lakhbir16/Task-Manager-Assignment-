import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = email => setForm({ email, password: 'password123' });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">TF</div>
          <span className="auth-logo-text">TaskFlow</span>
        </div>

        <h1 className="auth-title">Sign in</h1>
        <p className="auth-sub">Enter your credentials to continue</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="email" name="email" type="email"
              className="form-input" placeholder="you@example.com"
              value={form.email} onChange={handleChange} required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="password" name="password" type="password"
              className="form-input" placeholder="Password"
              value={form.password} onChange={handleChange} required
            />
          </div>
          <button id="login-btn" type="submit" className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 18, padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Demo accounts (password: password123)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              ['admin@demo.com', 'Admin'],
              ['alice@demo.com', 'Member'],
              ['bob@demo.com', 'Member'],
            ].map(([email, role]) => (
              <button key={email} onClick={() => fillDemo(email)}
                className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', gap: 8 }}>
                <span className={`badge badge-${role.toLowerCase()}`}>{role}</span>
                {email}
              </button>
            ))}
          </div>
        </div>

        <p className="auth-link">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
