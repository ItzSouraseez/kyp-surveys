import { NextResponse } from 'next/server';
import db from '../../../../lib/database';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    const user = verifyToken(token);

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const responses = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          u.id as user_id,
          u.name,
          u.email,
          u.referral_code,
          u.referred_by,
          u.created_at as user_created_at,
          ss.submitted_at,
          sq.question_text,
          sq.question_type,
          sr.answer
        FROM users u
        JOIN survey_submissions ss ON u.id = ss.user_id
        JOIN survey_responses sr ON u.id = sr.user_id
        JOIN survey_questions sq ON sr.question_id = sq.id
        ORDER BY ss.submitted_at DESC, sq.order_index ASC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Group responses by user
    const groupedResponses = {};
    responses.forEach(row => {
      if (!groupedResponses[row.user_id]) {
        groupedResponses[row.user_id] = {
          userId: row.user_id,
          name: row.name,
          email: row.email,
          referralCode: row.referral_code,
          referredBy: row.referred_by,
          userCreatedAt: row.user_created_at,
          submittedAt: row.submitted_at,
          responses: []
        };
      }
      
      groupedResponses[row.user_id].responses.push({
        question: row.question_text,
        questionType: row.question_type,
        answer: JSON.parse(row.answer)
      });
    });

    const formattedResponses = Object.values(groupedResponses);

    return NextResponse.json({ responses: formattedResponses });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
