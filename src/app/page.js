'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [surveyEnded, setSurveyEnded] = useState(false);

  useEffect(() => {
    const fetchTimerSettings = async () => {
      try {
        const response = await fetch('/api/admin/timer', {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (response.ok) {
          const surveyEndDate = new Date(data.endDate);
          
          const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = surveyEndDate.getTime() - now;

            if (distance > 0 && data.isActive) {
              setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
              });
              setSurveyEnded(false);
            } else {
              setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
              setSurveyEnded(true);
            }
          }, 1000);

          return () => clearInterval(timer);
        } else {
          // Fallback to default 7 days if API fails
          const surveyEndDate = new Date();
          surveyEndDate.setDate(surveyEndDate.getDate() + 7);
          
          const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = surveyEndDate.getTime() - now;

            if (distance > 0) {
              setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
              });
              setSurveyEnded(false);
            } else {
              setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
              setSurveyEnded(true);
            }
          }, 1000);

          return () => clearInterval(timer);
        }
      } catch (error) {
        console.error('Error fetching timer settings:', error);
        // Fallback to default behavior
        const surveyEndDate = new Date();
        surveyEndDate.setDate(surveyEndDate.getDate() + 7);
        
        const timer = setInterval(() => {
          const now = new Date().getTime();
          const distance = surveyEndDate.getTime() - now;

          if (distance > 0) {
            setTimeLeft({
              days: Math.floor(distance / (1000 * 60 * 60 * 24)),
              hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
              minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
              seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
            setSurveyEnded(false);
          } else {
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            setSurveyEnded(true);
          }
        }, 1000);

        return () => clearInterval(timer);
      }
    };

    fetchTimerSettings();
  }, []);

  return (
    <div>
      {/* Navigation */}
      <nav className="navbar">
        <div className="container navbar-content">
          <Link href="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/KYP Logo.svg" alt="Know Your Plate" style={{ height: '60px', width: 'auto' }} />
          </Link>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Link 
              href="/login" 
              className="btn"
              style={{ 
                backgroundColor: 'transparent',
                border: '2px solid var(--primary-yellow)',
                color: 'var(--primary-yellow)',
                padding: '10px 20px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = 'var(--primary-yellow)';
                e.target.style.color = 'var(--primary-black)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'var(--primary-yellow)';
              }}
            >
              Login
            </Link>
            <Link 
              href="/register" 
              className="btn"
              style={{ 
                backgroundColor: 'var(--primary-yellow)',
                border: '2px solid var(--primary-yellow)',
                color: 'var(--primary-black)',
                padding: '10px 20px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'var(--primary-yellow)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'var(--primary-yellow)';
                e.target.style.color = 'var(--primary-black)';
              }}
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container" style={{ paddingTop: '40px' }}>
        {/* Logo Placeholder 
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '200px',
            height: '100px',
            margin: '0 auto',
            border: '2px dashed var(--dark-gray)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            backgroundColor: 'var(--light-gray)'
          }}>
            <span style={{ color: 'var(--dark-gray)', fontSize: '14px' }}>
              Logo Placeholder
            </span>
          </div>
        </div>*/}

        {/* Hero Section */}
        <div className="card" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '20px', color: 'var(--primary-black)' }}>
            Know Your Plate Survey
          </h1>
          <p style={{ fontSize: '20px', marginBottom: '30px', color: 'var(--dark-gray)' }}>
            Help us revolutionize the dining experience! Participate in our survey and get a chance to win a 
            <strong style={{ color: 'var(--primary-black)' }}> ₹500 Amazon Voucher</strong>
          </p>
          
          {/* Countdown Timer or Survey Ended Message */}
          {surveyEnded ? (
            <div style={{ 
              backgroundColor: '#f8d7da', 
              color: '#721c24', 
              border: '2px solid #f5c6cb',
              padding: '30px',
              borderRadius: '12px',
              marginBottom: '30px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px', textAlign: 'center' }}>⏰</div>
              <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
                Survey Has Ended
              </h2>
              <p style={{ fontSize: '18px', textAlign: 'center', marginBottom: '0' }}>
                Thank you for your interest! The survey submission period has concluded.
              </p>
            </div>
          ) : (
            <>
              <div className="countdown-timer">
                <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
                  Survey Ends In:
                </div>
                <div className="countdown-display">
                  {timeLeft.days}d : {timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/register" className="btn btn-primary" style={{ fontSize: '18px', padding: '16px 32px' }}>
                  Start Survey
                </Link>
                <Link href="/login" className="btn btn-secondary" style={{ fontSize: '18px', padding: '16px 32px' }}>
                  Already Registered?
                </Link>
              </div>
              
              <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <p style={{ fontSize: '16px', color: 'var(--dark-gray)', marginBottom: '10px' }}>
                  Have a referral code? Use this link format:
                </p>
                <code style={{ 
                  backgroundColor: 'var(--light-gray)', 
                  padding: '8px 12px', 
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: 'var(--primary-black)'
                }}>
                  {typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=REFERRAL_CODE
                </code>
              </div>
            </>
          )}
        </div>

        {/* Features Section */}
        <div style={{ marginTop: '60px', marginBottom: '60px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: '700', marginBottom: '40px' }}>
            Why Participate?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary-black)' }}>
                🎁 Win Prizes
              </h3>
              <p style={{ color: 'var(--dark-gray)' }}>
                Get a chance to win ₹500 Amazon voucher in our lucky draw
              </p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary-black)' }}>
                🍽️ Shape the Future
              </h3>
              <p style={{ color: 'var(--dark-gray)' }}>
                Help us build better dining experiences for everyone
              </p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px', color: 'var(--primary-black)' }}>
                👥 Refer Friends
              </h3>
              <p style={{ color: 'var(--dark-gray)' }}>
                Get your unique referral code and invite friends to participate
              </p>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="card" style={{ backgroundColor: 'var(--light-yellow)', border: '2px solid var(--primary-yellow)' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '20px', textAlign: 'center' }}>
            About Know Your Plate
          </h2>
          <p style={{ fontSize: '16px', lineHeight: '1.8', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            We're revolutionizing the dining experience by centralizing offline dine-in restaurants with a focus on 
            healthcare and nutrition. Our mission is to provide transparency in food choices and help people make 
            informed decisions about what they eat.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ 
        backgroundColor: 'var(--primary-black)', 
        color: 'var(--primary-white)', 
        textAlign: 'center', 
        padding: '40px 0',
        marginTop: '60px'
      }}>
        <div className="container">
          <p style={{ marginBottom: '10px' }}> © 2025 Know Your Plate. All rights reserved.</p>
          <p style={{ color: 'var(--primary-yellow)' }}>
            Building the future of dining experiences
          </p>
        </div>
      </footer>
    </div>
  );
}
