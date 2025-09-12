import { NextResponse } from 'next/server';
import db from '../../../../lib/database';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's referral code
    const userData = await new Promise((resolve, reject) => {
      db.get(
        'SELECT referral_code FROM users WHERE id = ?', 
        [user.id], 
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      referralCode: userData.referral_code
    });

  } catch (error) {
    console.error('Error getting user referral code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
