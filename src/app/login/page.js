'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.isAdmin) {
          router.push('/admin');
        } else {
          router.push('/survey');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div>
      {/* Navigation */}
      <nav className="navbar">
        <div className="container navbar-content">
          <Link href="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/KYP Logo.svg" alt="Know Your Plate" style={{ height: '60px', width: 'auto' }} />
          </Link>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link href="/register" style={{ color: 'white', textDecoration: 'none' }}>
              Register
            </Link>
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '40px', maxWidth: '500px' }}>
        <div className="card">
          <h1 style={{ fontSize: '32px', fontWeight: '700', textAlign: 'center', marginBottom: '30px' }}>
            Login to Your Account
          </h1>

          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              border: '2px solid #f5c6cb',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email or Username</label>
              <input
                type="text"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginBottom: '20px' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--dark-gray)' }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" style={{ color: 'var(--primary-black)', fontWeight: '600' }}>
                Register here
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
