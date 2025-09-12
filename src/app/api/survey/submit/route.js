import { NextResponse } from 'next/server';
import db from '../../../../lib/database';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    console.log('Token extracted:', token ? 'Found' : 'Not found');
    
    const user = verifyToken(token);
    console.log('User verified:', user ? `User ID: ${user.id}` : 'No user');

    if (!user) {
      console.log('Authorization failed - no valid user token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { responses } = await request.json();

    // Check if user has already submitted
    const existingSubmission = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM survey_submissions WHERE user_id = ?', [user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingSubmission) {
      return NextResponse.json({ error: 'Survey already submitted' }, { status: 400 });
    }

    // Start transaction
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    try {
      // Insert survey submission
      const submissionId = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO survey_submissions (user_id) VALUES (?)',
          [user.id],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      // Insert all responses
      for (const response of responses) {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO survey_responses (user_id, question_id, answer) VALUES (?, ?, ?)',
            [user.id, response.questionId, JSON.stringify(response.answer)],
            function(err) {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      // Commit transaction
      await new Promise((resolve, reject) => {
        db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      return NextResponse.json({ 
        message: 'Survey submitted successfully',
        submissionId,
        eligibleForDraw: true
      });

    } catch (error) {
      // Rollback on error
      await new Promise((resolve) => {
        db.run('ROLLBACK', () => resolve());
      });
      throw error;
    }

  } catch (error) {
    console.error('Error submitting survey:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
