import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';

export async function GET(request) {
  try {
    const token = await getTokenFromRequest(request);
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's referral code
    const userDoc = await getDoc(doc(db, 'users', user.id));

    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();

    // Count how many users were referred by this user
    const referralQuery = query(collection(db, 'users'), where('referredBy', '==', userData.referralCode));
    const referralSnapshot = await getDocs(referralQuery);

    return NextResponse.json({
      referralCode: userData.referralCode,
      referralCount: referralSnapshot.size
    });

  } catch (error) {
    console.error('Error getting user referrals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
