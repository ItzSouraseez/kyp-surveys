// Script to initialize Firebase timer settings
// Run this once to set up the timer in Firebase

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCk0s0Z3fecIacu5Pgq8y5i_3gTYF5SgCU",
  authDomain: "knowyourplate-sourashisco.firebaseapp.com",
  projectId: "knowyourplate-sourashisco",
  storageBucket: "knowyourplate-sourashisco.firebasestorage.app",
  messagingSenderId: "406980911464",
  appId: "1:406980911464:web:4fc9ab2b604d018546f6dd",
  measurementId: "G-YW66MJ2Q55"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeTimer() {
  try {
    // Set timer to end 7 days from now
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const timerData = {
      endDate: endDate.toISOString(),
      isActive: true,
      lastUpdated: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    const timerDocRef = doc(db, 'settings', 'timer');
    await setDoc(timerDocRef, timerData);

    console.log('✅ Timer initialized successfully!');
    console.log('📅 End Date:', endDate.toISOString());
    console.log('🟢 Status: Active');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing timer:', error);
    process.exit(1);
  }
}

initializeTimer();
