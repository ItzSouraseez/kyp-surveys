'use client';

import { db } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export class TimerService {
  static TIMER_DOC_ID = 'timer';
  static COLLECTION_NAME = 'settings';

  // Initialize timer settings in Firebase
  static async initializeTimer(endDate = null, isActive = true) {
    try {
      const timerDocRef = doc(db, this.COLLECTION_NAME, this.TIMER_DOC_ID);
      
      // If no end date provided, set to 7 days from now
      if (!endDate) {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
      }

      const timerData = {
        endDate: endDate.toISOString(),
        isActive: isActive,
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      await setDoc(timerDocRef, timerData, { merge: true });
      console.log('Timer initialized successfully');
      return timerData;
    } catch (error) {
      console.error('Error initializing timer:', error);
      throw error;
    }
  }

  // Update timer settings
  static async updateTimer(endDate = null, isActive = null) {
    try {
      const timerDocRef = doc(db, this.COLLECTION_NAME, this.TIMER_DOC_ID);
      
      const updateData = {
        lastUpdated: serverTimestamp()
      };

      if (endDate !== null) {
        updateData.endDate = endDate.toISOString();
      }

      if (isActive !== null) {
        updateData.isActive = isActive;
      }

      await setDoc(timerDocRef, updateData, { merge: true });
      console.log('Timer updated successfully');
      return updateData;
    } catch (error) {
      console.error('Error updating timer:', error);
      throw error;
    }
  }

  // Reset timer to X days from now
  static async resetTimer(days = 7) {
    try {
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + days);
      
      return await this.updateTimer(newEndDate, true);
    } catch (error) {
      console.error('Error resetting timer:', error);
      throw error;
    }
  }

  // Stop the timer
  static async stopTimer() {
    try {
      return await this.updateTimer(null, false);
    } catch (error) {
      console.error('Error stopping timer:', error);
      throw error;
    }
  }

  // Start the timer
  static async startTimer() {
    try {
      return await this.updateTimer(null, true);
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  }

  // Get current timer settings
  static async getTimerSettings() {
    try {
      const timerDocRef = doc(db, this.COLLECTION_NAME, this.TIMER_DOC_ID);
      const docSnap = await getDoc(timerDocRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        // Initialize with default settings if document doesn't exist
        console.log('Timer document not found, initializing...');
        return await this.initializeTimer();
      }
    } catch (error) {
      console.error('Error getting timer settings:', error);
      throw error;
    }
  }

  // Calculate time remaining
  static calculateTimeRemaining(endDate, isActive = true) {
    if (!isActive) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true
      };
    }

    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const distance = end - now;

    if (distance <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true
      };
    }

    return {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000),
      isExpired: false
    };
  }
}
