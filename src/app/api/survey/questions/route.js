import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';

export async function GET(request) {
  try {
    // Get all questions first, then filter and sort in JavaScript to avoid index requirements
    const questionsSnapshot = await getDocs(collection(db, 'surveyQuestions'));

    const formattedQuestions = questionsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        text: doc.data().text,
        type: doc.data().type,
        options: doc.data().options,
        order: doc.data().orderIndex,
        isActive: doc.data().isActive
      }))
      .filter(q => q.isActive === true)
      .sort((a, b) => a.order - b.order);

    return NextResponse.json({ questions: formattedQuestions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = await getTokenFromRequest(request);
    const user = verifyToken(token);

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, type, options, order } = await request.json();

    const questionId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO survey_questions (question_text, question_type, options, order_index) VALUES (?, ?, ?, ?)',
        [text, type, options ? JSON.stringify(options) : null, order],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    return NextResponse.json({ message: 'Question added successfully', questionId }, { status: 201 });
  } catch (error) {
    console.error('Error adding question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = await getTokenFromRequest(request);
    const user = verifyToken(token);

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, text, type, options, order, isActive } = await request.json();

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE survey_questions SET question_text = ?, question_type = ?, options = ?, order_index = ?, is_active = ? WHERE id = ?',
        [text, type, options ? JSON.stringify(options) : null, order, isActive, id],
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
