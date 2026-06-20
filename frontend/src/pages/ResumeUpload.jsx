import React, { useState, useEffect } from 'react';
import { resumeAPI, parseError } from '../services/api';
import { 
  UploadCloud, FileText, CheckCircle2, User, Mail, 
  BookOpen, Code, FolderGit2, Briefcase, Award, Loader2, AlertCircle 
} from 'lucide-react';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const fetchProfileDetails = async () => {
    try {
      const response = await resumeAPI.getDetails();
      setProfile(response.data);
    } catch (err) {
      // Not uploaded yet
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setMsg({ text: '', type: '' });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMsg({ text: 'Please select a resume file first.', type: 'err' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setParsing(true);
    setMsg({ text: '', type: '' });

    try {
      const response = await resumeAPI.upload(formData);
      setProfile(response.data);
      setMsg({ text: 'Resume uploaded and parsed successfully!', type: 'success' });
      setFile(null);
    } catch (err) {
      setMsg({ 
        text: parseError(err, 'Failed to parse resume. Ensure file format is valid.'), 
        type: 'err' 
      });
    } finally {
      setParsing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const parsed = profile?.parsed_data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Resume Parsing</h1>
        <p className="text-gray-400 mt-1">Upload your resume in PDF or DOCX format to analyze your skills profile</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glassmorphism p-6 rounded-2xl border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-4">Upload Document</h3>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-gray-700 hover:border-blue-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors relative">
                <input 
                  type="file" 
                  accept=".pdf,.docx,.doc" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud size={40} className="text-gray-500 mb-3" />
                <span className="text-sm font-semibold text-gray-300 text-center">
                  {file ? file.name : 'Select PDF or DOCX file'}
                </span>
                <span className="text-xs text-gray-500 mt-1">Max file size: 5MB</span>
              </div>

              {msg.text && (
                <div className={`p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  msg.type === 'success' 
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                }`}>
                  {msg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {msg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={parsing || !file}
                className="w-full gradient-btn text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all text-sm shadow-blue-500/10"
              >
                {parsing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Parsing with AI...
                  </>
                ) : (
                  <>
                    <FileText size={16} />
                    Parse Resume
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="glassmorphism p-6 rounded-2xl border border-gray-800">
            <h4 className="font-bold text-white text-sm mb-2">Why parse your resume?</h4>
            <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
              <li>Automatic skill gap calculations.</li>
              <li>Generates custom mock interview questions.</li>
              <li>Identifies target compatibility with leading firms.</li>
              <li>Optimizes your roadmap timeline focus.</li>
            </ul>
          </div>
        </div>

        {/* Profile Card Column */}
        <div className="lg:col-span-2">
          {parsed ? (
            <div className="glassmorphism p-8 rounded-2xl border border-gray-800 space-y-8">
              
              {/* Header profile details */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-800 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center shadow-inner">
                    <User size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">{parsed.name || 'Candidate Name'}</h2>
                    <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                      <Mail size={12} />
                      <span>{parsed.email || 'email@example.com'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full">
                    Last Parsed: {new Date(profile.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Education section */}
              {parsed.education?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BookOpen size={18} className="text-blue-400" />
                    Education
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parsed.education.map((edu, idx) => (
                      <div key={idx} className="p-4 bg-gray-900/40 border border-gray-800 rounded-xl">
                        <h4 className="font-bold text-white text-sm">{edu.degree}</h4>
                        <p className="text-xs text-gray-400 mt-1">{edu.institution}</p>
                        <div className="flex justify-between text-[11px] text-gray-500 mt-3 border-t border-gray-800/60 pt-2">
                          <span>Graduation: {edu.year || 'N/A'}</span>
                          <span>Score: {edu.gpa || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills section */}
              {parsed.skills?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Code size={18} className="text-indigo-400" />
                    Skills Extracted ({parsed.skills.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {parsed.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1.5 text-xs font-semibold bg-gray-800/80 border border-gray-700/50 rounded-lg text-gray-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects section */}
              {parsed.projects?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FolderGit2 size={18} className="text-purple-400" />
                    Academic/Personal Projects
                  </h3>
                  <div className="space-y-4">
                    {parsed.projects.map((proj, idx) => (
                      <div key={idx} className="p-4 bg-gray-900/40 border border-gray-800 rounded-xl space-y-2">
                        <h4 className="font-bold text-white text-sm">{proj.title}</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">{proj.description}</p>
                        {proj.technologies?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {proj.technologies.map((t, tIdx) => (
                              <span key={tIdx} className="px-2 py-0.5 text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience */}
              {parsed.experience?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Briefcase size={18} className="text-emerald-400" />
                    Work Experience
                  </h3>
                  <div className="space-y-4">
                    {parsed.experience.map((exp, idx) => (
                      <div key={idx} className="p-4 bg-gray-900/40 border border-gray-800 rounded-xl">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="font-bold text-white text-sm">{exp.role}</h4>
                          <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full whitespace-nowrap">{exp.duration}</span>
                        </div>
                        <p className="text-xs text-indigo-400 mt-0.5 font-medium">{exp.company}</p>
                        <p className="text-xs text-gray-400 mt-2 leading-relaxed">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {parsed.certifications?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Award size={18} className="text-rose-400" />
                    Certifications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {parsed.certifications.map((cert, idx) => (
                      <span key={idx} className="px-3 py-1.5 text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="glassmorphism p-12 rounded-2xl border border-gray-800 flex flex-col items-center justify-center text-center text-gray-400 h-full min-h-[400px]">
              <FileText size={48} className="text-gray-600 mb-4" />
              <h3 className="text-lg font-bold text-white">No Resume Profile Parsed</h3>
              <p className="text-sm mt-2 max-w-sm leading-relaxed">
                Please upload your resume using the upload card. Once parsed, your visual profile stats will appear here.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ResumeUpload;
