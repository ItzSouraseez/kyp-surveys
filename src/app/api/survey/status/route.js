import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';

export async function GET(request) {
  try {
    const token = await getTokenFromRequest(request);
    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has already submitted the survey
    const submissionQuery = query(collection(db, 'surveySubmissions'), where('userId', '==', user.id));
    const submissionSnapshot = await getDocs(submissionQuery);

    if (!submissionSnapshot.empty) {
      const submission = submissionSnapshot.docs[0].data();
      return NextResponse.json({
        hasCompleted: true,
        submissionDate: submission.submittedAt?.toDate?.() || submission.submittedAt,
        isEligibleForDraw: submission.isEligibleForDraw
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
