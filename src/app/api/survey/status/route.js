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

    // Check if user has already submitted the survey
    const existingSubmission = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, submitted_at, is_eligible_for_draw FROM survey_submissions WHERE user_id = ?', 
        [user.id], 
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingSubmission) {
      return NextResponse.json({
        hasCompleted: true,
        submissionDate: existingSubmission.submitted_at,
        isEligibleForDraw: existingSubmission.is_eligible_for_draw
      });
    }

    return NextResponse.json({
      hasCompleted: false,
      submissionDate: null,
      isEligibleForDraw: false
    });

  } catch (error) {
    console.error('Error checking survey status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
