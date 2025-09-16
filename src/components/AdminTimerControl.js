'use client';

import { useState, useEffect } from 'react';
import { TimerService } from '../lib/timerService';

export default function AdminTimerControl() {
  const [timerSettings, setTimerSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [days, setDays] = useState(7);

  useEffect(() => {
    loadTimerSettings();
  }, []);

  const loadTimerSettings = async () => {
    try {
      const settings = await TimerService.getTimerSettings();
      setTimerSettings(settings);
    } catch (error) {
      console.error('Error loading timer settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetTimer = async () => {
    setUpdating(true);
    try {
      await TimerService.resetTimer(days);
      await loadTimerSettings();
      alert(`Timer reset to ${days} days from now`);
    } catch (error) {
      console.error('Error resetting timer:', error);
      alert('Error resetting timer');
    } finally {
      setUpdating(false);
    }
  };

  const handleStopTimer = async () => {
    setUpdating(true);
    try {
      await TimerService.stopTimer();
      await loadTimerSettings();
      alert('Timer stopped');
    } catch (error) {
      console.error('Error stopping timer:', error);
      alert('Error stopping timer');
    } finally {
      setUpdating(false);
    }
  };

  const handleStartTimer = async () => {
    setUpdating(true);
    try {
      await TimerService.startTimer();
      await loadTimerSettings();
      alert('Timer started');
    } catch (error) {
      console.error('Error starting timer:', error);
      alert('Error starting timer');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div>Loading timer settings...</div>;
  }

  const timeRemaining = TimerService.calculateTimeRemaining(
    timerSettings?.endDate, 
    timerSettings?.isActive
  );

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '20px auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Timer Control Panel</h2>
      
      {timerSettings && (
        <div style={{ marginBottom: '20px' }}>
          <p><strong>Status:</strong> {timerSettings.isActive ? 'Active' : 'Inactive'}</p>
          <p><strong>End Date:</strong> {new Date(timerSettings.endDate).toLocaleString()}</p>
          <p><strong>Time Remaining:</strong> {
            timeRemaining.isExpired 
              ? 'Expired' 
              : `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`
          }</p>
          {timerSettings.lastUpdated && (
            <p><strong>Last Updated:</strong> {new Date(timerSettings.lastUpdated.seconds * 1000).toLocaleString()}</p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="days">Reset timer to:</label>
          <input
            id="days"
            type="number"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value) || 1)}
            min="1"
            max="365"
            style={{ 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid var(--dark-gray)',
              width: '80px'
            }}
          />
          <span>days from now</span>
          <button
            onClick={handleResetTimer}
            disabled={updating}
            className="btn btn-primary"
            style={{ marginLeft: '10px' }}
          >
            {updating ? 'Updating...' : 'Reset Timer'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleStartTimer}
            disabled={updating || timerSettings?.isActive}
            className="btn btn-secondary"
          >
            {updating ? 'Updating...' : 'Start Timer'}
          </button>
          <button
            onClick={handleStopTimer}
            disabled={updating || !timerSettings?.isActive}
            className="btn"
            style={{ 
              backgroundColor: '#dc3545', 
              color: 'white',
              border: '2px solid #dc3545'
            }}
          >
            {updating ? 'Updating...' : 'Stop Timer'}
          </button>
        </div>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: 'var(--light-yellow)',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <strong>Note:</strong> Changes made here will be synchronized in real-time across all users viewing the countdown timer.
      </div>
    </div>
  );
}
