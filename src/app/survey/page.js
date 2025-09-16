'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Toast from '../../components/Toast';

export default function Survey() {
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [surveyEnded, setSurveyEnded] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [toast, setToast] = useState({ show: false, message: '' });
  const router = useRouter();

  const questionsPerPage = 3;
  const totalPages = Math.ceil(questions.length / questionsPerPage);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    checkSurveyStatus();
    checkTimerStatus();
    fetchQuestions();
  }, []);

  const checkSurveyStatus = async () => {
    try {
      const response = await fetch('/api/survey/status', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok && data.hasCompleted) {
        setSurveyCompleted(true);
        setCompletionData(data);
        // Fetch user's referral data
        fetchReferralData();
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error checking survey status:', error);
    }
  };

  const fetchReferralData = async () => {
    try {
      const response = await fetch('/api/user/referrals', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        setReferralCode(data.referralCode);
        setReferralCount(data.referralCount);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    }
  };

  const copyToClipboard = async (text, type = 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      const message = type === 'code' ? 'Referral code copied!' : 'Referral link copied!';
      setToast({ show: true, message });
    } catch (err) {
      console.error('Failed to copy: ', err);
      setToast({ show: true, message: 'Failed to copy. Please try again.' });
    }
  };

  const getReferralLink = () => {
    return `${window.location.origin}/register?ref=${referralCode}`;
  };

  const checkTimerStatus = async () => {
    try {
      const response = await fetch('/api/admin/timer', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        const surveyEndDate = new Date(data.endDate);
        const now = new Date();
        const distance = surveyEndDate.getTime() - now.getTime();
        
        if (distance <= 0 || !data.isActive) {
          setSurveyEnded(true);
        }
      }
    } catch (error) {
      console.error('Error checking timer status:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/survey/questions', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        setQuestions(data.questions);
      } else {
        setError('Failed to load questions');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId, answer) => {
    setResponses({
      ...responses,
      [questionId]: answer
    });
  };

  const handleMultipleChoice = (questionId, option, isLimited = false, maxSelections = null) => {
    const currentAnswers = responses[questionId] || [];
    
    if (currentAnswers.includes(option)) {
      // Remove option
      setResponses({
        ...responses,
        [questionId]: currentAnswers.filter(item => item !== option)
      });
    } else {
      // Add option
      if (isLimited && maxSelections && currentAnswers.length >= maxSelections) {
        setError(`You can only select up to ${maxSelections} options for this question.`);
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      setResponses({
        ...responses,
        [questionId]: [...currentAnswers, option]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validate all questions are answered
    const unansweredQuestions = questions.filter(q => {
      const response = responses[q.id];
      return !response || (Array.isArray(response) && response.length === 0) || response === '';
    });

    if (unansweredQuestions.length > 0) {
      setError('Please answer all questions before submitting.');
      setSubmitting(false);
      return;
    }

    // Validate question 13 (4 selections required)
    const question13 = questions.find(q => q.order === 13);
    if (question13 && responses[question13.id] && responses[question13.id].length !== 4) {
      setError('Question 13 requires exactly 4 selections.');
      setSubmitting(false);
      return;
    }

    // Validate question 14 (3 selections required)
    const question14 = questions.find(q => q.order === 14);
    if (question14 && responses[question14.id] && responses[question14.id].length !== 3) {
      setError('Question 14 requires exactly 3 selections.');
      setSubmitting(false);
      return;
    }

    try {
      const formattedResponses = questions.map(q => ({
        questionId: q.id,
        answer: responses[q.id]
      }));

      const response = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ responses: formattedResponses }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Survey submitted successfully! You are now eligible for the lucky draw.');
        setTimeout(() => {
          router.push('/thank-you');
        }, 3000);
      } else {
        setError(data.error || 'Submission failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question) => {
    const { id, text, type, options } = question;

    switch (type) {
      case 'single_choice':
        return (
          <div key={id} className="form-group">
            <label className="form-label">{text}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {options.map((option, index) => (
                <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={`question_${id}`}
                    value={option}
                    checked={responses[id] === option}
                    onChange={(e) => handleResponseChange(id, e.target.value)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-yellow)' }}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'multiple_choice':
        return (
          <div key={id} className="form-group">
            <label className="form-label">{text}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {options.map((option, index) => (
                <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={(responses[id] || []).includes(option)}
                    onChange={() => handleMultipleChoice(id, option)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-yellow)' }}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'multiple_choice_limited':
        const maxSelections = question.order === 13 ? 4 : 3;
        const currentSelections = (responses[id] || []).length;
        
        return (
          <div key={id} className="form-group">
            <label className="form-label">
              {text}
              <span style={{ color: 'var(--primary-yellow)', fontWeight: 'bold', marginLeft: '8px' }}>
                ({currentSelections}/{maxSelections} selected)
              </span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {options.map((option, index) => (
                <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={(responses[id] || []).includes(option)}
                    onChange={() => handleMultipleChoice(id, option, true, maxSelections)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-yellow)' }}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'text':
        return (
          <div key={id} className="form-group">
            <label className="form-label">{text}</label>
            <textarea
              className="form-textarea"
              value={responses[id] || ''}
              onChange={(e) => handleResponseChange(id, e.target.value)}
              placeholder="Please share your thoughts..."
              rows={4}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Loading survey...</div>
      </div>
    );
  }

  if (surveyCompleted) {
    return (
      <div>
        {/* Navigation */}
        <nav className="navbar">
          <div className="container navbar-content">
            <Link href="/" className="navbar-brand">
              <img src="/KYP Logo.svg" alt="Know Your Plate" style={{ height: '60px', width: '60px' }} />
            </Link>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <Link href="/login" style={{ color: 'white', textDecoration: 'none' }}>
                {user ? 'Dashboard' : 'Login'}
              </Link>
            </div>
          </div>
        </nav>

        <div className="container" style={{ paddingTop: '40px', maxWidth: '600px' }}>
          <div className="card">
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
              <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '20px', color: 'var(--primary-black)' }}>
                Survey Already Completed!
              </h1>
              <p style={{ fontSize: '18px', color: 'var(--dark-gray)', marginBottom: '20px' }}>
                You have already completed the Know Your Plate survey.
              </p>
              <div style={{
                backgroundColor: 'var(--light-yellow)',
                border: '2px solid var(--primary-yellow)',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '30px'
              }}>
                <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
                  📅 Completed on: {new Date(completionData?.submissionDate).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {completionData?.isEligibleForDraw && (
                  <p style={{ fontSize: '16px', color: 'var(--success-green)' }}>
                    🎁 You are eligible for the lucky draw!
                  </p>
                )}
              </div>
              <p style={{ fontSize: '16px', color: 'var(--dark-gray)', marginBottom: '30px' }}>
                Each user can only complete the survey once to ensure fair participation in the lucky draw.
              </p>
              {referralCode && (
                <div style={{
                  backgroundColor: 'var(--light-yellow)',
                  border: '2px solid var(--primary-yellow)',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: 'var(--primary-black)' }}>
                    🎁 Share & Earn Rewards
                  </h3>
                  
                  <div style={{ 
                    backgroundColor: 'white', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    marginBottom: '15px',
                    border: '1px solid var(--medium-gray)'
                  }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-black)', margin: '0' }}>
                      📊 Your Referrals: <span style={{ color: 'var(--primary-yellow)' }}>{referralCount}</span> people joined
                    </p>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--dark-gray)', display: 'block', marginBottom: '5px' }}>
                      Your Referral Code:
                    </label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={referralCode}
                        readOnly
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: '2px solid var(--medium-gray)',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          fontSize: '16px',
                          fontWeight: '600'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(referralCode, 'code')}
                        style={{
                          padding: '10px 15px',
                          backgroundColor: 'var(--primary-yellow)',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--dark-gray)', display: 'block', marginBottom: '5px' }}>
                      Your Referral Link:
                    </label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={typeof window !== 'undefined' ? getReferralLink() : ''}
                        readOnly
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: '2px solid var(--medium-gray)',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          fontSize: '14px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(getReferralLink(), 'link')}
                        style={{
                          padding: '10px 15px',
                          backgroundColor: 'var(--primary-yellow)',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '14px', color: 'var(--dark-gray)', marginBottom: '0' }}>
                    Share your referral code or link with friends to help them join and earn rewards!
                  </p>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/" className="btn btn-primary">
                  Back to Home
                </Link>
                <Link href="/thank-you" className="btn" style={{
                  backgroundColor: 'var(--light-gray)',
                  color: 'var(--primary-black)',
                  border: '2px solid var(--medium-gray)'
                }}>
                  View Thank You Page
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Toast 
          message={toast.message}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, message: '' })}
          type="success"
        />
      </div>
    );
  }

  if (surveyEnded) {
    return (
      <div>
        {/* Navigation */}
        <nav className="navbar">
          <div className="container navbar-content">
            <Link href="/" className="navbar-brand">
              <img src="/KYP Logo.svg" alt="Know Your Plate" style={{ height: '60px', width: '60px' }} />
            </Link>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <span style={{ color: 'var(--primary-yellow)' }}>
                Welcome, {user?.email}
              </span>
            </div>
          </div>
        </nav>

        <div className="container" style={{ paddingTop: '60px', maxWidth: '800px' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '30px' }}>⏰</div>
            <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '20px', color: 'var(--primary-black)' }}>
              Survey Has Ended
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--dark-gray)', marginBottom: '30px' }}>
              Thank you for your interest! The survey submission period has concluded.
            </p>
            <Link href="/" className="btn btn-primary" style={{ fontSize: '16px', padding: '12px 24px' }}>
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestions = questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  );

  return (
    <div>
      {/* Navigation */}
      <nav className="navbar">
        <div className="container navbar-content">
          <Link href="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/KYP Logo.svg" alt="Know Your Plate" style={{ height: '60px', width: 'auto' }} />
          </Link>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span style={{ color: 'var(--primary-yellow)' }}>
              Welcome, {user?.email}
            </span>
            <span style={{ color: 'white' }}>
              Referral Code: {user?.referralCode}
            </span>
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '40px', maxWidth: '800px' }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '10px' }}>
              Know Your Plate Survey
            </h1>
            <p style={{ color: 'var(--dark-gray)' }}>
              Page {currentPage + 1} of {totalPages} • Questions {currentPage * questionsPerPage + 1}-{Math.min((currentPage + 1) * questionsPerPage, questions.length)} of {questions.length}
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              border: '2px solid #f5c6cb',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              border: '2px solid #c3e6cb',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontWeight: '500'
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {currentQuestions.map(renderQuestion)}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' }}>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="btn btn-secondary"
                style={{ opacity: currentPage === 0 ? 0.5 : 1 }}
              >
                Previous
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentPage(i)}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      border: 'none',
                      backgroundColor: i === currentPage ? 'var(--primary-yellow)' : 'var(--light-gray)',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>

              {currentPage === totalPages - 1 ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                >
                  {submitting ? 'Submitting...' : 'Submit Survey'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  className="btn btn-primary"
                >
                  Next
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Referral Section */}
        <div className="card" style={{ backgroundColor: 'var(--light-yellow)', border: '2px solid var(--primary-yellow)' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', textAlign: 'center' }}>
            📢 Share & Earn More Chances!
          </h3>
          <p style={{ textAlign: 'center', marginBottom: '16px' }}>
            Share your referral link with friends and family:
          </p>
          <div style={{ 
            backgroundColor: 'var(--primary-white)', 
            padding: '16px', 
            borderRadius: '8px', 
            textAlign: 'center',
            border: '2px solid var(--primary-black)',
            marginBottom: '16px'
          }}>
            <div style={{ 
              fontFamily: 'monospace',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              {user?.referralCode}
            </div>
            <div style={{ 
              fontSize: '14px',
              color: 'var(--dark-gray)',
              marginBottom: '12px'
            }}>
              Your referral link:
            </div>
            <div style={{ 
              backgroundColor: 'var(--light-gray)',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              wordBreak: 'break-all',
              fontFamily: 'monospace'
            }}>
              {typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${user?.referralCode}` : ''}
            </div>
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && user?.referralCode) {
                  const referralLink = `${window.location.origin}/register?ref=${user.referralCode}`;
                  navigator.clipboard.writeText(referralLink).then(() => {
                    alert('Referral link copied to clipboard!');
                  });
                }
              }}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                backgroundColor: 'var(--primary-yellow)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Copy Link
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--dark-gray)' }}>
            The more people you refer, the better your chances in the lucky draw!
          </p>
        </div>
      </div>
    </div>
  );
}
