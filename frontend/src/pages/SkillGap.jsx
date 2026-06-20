import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { companyAPI, roadmapAPI } from '../services/api';
import { 
  CheckCircle2, AlertCircle, Compass, 
  Award, RefreshCw, Loader2, ArrowRight, TrendingUp 
} from 'lucide-react';

const SkillGap = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [gapData, setGapData] = useState(location.state?.gapData || null);
  const [loading, setLoading] = useState(false);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!gapData) {
      fetchLatestAnalysis();
    }
  }, [gapData]);

  const fetchLatestAnalysis = async () => {
    setLoading(true);
    setErr('');
    try {
      // Default query for google preset if nothing analyzed yet
      const response = await companyAPI.analyzeGap('Google');
      setGapData(response.data);
    } catch (error) {
      setErr('No active skill gap analysis reports found. Please select a target company first.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    setGeneratingRoadmap(true);
    setErr('');
    try {
      const response = await roadmapAPI.generate();
      navigate('/roadmap', { state: { roadmapData: response.data } });
    } catch (error) {
      setErr('Failed to generate roadmap. Ensure you have missing skills analyzed.');
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const getATSColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    if (score >= 60) return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Skill Gap & ATS Report</h1>
          <p className="text-gray-400 mt-1">Comparing your resume with {gapData?.target_company || 'target company'} requirements</p>
        </div>
        <Link
          to="/company"
          className="flex items-center gap-2 bg-gray-800 text-gray-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 hover:text-white transition-all border border-gray-700 whitespace-nowrap self-start"
        >
          <RefreshCw size={16} />
          Change Target
        </Link>
      </div>

      {err && (
        <div className="mb-8 p-6 glassmorphism border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400">
          <AlertCircle size={24} className="shrink-0" />
          <div>
            <h3 className="font-bold text-white text-base">Analysis Error</h3>
            <p className="text-gray-400 text-sm mt-0.5">{err}</p>
          </div>
        </div>
      )}

      {gapData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: ATS Score Cards */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* ATS Score card */}
            <div className="glassmorphism p-6 rounded-2xl border border-gray-800 text-center flex flex-col items-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-extrabold mb-4">ATS Compatibility Score</span>
              <div className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center ${getATSColor(gapData.ats_score)}`}>
                <span className="text-4xl font-extrabold tracking-tight">{gapData.ats_score}%</span>
                <span className="text-[10px] font-bold mt-1 text-gray-300">ATS Rating</span>
              </div>
              <p className="text-gray-400 text-xs mt-6 leading-relaxed max-w-[200px] mx-auto">
                Based on key terms, phrase matching, and structural keyword compatibility.
              </p>
            </div>

            {/* Resume Match percentage card */}
            <div className="glassmorphism p-6 rounded-2xl border border-gray-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shadow-inner"><TrendingUp size={24} /></div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold">Skill Match Percentage</span>
                <span className="text-2xl font-extrabold text-white block mt-0.5">{gapData.match_percentage}%</span>
              </div>
            </div>

            {/* Quick action card */}
            <div className="glassmorphism p-6 rounded-2xl border border-gray-800 space-y-4">
              <h4 className="font-bold text-white text-sm">Action Recommendation</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Generate a personalized roadmap targeting all detected {gapData.missing_skills?.length} missing skills to improve your compatibility score.
              </p>
              <button
                onClick={handleGenerateRoadmap}
                disabled={generatingRoadmap || gapData.missing_skills?.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all text-sm shadow-lg shadow-blue-500/10"
              >
                {generatingRoadmap ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating Roadmap...
                  </>
                ) : (
                  <>
                    <Compass size={16} />
                    Generate Roadmap
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Right Column: Matched and Missing Skills Listing */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Missing Skills card */}
            <div className="glassmorphism p-6 rounded-2xl border border-gray-800 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                  <AlertCircle size={18} />
                  Missing Skills ({gapData.missing_skills?.length})
                </h3>
                <span className="text-[10px] font-semibold text-gray-400 uppercase bg-gray-800 px-2 py-0.5 rounded-full">Gap Areas</span>
              </div>
              
              {gapData.missing_skills?.length > 0 ? (
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {gapData.missing_skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1.5 text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-400 text-xs py-2">
                  <CheckCircle2 size={16} />
                  <span>Congratulations! No missing skills detected. You match 100% of target company keywords.</span>
                </div>
              )}
            </div>

            {/* Matched Skills card */}
            <div className="glassmorphism p-6 rounded-2xl border border-gray-800 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  Matched Skills ({gapData.matching_skills?.length})
                </h3>
                <span className="text-[10px] font-semibold text-gray-400 uppercase bg-gray-800 px-2 py-0.5 rounded-full">Strengths</span>
              </div>

              {gapData.matching_skills?.length > 0 ? (
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {gapData.matching_skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs">No matching skills detected. Ensure your resume contains appropriate keywords.</p>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default SkillGap;
