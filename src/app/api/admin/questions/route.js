import { NextResponse } from 'next/server';
import db from '../../../../lib/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is admin
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ? AND is_admin = TRUE', [decoded.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all questions
    const questions = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM survey_questions ORDER BY order_index', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const formattedQuestions = questions.map(q => ({
      id: q.id,
      text: q.question_text,
      type: q.question_type,
      options: q.options ? JSON.parse(q.options) : null,
      order: q.order_index,
      isActive: q.is_active
    }));

    return NextResponse.json({ questions: formattedQuestions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is admin
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ? AND is_admin = TRUE', [decoded.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { text, type, options, order } = await request.json();

    if (!text || !type || !order) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert new question
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO survey_questions (question_text, question_type, options, order_index) VALUES (?, ?, ?, ?)',
        [text, type, options ? JSON.stringify(options) : null, order],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    return NextResponse.json({ 
      message: 'Question created successfully',
      id: result.id
    });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is admin
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ? AND is_admin = TRUE', [decoded.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id, text, type, options, order } = await request.json();

    if (!id || !text || !type || !order) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update question
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE survey_questions SET question_text = ?, question_type = ?, options = ?, order_index = ? WHERE id = ?',
        [text, type, options ? JSON.stringify(options) : null, order, id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    return NextResponse.json({ message: 'Question updated successfully' });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user is admin
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ? AND is_admin = TRUE', [decoded.userId], (err, row) => {
        if (err) {
          console.error('Database error checking admin:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log('Attempting to delete question with ID:', id);

    if (!id) {
      return NextResponse.json({ error: 'Question ID required' }, { status: 400 });
    }

    // First check if question exists and has no responses
    const questionExists = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM survey_questions WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error checking question existence:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (!questionExists) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check if there are any responses for this question
    const hasResponses = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM survey_responses WHERE question_id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error checking responses:', err);
          reject(err);
        } else {
          resolve(row.count > 0);
        }
      });
    });

    if (hasResponses) {
      return NextResponse.json({ error: 'Cannot delete question with existing responses' }, { status: 400 });
    }

    // Delete question
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM survey_questions WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Error deleting question:', err);
          reject(err);
        } else {
          console.log('Question deleted successfully, affected rows:', this.changes);
          resolve();
        }
      });
    });

    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}
