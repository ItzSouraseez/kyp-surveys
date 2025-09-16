import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'kyp_survey_secret_key_2024';

export function generateReferralCode() {
  return 'KYP' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      isAdmin: user.isAdmin || user.is_admin,
      referralCode: user.referralCode || user.referral_code 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getTokenFromRequest(req) {
  console.log('=== getTokenFromRequest Debug ===');
  
  const authHeader = req.headers.get?.('authorization') || req.headers.authorization;
  console.log('Auth header:', authHeader);
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('Found Bearer token');
    return token;
  }
  
  // For Next.js App Router, we need to use cookies() from next/headers
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('token');
    console.log('Cookie store token:', tokenCookie ? 'Found' : 'Not found');
    return tokenCookie?.value || null;
  } catch (error) {
    console.log('Cookie access error:', error.message);
    // Fallback for older Next.js versions or different contexts
    const fallbackToken = req.cookies?.token;
    console.log('Fallback token:', fallbackToken ? 'Found' : 'Not found');
    return fallbackToken || null;
  }
}
