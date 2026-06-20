import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { interviewAPI, parseError } from '../services/api';
import { 
  Mic, Sparkles, AlertCircle, ArrowRight, Loader2, 
  Award, MessageSquare, ListTodo, ShieldCheck, RefreshCw, BarChart2 
} from 'lucide-react';

const MockInterview = () => {
  const [searchParams] = useSearchParams();
  const reportId = searchParams.get('results');

  const [step, setStep] = useState('setup'); // setup | ongoing | evaluation | completed
  const [company, setCompany] = useState('Google');
  const [roundType, setRoundType] = useState('Technical');
  
  const [interviewId, setInterviewId] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [answerText, setAnswerText] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [lastEval, setLastEval] = useState(null);
  const [finalReport, setFinalReport] = useState(null);
  const [err, setErr] = useState('');

  // Handle report view if linked from dashboard
  useEffect(() => {
    if (reportId) {
      fetchReport(reportId);
    }
  }, [reportId]);

  const fetchReport = async (id) => {
    setSubmitting(true);
    setErr('');
    try {
      const response = await interviewAPI.getResults(id);
      setFinalReport(response.data);
      setStep('completed');
    } catch (error) {
      setErr('Failed to load interview report details.');
      setStep('setup');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartInterview = async () => {
    setSubmitting(true);
    setErr('');
    try {
      const response = await interviewAPI.start(company, roundType);
      const data = response.data;
      setInterviewId(data.interview_id);
      setCurrentQuestion(data.current_question);
      setQuestionIndex(data.current_question_index);
      setTotalQuestions(data.total_questions);
      setAnswerText('');
      setStep('ongoing');
    } catch (error) {
      setErr(parseError(error, 'Failed to start interview. Ensure your resume is uploaded.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) {
      setErr('Please type or record your response first.');
      return;
    }

    setSubmitting(true);
    setErr('');
    try {
      const response = await interviewAPI.submitAnswer(interviewId, answerText);
      const data = response.data;
      setLastEval(data.question_evaluated.evaluation);
      
      // If completed, fetch full final report
      if (data.interview_status === 'completed') {
        fetchReport(interviewId);
      } else {
        // Prepare next question transition
        setCurrentQuestion(data.next_question);
        setQuestionIndex(data.current_question_index);
        setStep('evaluation');
      }
    } catch (error) {
      setErr('Failed to evaluate response. Try submitting again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setAnswerText('');
    setLastEval(null);
    setStep('ongoing');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    if (score >= 60) return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">AI Mock Interview</h1>
        <p className="text-gray-400 mt-1">Practice realistic technical and HR interview rounds with interactive AI evaluation</p>
      </div>

      {err && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          {err}
        </div>
      )}

      {/* STEP 1: SETUP */}
      {step === 'setup' && (
        <div className="max-w-2xl mx-auto glassmorphism p-8 rounded-2xl border border-gray-800 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 items-center justify-center shadow-inner"><Mic size={24} /></div>
            <h3 className="text-xl font-bold text-white">Setup Interview Round</h3>
            <p className="text-gray-400 text-xs">Configure your mock session specifications</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">Target Company</label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              >
                <option value="Google">Google</option>
                <option value="Amazon">Amazon</option>
                <option value="Microsoft">Microsoft</option>
                <option value="Infosys">Infosys</option>
                <option value="TCS">TCS</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-semibold mb-2">Round Type</label>
              <div className="grid grid-cols-2 gap-3">
                {['Technical', 'HR', 'Behavioral', 'Project Discussion'].map((type) => (
                  <div
                    key={type}
                    onClick={() => setRoundType(type)}
                    className={`p-3 rounded-lg border text-center font-bold text-xs cursor-pointer transition-all ${
                      roundType === type
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    {type}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartInterview}
              disabled={submitting}
              className="w-full gradient-btn text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-4 hover:shadow-lg shadow-blue-500/10 disabled:opacity-50 transition-all text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  Generate Interview Questions
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ONGOING INTERVIEW */}
      {step === 'ongoing' && currentQuestion && (
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex justify-between items-center glassmorphism px-6 py-4 rounded-xl border border-gray-800">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Session Round</span>
              <span className="text-sm font-bold text-white">{company} • {roundType} Round</span>
            </div>
            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full font-bold text-xs">
              Question {questionIndex + 1} of {totalQuestions}
            </span>
          </div>

          {/* Question Display */}
          <div className="glassmorphism p-8 rounded-2xl border border-gray-800 space-y-4 shadow-xl">
            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
              {currentQuestion.category}
            </span>
            <p className="text-lg font-bold text-white leading-relaxed">
              {currentQuestion.question_text}
            </p>
          </div>

          {/* Answer Text Area */}
          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <textarea
              rows={8}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your detailed answer here. To evaluate communication and accuracy, explain your methodology and provide examples..."
              className="w-full bg-gray-900 border border-gray-800 focus:border-blue-500 rounded-2xl p-6 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-xs leading-relaxed"
            ></textarea>

            <div className="flex justify-end gap-3">
              <button
                type="submit"
                disabled={submitting || !answerText.trim()}
                className="gradient-btn text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all text-sm shadow-blue-500/10"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    AI Evaluation in progress...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Evaluate Response
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: QUESTION EVALUATION REPORT */}
      {step === 'evaluation' && lastEval && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="glassmorphism p-6 rounded-2xl border border-gray-800 text-center flex flex-col items-center">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold mb-4">Question Score</span>
            <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center ${getScoreColor(lastEval.score)}`}>
              <span className="text-3xl font-extrabold tracking-tight">{lastEval.score}%</span>
              <span className="text-[9px] font-bold uppercase mt-0.5 text-gray-300">Rating</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glassmorphism p-4 rounded-xl border border-gray-800 text-center">
              <span className="text-gray-400 text-[10px] block font-bold uppercase tracking-wider">Technical</span>
              <span className="text-lg font-bold text-white block mt-1">{lastEval.technical_accuracy}%</span>
            </div>
            <div className="glassmorphism p-4 rounded-xl border border-gray-800 text-center">
              <span className="text-gray-400 text-[10px] block font-bold uppercase tracking-wider">Communication</span>
              <span className="text-lg font-bold text-white block mt-1">{lastEval.communication}%</span>
            </div>
            <div className="glassmorphism p-4 rounded-xl border border-gray-800 text-center">
              <span className="text-gray-400 text-[10px] block font-bold uppercase tracking-wider">Confidence</span>
              <span className="text-lg font-bold text-white block mt-1">{lastEval.confidence}%</span>
            </div>
            <div className="glassmorphism p-4 rounded-xl border border-gray-800 text-center">
              <span className="text-gray-400 text-[10px] block font-bold uppercase tracking-wider">Completeness</span>
              <span className="text-lg font-bold text-white block mt-1">{lastEval.completeness}%</span>
            </div>
          </div>

          <div className="glassmorphism p-6 rounded-xl border border-gray-800 space-y-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <MessageSquare size={16} className="text-blue-400" />
              AI Feedback
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">{lastEval.feedback}</p>

            {lastEval.suggestions?.length > 0 && (
              <div className="pt-4 border-t border-gray-800/60 space-y-2">
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ListTodo size={14} className="text-purple-400" />
                  Key Suggestions for Improvement
                </h5>
                <ul className="text-xs text-gray-400 list-disc list-inside space-y-1.5 leading-relaxed">
                  {lastEval.suggestions.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleNextQuestion}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 text-sm transition-all shadow-md shadow-blue-500/10"
            >
              Go to Next Question
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: INTERVIEW COMPLETED FINAL SCORECARD */}
      {step === 'completed' && finalReport && (
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header Card */}
          <div className="glassmorphism p-8 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner"><Award size={32} /></div>
              <div>
                <h3 className="text-2xl font-extrabold text-white">Interview Scorecard</h3>
                <p className="text-gray-400 text-xs mt-1">{finalReport.company_name} • {finalReport.round_type} Round Assessment</p>
              </div>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold block mb-2">Overall Interview Score</span>
              <span className={`px-4 py-1.5 text-2xl font-extrabold border rounded-xl inline-block ${getScoreColor(finalReport.overall_score)}`}>
                {finalReport.overall_score}%
              </span>
            </div>
          </div>

          {/* Dimension Scores */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glassmorphism p-5 rounded-2xl border border-gray-800 text-center">
              <span className="text-gray-400 text-xs block font-bold uppercase tracking-wider">Technical Accuracy</span>
              <span className="text-2xl font-extrabold text-white block mt-2">{finalReport.category_scores?.accuracy}%</span>
            </div>
            <div className="glassmorphism p-5 rounded-2xl border border-gray-800 text-center">
              <span className="text-gray-400 text-xs block font-bold uppercase tracking-wider">Communication</span>
              <span className="text-2xl font-extrabold text-white block mt-2">{finalReport.category_scores?.communication}%</span>
            </div>
            <div className="glassmorphism p-5 rounded-2xl border border-gray-800 text-center">
              <span className="text-gray-400 text-xs block font-bold uppercase tracking-wider">Confidence Level</span>
              <span className="text-2xl font-extrabold text-white block mt-2">{finalReport.category_scores?.confidence}%</span>
            </div>
            <div className="glassmorphism p-5 rounded-2xl border border-gray-800 text-center">
              <span className="text-gray-400 text-xs block font-bold uppercase tracking-wider">Completeness</span>
              <span className="text-2xl font-extrabold text-white block mt-2">{finalReport.category_scores?.completeness}%</span>
            </div>
          </div>

          {/* Qualitative Detailed Feedback */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glassmorphism p-6 rounded-2xl border border-gray-800 space-y-4">
              <h4 className="font-bold text-white text-base flex items-center gap-1.5 pb-2 border-b border-gray-800">
                <MessageSquare size={18} className="text-blue-400" />
                Aggregated AI Feedback
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed font-normal">{finalReport.detailed_feedback}</p>
            </div>

            <div className="glassmorphism p-6 rounded-2xl border border-gray-800 space-y-4">
              <h4 className="font-bold text-white text-base flex items-center gap-1.5 pb-2 border-b border-gray-800">
                <ListTodo size={18} className="text-purple-400" />
                Priority Action Plan
              </h4>
              <ul className="text-xs text-gray-400 space-y-2">
                {finalReport.suggestions?.length > 0 ? (
                  finalReport.suggestions.map((s, idx) => (
                    <li key={idx} className="flex gap-2 items-start leading-relaxed font-normal">
                      <ShieldCheck size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-400 text-xs">No pending suggestions recorded.</p>
                )}
              </ul>
            </div>
          </div>

          {/* Question Reviews */}
          {finalReport.questions?.length > 0 && (
            <div className="glassmorphism p-6 rounded-2xl border border-gray-800 space-y-6">
              <h4 className="font-bold text-white text-base pb-3 border-b border-gray-800 flex items-center gap-1.5">
                <BarChart2 size={18} className="text-indigo-400" />
                Response-by-Response Audit
              </h4>
              
              <div className="space-y-6">
                {finalReport.questions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-gray-900/40 border border-gray-800/80 rounded-xl space-y-3">
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <span className="font-bold text-xs text-indigo-400">Question {idx + 1} ({q.category})</span>
                      <span className={`px-2.5 py-0.5 text-[10px] font-extrabold border rounded-md ${getScoreColor(q.evaluation?.score)}`}>
                        Score: {q.evaluation?.score}%
                      </span>
                    </div>
                    
                    <p className="font-bold text-white text-xs leading-normal">{q.question_text}</p>
                    
                    <div className="pt-2 border-t border-gray-800/40 space-y-2">
                      <p className="text-[10px] text-gray-500 uppercase font-extrabold tracking-wider">Candidate Response:</p>
                      <p className="text-xs text-gray-300 leading-relaxed font-normal italic">"{q.user_answer}"</p>
                    </div>

                    <div className="pt-2 border-t border-gray-800/40 space-y-2">
                      <p className="text-[10px] text-gray-500 uppercase font-extrabold tracking-wider">AI Evaluation Critique:</p>
                      <p className="text-xs text-gray-400 leading-relaxed font-normal">{q.evaluation?.feedback}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pb-8">
            <button
              onClick={() => {
                setStep('setup');
                setFinalReport(null);
                setLastEval(null);
              }}
              className="flex items-center gap-2 bg-gray-800 text-gray-200 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-700 hover:text-white transition-all border border-gray-700 whitespace-nowrap"
            >
              <RefreshCw size={16} />
              New Mock Interview
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-all shadow-md shadow-blue-500/10"
            >
              Return to Dashboard
              <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      )}
    </div>
  );
};

export default MockInterview;
