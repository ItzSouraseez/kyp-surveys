import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { hashPassword, generateReferralCode } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const { name, email, password, referredBy } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    // Check if user already exists
    const userQuery = query(collection(db, 'users'), where('email', '==', email));
    const existingUserSnapshot = await getDocs(userQuery);

    if (!existingUserSnapshot.empty) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password and generate referral code
    const hashedPassword = await hashPassword(password);
    const referralCode = generateReferralCode();

    // Insert new user
    const userDoc = await addDoc(collection(db, 'users'), {
      name,
      email,
      password: hashedPassword,
      referralCode,
      referredBy: referredBy || null,
      createdAt: serverTimestamp(),
      isAdmin: false
    });

    return NextResponse.json({ 
      message: 'User registered successfully',
      referralCode,
      userId: userDoc.id 
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
