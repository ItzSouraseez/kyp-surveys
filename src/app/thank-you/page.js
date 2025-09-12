'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ThankYou() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <div>
      {/* Navigation */}
      <nav className="navbar">
        <div className="container navbar-content">
          <Link href="/" className="navbar-brand">
            <img src="/KYP Logo.svg" alt="Know Your Plate" style={{ height: '40px', width: 'auto' }} />
          </Link>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '60px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
          
          <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '20px', color: 'var(--primary-black)' }}>
            Thank You!
          </h1>
          
          <p style={{ fontSize: '18px', marginBottom: '30px', color: 'var(--dark-gray)' }}>
            Your survey has been successfully submitted. You are now eligible for our lucky draw to win a 
            <strong style={{ color: 'var(--primary-black)' }}> ₹500 Amazon Voucher!</strong>
          </p>

          <div style={{ 
            backgroundColor: 'var(--light-yellow)', 
            padding: '24px', 
            borderRadius: '12px',
            border: '2px solid var(--primary-yellow)',
            marginBottom: '30px'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
              📢 Keep Sharing Your Referral Code!
            </h3>
            <div style={{ 
              backgroundColor: 'var(--primary-white)', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '2px solid var(--primary-black)',
              fontFamily: 'monospace',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}>
              {user?.referralCode || 'Loading...'}
            </div>
            <p style={{ fontSize: '14px', color: 'var(--dark-gray)' }}>
              Share this code with friends and family to increase your chances of winning!
            </p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
              What happens next?
            </h3>
            <div style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ marginRight: '12px' }}>✅</span>
                <span>Your responses have been recorded</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ marginRight: '12px' }}>🎲</span>
                <span>You`&apos;`re entered in the lucky draw</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ marginRight: '12px' }}>📧</span>
                <span>Winner will be announced via email</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '12px' }}>🏆</span>
                <span>Lucky draw in 7 days</span>
              </div>
            </div>
          </div>

          <Link href="/" className="btn btn-primary" style={{ fontSize: '18px', padding: '16px 32px' }}>
            Back to Home
          </Link>
        </div>

        <div className="card" style={{ marginTop: '40px', backgroundColor: 'var(--primary-black)', color: 'var(--primary-white)' }}>
          <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary-yellow)' }}>
            Help Us Build the Future of Dining
          </h3>
          <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
            Your feedback will help us create better dining experiences with QR menus, nutritional transparency, 
            and personalized recommendations. Together, we`&apos;`re revolutionizing how people interact with food and restaurants.
          </p>
        </div>
      </div>
    </div>
  );
}
