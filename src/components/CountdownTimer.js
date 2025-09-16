'use client';

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [surveyEnded, setSurveyEnded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;
    let intervalId;

    const setupFirebaseTimer = async () => {
      try {
        // Reference to the timer document in Firestore
        const timerDocRef = doc(db, 'settings', 'timer');
        
        // Set up real-time listener for timer settings
        unsubscribe = onSnapshot(timerDocRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            const endDate = new Date(data.endDate);
            const isActive = data.isActive;
            
            // Clear any existing interval
            if (intervalId) {
              clearInterval(intervalId);
            }
            
            // Start the countdown with Firebase-synced data
            intervalId = setInterval(() => {
              const now = new Date().getTime();
              const distance = endDate.getTime() - now;

              if (distance > 0 && isActive) {
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
                if (intervalId) {
                  clearInterval(intervalId);
                }
              }
            }, 1000);
            
            setLoading(false);
          } else {
            // If document doesn't exist, create default timer settings
            console.log('Timer document does not exist, using fallback');
            setFallbackTimer();
          }
        }, (error) => {
          console.error('Error listening to timer document:', error);
          setFallbackTimer();
        });

      } catch (error) {
        console.error('Error setting up Firebase timer:', error);
        setFallbackTimer();
      }
    };

    const setFallbackTimer = () => {
      // Fallback to 7 days from now
      const surveyEndDate = new Date();
      surveyEndDate.setDate(surveyEndDate.getDate() + 7);
      
      intervalId = setInterval(() => {
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
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
      }, 1000);
      
      setLoading(false);
    };

    setupFirebaseTimer();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '30px',
        backgroundColor: 'var(--light-gray)',
        borderRadius: '12px',
        marginBottom: '30px'
      }}>
        <div style={{ fontSize: '18px', color: 'var(--dark-gray)' }}>
          Loading timer...
        </div>
      </div>
    );
  }

  return (
    <>
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
        <div className="countdown-timer">
          <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
            Survey Ends In:
          </div>
          <div className="countdown-display">
            {timeLeft.days}d : {timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s
          </div>
        </div>
      )}
    </>
  );
}
