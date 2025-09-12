import { NextResponse } from 'next/server';
import db from '../../../../lib/database';
import { verifyPassword, generateToken } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Handle admin login
    if (email === 'admin' && password === 'admin_kyp@369') {
      const adminUser = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE email = ? AND is_admin = TRUE', ['admin'], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (adminUser) {
        const token = generateToken(adminUser);
        const response = NextResponse.json({ 
          message: 'Login successful',
          user: {
            id: adminUser.id,
            email: adminUser.email,
            isAdmin: true,
            referralCode: adminUser.referral_code
          }
        });
        response.cookies.set('token', token, { 
          httpOnly: true, 
          maxAge: 7 * 24 * 60 * 60,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/'
        });
        return response;
      }
    }

    // Regular user login
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = generateToken(user);
    const response = NextResponse.json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.is_admin,
        referralCode: user.referral_code
      }
    });

    response.cookies.set('token', token, { 
      httpOnly: true, 
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
