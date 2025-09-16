import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';

export async function GET(request) {
  try {
    const token = await getTokenFromRequest(request);
    const user = verifyToken(token);

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all survey submissions
    const submissionsSnapshot = await getDocs(collection(db, 'surveySubmissions'));
    const submissions = submissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get all survey responses
    const responsesSnapshot = await getDocs(collection(db, 'surveyResponses'));
    const responses = responsesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = {};
    usersSnapshot.docs.forEach(doc => {
      users[doc.id] = { id: doc.id, ...doc.data() };
    });

    // Get all questions
    const questionsSnapshot = await getDocs(collection(db, 'surveyQuestions'));
    const questions = {};
    questionsSnapshot.docs.forEach(doc => {
      questions[doc.id] = { id: doc.id, ...doc.data() };
    });

    // Group responses by user
    const groupedResponses = {};
    
    submissions.forEach(submission => {
      const userId = submission.userId;
      const user = users[userId];
      
      if (user && !user.isAdmin) {
        groupedResponses[userId] = {
          userId: userId,
          name: user.name,
          email: user.email,
          referralCode: user.referralCode,
          referredBy: user.referredBy,
          userCreatedAt: user.createdAt?.toDate?.() || user.createdAt,
          submittedAt: submission.submittedAt?.toDate?.() || submission.submittedAt,
          responses: []
        };
      }
    });

    // Add responses to each user
    responses.forEach(response => {
      const userId = response.userId;
      const question = questions[response.questionId];
      
      if (groupedResponses[userId] && question) {
        groupedResponses[userId].responses.push({
          question: question.text,
          questionType: question.type,
          answer: response.answer,
          orderIndex: question.orderIndex
        });
      }
    });

    // Sort responses within each user by question order
    Object.values(groupedResponses).forEach(userResponse => {
      userResponse.responses.sort((a, b) => a.orderIndex - b.orderIndex);
    });

    // Sort users by submission date (most recent first)
    const formattedResponses = Object.values(groupedResponses).sort((a, b) => {
      const dateA = new Date(a.submittedAt);
      const dateB = new Date(b.submittedAt);
      return dateB - dateA;
    });

    return NextResponse.json({ responses: formattedResponses });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
