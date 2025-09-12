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

    // Check if user is admin
    const userData = await new Promise((resolve, reject) => {
      db.get('SELECT is_admin FROM users WHERE id = ?', [user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!userData || !userData.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all referral statistics
    const referralStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          u.name,
          u.email,
          u.referral_code,
          u.created_at,
          COUNT(referred.id) as referral_count
        FROM users u
        LEFT JOIN users referred ON referred.referred_by = u.referral_code
        WHERE u.is_admin = FALSE
        GROUP BY u.id
        ORDER BY referral_count DESC, u.created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get total statistics
    const totalUsers = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users WHERE is_admin = FALSE', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    const totalReferrals = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users WHERE referred_by IS NOT NULL', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    return NextResponse.json({
      referralStats,
      totalUsers,
      totalReferrals
    });

  } catch (error) {
    console.error('Error getting admin referral stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
