import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyAPI, parseError } from '../services/api';
import { 
  Building, Briefcase, FileText, CheckCircle2, 
  ArrowRight, Loader2, AlertCircle, Cpu, ShieldAlert 
} from 'lucide-react';

const CompanySelection = () => {
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState('');
  const [jdText, setJdText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [parsedJD, setParsedJD] = useState(null);

  const companiesList = [
    { id: 'google', name: 'Google', logo: 'G', desc: 'Search engine, distributed systems, high scaling complexity' },
    { id: 'amazon', name: 'Amazon', logo: 'A', desc: 'E-commerce, AWS cloud, customer obsession leadership principles' },
    { id: 'microsoft', name: 'Microsoft', logo: 'M', desc: 'Azure platforms, operating systems, enterprise software' },
    { id: 'infosys', name: 'Infosys', logo: 'I', desc: 'Enterprise consultancy, software integration lifecycle' },
    { id: 'tcs', name: 'TCS', logo: 'T', desc: 'Global digital consulting, large scale technology solutions' }
  ];

  const handleCompanySelect = async (companyName) => {
    setSelectedCompany(companyName);
    setParsedJD(null);
    setMsg({ text: '', type: '' });
    
    try {
      await companyAPI.select(companyName);
      setMsg({ text: `Selected target company preset: ${companyName}`, type: 'success' });
    } catch (err) {
      setMsg({ text: 'Error registering company preset selection.', type: 'err' });
    }
  };

  const handleJDAnalyze = async (e) => {
    e.preventDefault();
    if (!jdText.trim()) {
      setMsg({ text: 'Please enter job description text.', type: 'err' });
      return;
    }

    setSubmitting(true);
    setMsg({ text: '', type: '' });

    try {
      const response = await companyAPI.analyzeJD(
        selectedCompany || 'Custom Target',
        jdText
      );
      setParsedJD(response.data);
      setMsg({ text: 'Job description analyzed and skills extracted successfully!', type: 'success' });
    } catch (err) {
      setMsg({ 
        text: parseError(err, 'Failed to extract skills. Try again later.'), 
        type: 'err' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedToGapAnalysis = async () => {
    setSubmitting(true);
    setMsg({ text: '', type: '' });

    try {
      const targetCompany = selectedCompany || parsedJD?.company_name || 'Google';
      const jdId = parsedJD?.id || null;
      
      const response = await companyAPI.analyzeGap(targetCompany, jdId);
      // Save analysis results id context if necessary, then navigate to gap page
      navigate('/skill-gap', { state: { gapData: response.data } });
    } catch (err) {
      setMsg({ 
        text: parseError(err, 'Please upload a resume first before performing gap analysis.'), 
        type: 'err' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Target Selection</h1>
        <p className="text-gray-400 mt-1">Select a preset target company or paste a custom Job Description to match your resume skills</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Preset Selector */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glassmorphism p-6 rounded-2xl border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Building size={20} className="text-blue-400" />
              Company Presets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companiesList.map((comp) => (
                <div
                  key={comp.id}
                  onClick={() => handleCompanySelect(comp.name)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-4 ${
                    selectedCompany === comp.name
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 ${
                    selectedCompany === comp.name 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {comp.logo}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{comp.name}</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{comp.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pasting Custom JD */}
          <div className="glassmorphism p-6 rounded-2xl border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-indigo-400" />
              Paste Custom Job Description (JD)
            </h3>
            
            <form onSubmit={handleJDAnalyze} className="space-y-4">
              <div>
                <textarea
                  rows={6}
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste details of the role, requirements, tech stacks, and responsibilities here..."
                  className="w-full bg-gray-900/60 border border-gray-800 focus:border-blue-500 rounded-xl p-4 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-xs leading-relaxed"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !jdText.trim()}
                  className="gradient-btn text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-all text-sm shadow-blue-500/10"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Cpu size={16} />
                      Extract JD Skills
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Active Configuration & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glassmorphism p-6 rounded-2xl border border-gray-800 space-y-6">
            <h3 className="text-lg font-bold text-white">Target Profile Summary</h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Selected Firm</span>
                <span className="text-sm font-extrabold text-white mt-1 block">
                  {selectedCompany || parsedJD?.company_name || 'No Target Selected'}
                </span>
              </div>
              
              {parsedJD && (
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Skills Extracted from Custom JD</span>
                  <div className="flex flex-wrap gap-1.5 mt-2 max-h-48 overflow-y-auto pr-1">
                    {parsedJD.extracted_skills?.map((skill, idx) => (
                      <span key={idx} className="px-2 py-1 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.text && (
              <div className={`p-4 rounded-xl text-xs font-semibold flex items-start gap-2.5 ${
                msg.type === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}>
                {msg.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                <span>{msg.text}</span>
              </div>
            )}

            <button
              onClick={handleProceedToGapAnalysis}
              disabled={submitting || (!selectedCompany && !parsedJD)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all text-sm shadow-lg shadow-blue-500/10"
            >
              Analyze Skill Gap & ATS
              <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="glassmorphism p-6 rounded-2xl border border-gray-800 text-gray-400 text-xs flex gap-3">
            <ShieldAlert size={20} className="text-yellow-500 shrink-0" />
            <p className="leading-relaxed">
              <strong>Important</strong>: Ensure your resume is uploaded before analyzing skill gaps. The system will match your profile skills against company requirements.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CompanySelection;
