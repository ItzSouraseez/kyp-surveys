import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const token = await getTokenFromRequest(request);
    console.log('Token extracted:', token ? 'Found' : 'Not found');
    
    const user = verifyToken(token);
    console.log('User verified:', user ? `User ID: ${user.id}` : 'No user');

    if (!user) {
      console.log('Authorization failed - no valid user token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { responses } = await request.json();

    // Check if user has already submitted
    const submissionQuery = query(collection(db, 'surveySubmissions'), where('userId', '==', user.id));
    const existingSubmissionSnapshot = await getDocs(submissionQuery);

    if (!existingSubmissionSnapshot.empty) {
      return NextResponse.json({ error: 'Survey already submitted' }, { status: 400 });
    }

    // Use batch write for atomic operation
    const batch = writeBatch(db);

    // Create survey submission document
    const submissionRef = collection(db, 'surveySubmissions');
    const submissionDoc = await addDoc(submissionRef, {
      userId: user.id,
      submittedAt: serverTimestamp(),
      isEligibleForDraw: true
    });

    // Add all responses
    for (const response of responses) {
      const responseRef = collection(db, 'surveyResponses');
      await addDoc(responseRef, {
        userId: user.id,
        questionId: response.questionId,
        answer: response.answer,
        submissionId: submissionDoc.id,
        createdAt: serverTimestamp()
      });
    }

    return NextResponse.json({ 
      message: 'Survey submitted successfully',
      submissionId: submissionDoc.id,
      eligibleForDraw: true
    });

  } catch (error) {
    console.error('Error submitting survey:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
