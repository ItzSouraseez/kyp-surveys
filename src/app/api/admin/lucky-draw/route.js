import { NextResponse } from 'next/server';
import db from '../../../../lib/database';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    const user = verifyToken(token);

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all eligible users
    const eligibleUsers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT u.id, u.email, u.referral_code, ss.submitted_at
        FROM users u
        JOIN survey_submissions ss ON u.id = ss.user_id
        WHERE ss.is_eligible_for_draw = TRUE AND u.is_admin = FALSE
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ error: 'No eligible users for draw' }, { status: 400 });
    }

    // Select random winner
    const randomIndex = Math.floor(Math.random() * eligibleUsers.length);
    const winner = eligibleUsers[randomIndex];

    return NextResponse.json({ 
      winner: {
        id: winner.id,
        email: winner.email,
        referralCode: winner.referral_code,
        submittedAt: winner.submitted_at
      },
      totalEligible: eligibleUsers.length,
      prize: '₹500 Amazon Voucher'
    });

  } catch (error) {
    console.error('Error conducting lucky draw:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
