'use client';

import { useState, useEffect } from 'react';
import { verifyToken, getTokenFromCookies } from '../../../lib/auth';
import AdminTimerControl from '../../../components/AdminTimerControl';
import Link from 'next/link';

export default function AdminTimerPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = getTokenFromCookies();
        if (token) {
          const user = verifyToken(token);
          if (user && user.isAdmin) {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error('Error verifying admin status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
          <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>Access Denied</h1>
          <p style={{ marginBottom: '20px' }}>You need admin privileges to access this page.</p>
          <Link href="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation */}
      <nav className="navbar">
        <div className="container navbar-content">
          <Link href="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/KYP Logo.svg" alt="Know Your Plate" style={{ height: '60px', width: '60px' }} />
          </Link>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Link href="/admin" className="btn btn-secondary">
              Admin Dashboard
            </Link>
            <Link href="/" className="btn btn-primary">
              Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container" style={{ paddingTop: '40px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>
          Survey Timer Management
        </h1>
        
        <AdminTimerControl />
        
        <div className="card" style={{ maxWidth: '800px', margin: '40px auto' }}>
          <h2 style={{ marginBottom: '20px' }}>How Firebase Timer Sync Works</h2>
          <div style={{ lineHeight: '1.6' }}>
            <p><strong>Real-time Synchronization:</strong> The timer is now synchronized across all users in real-time using Firebase Firestore.</p>
            
            <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Key Features:</h3>
            <ul style={{ marginLeft: '20px' }}>
              <li><strong>Real-time Updates:</strong> Changes to the timer are instantly reflected on all user devices</li>
              <li><strong>Consistent Time:</strong> All users see the exact same countdown, eliminating client-side drift</li>
              <li><strong>Reliable Fallback:</strong> If Firebase is unavailable, the system falls back to a 7-day default timer</li>
              <li><strong>Admin Control:</strong> Admins can start, stop, and reset the timer from this interface</li>
            </ul>

            <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Technical Implementation:</h3>
            <ul style={{ marginLeft: '20px' }}>
              <li>Timer settings are stored in Firebase Firestore under <code>settings/timer</code></li>
              <li>The countdown component uses <code>onSnapshot</code> for real-time updates</li>
              <li>Server timestamps ensure consistency across different time zones</li>
              <li>Automatic cleanup prevents memory leaks when components unmount</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
