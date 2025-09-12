import { NextResponse } from 'next/server';
import db from '../../../../lib/database';
import { hashPassword, generateReferralCode } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const { name, email, password, referredBy } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password and generate referral code
    const hashedPassword = await hashPassword(password);
    const referralCode = generateReferralCode();

    // Insert new user
    const userId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (name, email, password, referral_code, referred_by) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashedPassword, referralCode, referredBy || null],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    return NextResponse.json({ 
      message: 'User registered successfully',
      referralCode,
      userId 
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
