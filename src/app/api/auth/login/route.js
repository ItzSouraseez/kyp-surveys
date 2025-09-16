import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { verifyPassword, generateToken } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user by email
    const userQuery = query(collection(db, 'users'), where('email', '==', email));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const userDoc = userSnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    // Handle admin login
    if (email === 'admin' && password === 'admin_kyp@369' && user.isAdmin) {
      const token = generateToken(user);
      const response = NextResponse.json({ 
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          isAdmin: true,
          referralCode: user.referralCode
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

    // Regular user login
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
        isAdmin: user.isAdmin || false,
        referralCode: user.referralCode
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
