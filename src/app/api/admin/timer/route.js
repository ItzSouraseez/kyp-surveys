import { NextResponse } from 'next/server';
import db from '../../../../lib/database';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';

// Get current timer settings
export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    const user = verifyToken(token);

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const timerSettings = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM timer_settings WHERE id = 1', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!timerSettings) {
      // Return default 7 days from now if no settings exist
      const defaultEndDate = new Date();
      defaultEndDate.setDate(defaultEndDate.getDate() + 7);
      return NextResponse.json({ 
        endDate: defaultEndDate.toISOString(),
        isActive: true 
      });
    }

    return NextResponse.json({
      endDate: timerSettings.end_date,
      isActive: timerSettings.is_active
    });

  } catch (error) {
    console.error('Error fetching timer settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update timer settings
export async function POST(request) {
  try {
    const token = getTokenFromRequest(request);
    const user = verifyToken(token);

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    let endDate;
    if (body.action === 'reset') {
      const days = body.days || 7;
      endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE timer_settings SET end_date = ?, is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
          [endDate.toISOString()],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    } else if (body.action === 'stop') {
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE timer_settings SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    } else if (body.action === 'start') {
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE timer_settings SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    return NextResponse.json({ 
      message: `Timer ${body.action === 'reset' ? 'reset' : body.action === 'stop' ? 'stopped' : 'started'} successfully`,
      endDate: endDate ? endDate.toISOString() : null,
      isActive: body.action !== 'stop'
    });

  } catch (error) {
    console.error('Error updating timer settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
