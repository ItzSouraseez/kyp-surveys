'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    referredBy: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for referral code in URL parameters
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData(prev => ({
        ...prev,
        referredBy: refCode
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          referredBy: formData.referredBy || null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Registration successful! Your referral code is: ${data.referralCode}`);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Registration failed');
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
          <Link href="/" className="navbar-brand">
            <img src="/KYP Logo.svg" alt="Know Your Plate" style={{ height: '40px', width: 'auto' }} />
          </Link>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link href="/login" style={{ color: 'white', textDecoration: 'none' }}>
              Login
            </Link>
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '40px', maxWidth: '500px' }}>
        <div className="card">
          <h1 style={{ fontSize: '32px', fontWeight: '700', textAlign: 'center', marginBottom: '30px' }}>
            Create Your Account
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

          {success && (
            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              border: '2px solid #c3e6cb',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontWeight: '500'
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email address"
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
                placeholder="Create a strong password"
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Referral Code (Optional)</label>
              <input
                type="text"
                name="referredBy"
                className="form-input"
                value={formData.referredBy}
                onChange={handleChange}
                placeholder="Enter referral code if you have one"
              />
              <small style={{ color: 'var(--dark-gray)', fontSize: '14px' }}>
                If someone referred you, enter their referral code here
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginBottom: '20px' }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--dark-gray)' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--primary-black)', fontWeight: '600' }}>
                Login here
              </Link>
            </p>
          </div>

          <div style={{ 
            marginTop: '30px', 
            padding: '20px', 
            backgroundColor: 'var(--light-yellow)', 
            borderRadius: '8px',
            border: '2px solid var(--primary-yellow)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
              🎁 After Registration:
            </h3>
            <ul style={{ fontSize: '14px', color: 'var(--dark-gray)', paddingLeft: '20px' }}>
              <li>You`&apos;`ll get your unique referral code</li>
              <li>Complete the survey to enter the lucky draw</li>
              <li>Share your referral code with friends</li>
              <li>Win ₹500 Amazon voucher!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
