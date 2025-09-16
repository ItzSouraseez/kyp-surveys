'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('responses');
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [winner, setWinner] = useState(null);
  const [drawLoading, setDrawLoading] = useState(false);
  const [timerSettings, setTimerSettings] = useState(null);
  const [timerLoading, setTimerLoading] = useState(false);
  const [customDays, setCustomDays] = useState(7);
  const [adminQuestions, setAdminQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'single_choice',
    options: [''],
    order: 1
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (!parsedUser.isAdmin) {
      router.push('/');
      return;
    }

    setUser(parsedUser);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [responsesRes, questionsRes, timerRes, adminQuestionsRes] = await Promise.all([
        fetch('/api/admin/responses', { credentials: 'include' }),
        fetch('/api/survey/questions', { credentials: 'include' }),
        fetch('/api/admin/timer', { credentials: 'include' }),
        fetch('/api/admin/questions', { credentials: 'include' })
      ]);

      if (responsesRes.ok) {
        const responsesData = await responsesRes.json();
        setResponses(responsesData.responses);
      }

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setQuestions(questionsData.questions);
      }

      if (timerRes.ok) {
        const timerData = await timerRes.json();
        setTimerSettings(timerData);
      }

      if (adminQuestionsRes.ok) {
        const adminQuestionsData = await adminQuestionsRes.json();
        setAdminQuestions(adminQuestionsData.questions);
      }
    } catch (error) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const conductLuckyDraw = async () => {
    setDrawLoading(true);
    try {
      const response = await fetch('/api/admin/lucky-draw', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok) {
        setWinner(data.winner);
      } else {
        setError(data.error || 'Failed to conduct lucky draw');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setDrawLoading(false);
    }
  };

  const handleTimerAction = async (action) => {
    setTimerLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/timer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          action, 
          days: action === 'reset' ? customDays : undefined 
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setTimerSettings(data);
        // Refresh timer settings
        const timerRes = await fetch('/api/admin/timer', { credentials: 'include' });
        if (timerRes.ok) {
          const timerData = await timerRes.json();
          setTimerSettings(timerData);
        }
      } else {
        setError(data.error || `Failed to ${action} timer`);
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setTimerLoading(false);
    }
  };

  const handleQuestionSubmit = async (questionData, isEdit = false) => {
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/questions', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(questionData),
      });

      const data = await response.json();
      if (response.ok) {
        setError('');
        setEditingQuestion(null);
        setShowAddForm(false);
        setNewQuestion({
          text: '',
          type: 'single_choice',
          options: [''],
          order: 1
        });
        // Refresh questions
        const adminQuestionsRes = await fetch('/api/admin/questions', { credentials: 'include' });
        if (adminQuestionsRes.ok) {
          const adminQuestionsData = await adminQuestionsRes.json();
          setAdminQuestions(adminQuestionsData.questions);
        }
      } else {
        setError(data.error || `Failed to ${isEdit ? 'update' : 'create'} question`);
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetch(`/api/admin/questions?id=${questionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok) {
        setError('');
        // Refresh questions
        const adminQuestionsRes = await fetch('/api/admin/questions', { credentials: 'include' });
        if (adminQuestionsRes.ok) {
          const adminQuestionsData = await adminQuestionsRes.json();
          setAdminQuestions(adminQuestionsData.questions);
        }
      } else {
        setError(data.error || 'Failed to delete question');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const addOption = (questionState, setQuestionState) => {
    setQuestionState({
      ...questionState,
      options: [...questionState.options, '']
    });
  };

  const removeOption = (questionState, setQuestionState, index) => {
    setQuestionState({
      ...questionState,
      options: questionState.options.filter((_, i) => i !== index)
    });
  };

  const updateOption = (questionState, setQuestionState, index, value) => {
    const newOptions = [...questionState.options];
    newOptions[index] = value;
    setQuestionState({
      ...questionState,
      options: newOptions
    });
  };

  const exportToCSV = () => {
    if (responses.length === 0) return;

    const headers = ['User Name', 'User Email', 'Referral Code', 'Referred By', 'Submitted At'];
    const allQuestions = [...new Set(responses.flatMap(r => r.responses.map(resp => resp.question)))];
    headers.push(...allQuestions);

    const csvContent = [
      headers.join(','),
      ...responses.map(response => {
        const row = [
          response.name,
          response.email,
          response.referralCode,
          response.referredBy || '',
          new Date(response.submittedAt).toLocaleString()
        ];

        allQuestions.forEach(question => {
          const answer = response.responses.find(r => r.question === question);
          if (answer) {
            const answerText = Array.isArray(answer.answer) 
              ? answer.answer.join('; ') 
              : answer.answer;
            row.push(`"${answerText.replace(/"/g, '""')}"`);
          } else {
            row.push('');
          }
        });

        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey_responses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--light-gray)',
          borderTop: '4px solid var(--primary-yellow)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation */}
      <nav className="navbar">
        <div className="container navbar-content">
          <Link href="/" className="navbar-brand">
            <img src="/KYP Logo.svg" alt="Know Your Plate" style={{ height: '60px', width: '60px' }} />
            <span style={{ marginLeft: '10px', color: 'var(--primary-yellow)' }}>Admin</span>
          </Link>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span style={{ color: 'var(--primary-yellow)' }}>
              Admin: {user?.email}
            </span>
            <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>
              Logout
            </Link>
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '40px' }}>
        {/* Admin Tabs */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '20px', borderBottom: '2px solid var(--light-gray)' }}>
            <button
              onClick={() => setActiveTab('responses')}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                borderBottom: activeTab === 'responses' ? '3px solid var(--primary-yellow)' : 'none',
                color: activeTab === 'responses' ? 'var(--primary-black)' : 'var(--dark-gray)'
              }}
            >
              Survey Responses ({responses.length})
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                borderBottom: activeTab === 'questions' ? '3px solid var(--primary-yellow)' : 'none',
                color: activeTab === 'questions' ? 'var(--primary-black)' : 'var(--dark-gray)'
              }}
            >
              Manage Questions ({questions.length})
            </button>
            <button
              onClick={() => setActiveTab('draw')}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                borderBottom: activeTab === 'draw' ? '3px solid var(--primary-yellow)' : 'none',
                color: activeTab === 'draw' ? 'var(--primary-black)' : 'var(--dark-gray)'
              }}
            >
              Lucky Draw
            </button>
            <button
              onClick={() => setActiveTab('timer')}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                borderBottom: activeTab === 'timer' ? '3px solid var(--primary-yellow)' : 'none',
                color: activeTab === 'timer' ? 'var(--primary-black)' : 'var(--dark-gray)'
              }}
            >
              Timer Control
            </button>
          </div>
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

        {/* Survey Responses Tab */}
        {activeTab === 'responses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Survey Responses</h2>
              <button onClick={exportToCSV} className="btn btn-primary">
                Export to CSV
              </button>
            </div>

            {responses.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ fontSize: '18px', color: 'var(--dark-gray)' }}>
                  No survey responses yet.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--light-yellow)' }}>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--primary-yellow)', fontWeight: '600' }}>Name</th>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--primary-yellow)', fontWeight: '600' }}>Email</th>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--primary-yellow)', fontWeight: '600' }}>Referral Code</th>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--primary-yellow)', fontWeight: '600' }}>Referred By</th>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--primary-yellow)', fontWeight: '600' }}>Submitted</th>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--primary-yellow)', fontWeight: '600' }}>Responses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((response, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid var(--light-gray)' }}>
                        <td style={{ padding: '16px', fontWeight: '600' }}>{response.name}</td>
                        <td style={{ padding: '16px' }}>{response.email}</td>
                        <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 'bold' }}>{response.referralCode}</td>
                        <td style={{ padding: '16px' }}>{response.referredBy || '-'}</td>
                        <td style={{ padding: '16px' }}>{new Date(response.submittedAt).toLocaleDateString()}</td>
                        <td style={{ padding: '16px' }}>
                          <details>
                            <summary style={{ cursor: 'pointer', color: 'var(--primary-black)', fontWeight: '600' }}>
                              View Responses ({response.responses.length})
                            </summary>
                            <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                              {response.responses.map((resp, i) => (
                                <div key={i} style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'var(--light-gray)', borderRadius: '4px' }}>
                                  <strong style={{ fontSize: '14px' }}>{resp.question}</strong>
                                  <div style={{ marginTop: '4px', fontSize: '14px' }}>
                                    {Array.isArray(resp.answer) ? resp.answer.join(', ') : resp.answer}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Questions Management Tab */}
        {activeTab === 'questions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Manage Questions</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn btn-primary"
              >
                Add New Question
              </button>
            </div>
            
            {/* Add Question Form */}
            {showAddForm && (
              <div className="card" style={{ marginBottom: '20px', backgroundColor: 'var(--light-yellow)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Add New Question</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleQuestionSubmit(newQuestion);
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      Question Text:
                    </label>
                    <textarea
                      value={newQuestion.text}
                      onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid var(--light-gray)',
                        borderRadius: '4px',
                        fontSize: '16px',
                        minHeight: '80px'
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      Question Type:
                    </label>
                    <select
                      value={newQuestion.type}
                      onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value})}
                      style={{
                        padding: '12px',
                        border: '2px solid var(--light-gray)',
                        borderRadius: '4px',
                        fontSize: '16px'
                      }}
                    >
                      <option value="single_choice">Single Choice</option>
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="multiple_choice_limited">Multiple Choice (Limited)</option>
                      <option value="text">Text Response</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      Order:
                    </label>
                    <input
                      type="number"
                      value={newQuestion.order}
                      onChange={(e) => setNewQuestion({...newQuestion, order: parseInt(e.target.value)})}
                      style={{
                        padding: '12px',
                        border: '2px solid var(--light-gray)',
                        borderRadius: '4px',
                        fontSize: '16px',
                        width: '100px'
                      }}
                      min="1"
                      required
                    />
                  </div>

                  {newQuestion.type !== 'text' && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                        Options:
                      </label>
                      {newQuestion.options.map((option, index) => (
                        <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(newQuestion, setNewQuestion, index, e.target.value)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              border: '2px solid var(--light-gray)',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                            placeholder={`Option ${index + 1}`}
                          />
                          {newQuestion.options.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeOption(newQuestion, setNewQuestion, index)}
                              style={{
                                padding: '8px 12px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(newQuestion, setNewQuestion)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: 'var(--primary-yellow)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Add Option
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn btn-primary">
                      Add Question
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewQuestion({
                          text: '',
                          type: 'single_choice',
                          options: [''],
                          order: 1
                        });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Edit Question Form */}
            {editingQuestion && (
              <div className="card" style={{ marginBottom: '20px', backgroundColor: 'var(--light-yellow)' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Edit Question</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleQuestionSubmit(editingQuestion, true);
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      Question Text:
                    </label>
                    <textarea
                      value={editingQuestion.text}
                      onChange={(e) => setEditingQuestion({...editingQuestion, text: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid var(--light-gray)',
                        borderRadius: '4px',
                        fontSize: '16px',
                        minHeight: '80px'
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      Question Type:
                    </label>
                    <select
                      value={editingQuestion.type}
                      onChange={(e) => setEditingQuestion({...editingQuestion, type: e.target.value})}
                      style={{
                        padding: '12px',
                        border: '2px solid var(--light-gray)',
                        borderRadius: '4px',
                        fontSize: '16px'
                      }}
                    >
                      <option value="single_choice">Single Choice</option>
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="multiple_choice_limited">Multiple Choice (Limited)</option>
                      <option value="text">Text Response</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      Order:
                    </label>
                    <input
                      type="number"
                      value={editingQuestion.order}
                      onChange={(e) => setEditingQuestion({...editingQuestion, order: parseInt(e.target.value)})}
                      style={{
                        padding: '12px',
                        border: '2px solid var(--light-gray)',
                        borderRadius: '4px',
                        fontSize: '16px',
                        width: '100px'
                      }}
                      min="1"
                      required
                    />
                  </div>

                  {editingQuestion.type !== 'text' && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                        Options:
                      </label>
                      {editingQuestion.options.map((option, index) => (
                        <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(editingQuestion, setEditingQuestion, index, e.target.value)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              border: '2px solid var(--light-gray)',
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}
                            placeholder={`Option ${index + 1}`}
                          />
                          {editingQuestion.options.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeOption(editingQuestion, setEditingQuestion, index)}
                              style={{
                                padding: '8px 12px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(editingQuestion, setEditingQuestion)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: 'var(--primary-yellow)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Add Option
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn btn-primary">
                      Update Question
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(null)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="card">
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Current Questions</h3>
              {questions.map((question, index) => (
                <div key={question.id} style={{ 
                  padding: '16px', 
                  marginBottom: '16px', 
                  backgroundColor: 'var(--light-gray)', 
                  borderRadius: '8px',
                  border: '1px solid var(--dark-gray)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '16px' }}>Q{question.order}: {question.text}</strong>
                      <div style={{ marginTop: '8px', fontSize: '14px', color: 'var(--dark-gray)' }}>
                        Type: {question.type.replace('_', ' ')}
                        {question.options && (
                          <div style={{ marginTop: '4px' }}>
                            Options: {question.options.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setEditingQuestion(question)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'var(--primary-yellow)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lucky Draw Tab */}
        {activeTab === 'draw' && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '20px' }}>Lucky Draw</h2>
            
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>
                ₹500 Amazon Voucher Draw
              </h3>
              
              <p style={{ fontSize: '18px', marginBottom: '30px', color: 'var(--dark-gray)' }}>
                Total Eligible Participants: <strong>{responses.length}</strong>
              </p>

              {!winner ? (
                <button
                  onClick={conductLuckyDraw}
                  disabled={drawLoading || responses.length === 0}
                  className="btn btn-primary"
                  style={{ fontSize: '18px', padding: '16px 32px' }}
                >
                  {drawLoading ? 'Conducting Draw...' : 'Conduct Lucky Draw'}
                </button>
              ) : (
                <div style={{ 
                  backgroundColor: 'var(--light-yellow)', 
                  padding: '30px', 
                  borderRadius: '12px',
                  border: '2px solid var(--primary-yellow)'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</div>
                  <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>
                    Winner Selected!
                  </h3>
                  <div style={{ fontSize: '18px', marginBottom: '12px' }}>
                    <strong>Email:</strong> {winner.email}
                  </div>
                  <div style={{ fontSize: '18px', marginBottom: '12px' }}>
                    <strong>Referral Code:</strong> {winner.referralCode}
                  </div>
                  <div style={{ fontSize: '16px', color: 'var(--dark-gray)' }}>
                    Submitted: {new Date(winner.submittedAt).toLocaleString()}
                  </div>
                </div>
              )}

              {responses.length === 0 && (
                <p style={{ color: 'var(--dark-gray)', marginTop: '20px' }}>
                  No eligible participants yet. Wait for survey submissions.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Timer Control Tab */}
        {activeTab === 'timer' && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '20px' }}>Timer Control</h2>
            
            <div className="card">
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
                Survey Timer Management
              </h3>
              
              {timerSettings && (
                <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'var(--light-gray)', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>Current Status:</h4>
                  <p style={{ marginBottom: '8px' }}>
                    <strong>End Date:</strong> {new Date(timerSettings.endDate).toLocaleString()}
                  </p>
                  <p style={{ marginBottom: '0' }}>
                    <strong>Status:</strong> 
                    <span style={{ 
                      color: timerSettings.isActive ? 'green' : 'red',
                      fontWeight: '600',
                      marginLeft: '8px'
                    }}>
                      {timerSettings.isActive ? 'Active' : 'Stopped'}
                    </span>
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Reset Timer (Days from now):
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={customDays}
                      onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                      style={{
                        padding: '8px 12px',
                        border: '2px solid var(--light-gray)',
                        borderRadius: '4px',
                        width: '80px',
                        fontSize: '16px'
                      }}
                    />
                    <span style={{ color: 'var(--dark-gray)' }}>days</span>
                  </div>
                  <button
                    onClick={() => handleTimerAction('reset')}
                    disabled={timerLoading}
                    className="btn btn-primary"
                    style={{ marginRight: '10px' }}
                  >
                    {timerLoading ? 'Updating...' : 'Reset Timer'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleTimerAction('start')}
                    disabled={timerLoading}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
                  >
                    {timerLoading ? 'Starting...' : 'Start Survey'}
                  </button>
                  <button
                    onClick={() => handleTimerAction('stop')}
                    disabled={timerLoading}
                    className="btn btn-secondary"
                    style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
                  >
                    {timerLoading ? 'Stopping...' : 'Stop Timer'}
                  </button>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--dark-gray)', marginTop: '8px' }}>
                  Start/Stop controls the survey availability without changing the end date
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
