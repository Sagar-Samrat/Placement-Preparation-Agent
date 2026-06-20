import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { 
  TrendingUp, Award, AlertCircle, CheckCircle2, 
  ArrowRight, FileText, Compass, Mic, BookOpen, Clock, 
  Activity, Bell, Search, Star, Sparkles, Trophy, Calendar, CheckSquare
} from 'lucide-react';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, PieChart, Pie, Cell, Tooltip
} from 'recharts';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getData();
      setData(response.data);
    } catch (error) {
      console.error('Failed to load live dashboard data. Using premium default preset.', error);
    } finally {
      setLoading(false);
    }
  };

  // Pre-process dynamic data or fall back to high-fidelity mockup values
  const hasLiveAnalysis = data && data.ats_score > 0;
  
  const atsScoreVal = hasLiveAnalysis ? Math.round(data.ats_score) : 86;
  const matchScoreVal = hasLiveAnalysis ? Math.round(data.resume_match_percentage) : 82;
  const missingCountVal = hasLiveAnalysis ? data.missing_skills_count : 7;
  const readinessVal = hasLiveAnalysis ? Math.round(data.placement_readiness_score) : 78;
  const matchedCountVal = hasLiveAnalysis ? (data.matching_skills?.length || 0) : 28;
  const learnedCountVal = hasLiveAnalysis ? (data.skills_learned_count || 0) : 28;
  const totalSkillsVal = hasLiveAnalysis ? data.total_skills_count : 42;

  // Radar match by company data
  const radarData = [
    { subject: 'Google', A: hasLiveAnalysis ? Math.min(matchScoreVal + 3, 98) : 85, B: 100 },
    { subject: 'Amazon', A: hasLiveAnalysis ? Math.min(matchScoreVal - 2, 95) : 80, B: 100 },
    { subject: 'Microsoft', A: hasLiveAnalysis ? Math.min(matchScoreVal, 96) : 82, B: 100 },
    { subject: 'Adobe', A: hasLiveAnalysis ? Math.max(matchScoreVal - 7, 60) : 75, B: 100 },
    { subject: 'Meta', A: hasLiveAnalysis ? Math.max(matchScoreVal - 4, 65) : 78, B: 100 },
  ];

  // Doughnut top skills data
  const pieData = [
    { name: 'Matched Skills', value: matchedCountVal, color: '#10B981' },
    { name: 'Partial Match', value: hasLiveAnalysis ? 0 : 7, color: '#F59E0B' },
    { name: 'Missing Skills', value: missingCountVal, color: '#EF4444' },
  ];

  // Upcoming Tasks default data list
  const upcomingTasks = [
    { id: '1', title: 'Complete DSA Arrays', due: 'Due tomorrow', completed: true },
    { id: '2', title: 'System Design Basics', due: 'Due in 2 days', completed: false },
    { id: '3', title: 'Database Normalization', due: 'Due in 3 days', completed: false },
    { id: '4', title: 'AWS Cloud Practitioner', due: 'Due in 4 days', completed: false }
  ];

  // Recent Performance reports list
  const pastInterviews = data?.interview_performance?.length > 0 
    ? data.interview_performance.slice(0, 3)
    : [
        { company_name: 'Mock Interview 1', round_type: 'Technical Round', overall_score: 86, created_at: 'May 24, 2025' },
        { company_name: 'Mock Interview 2', round_type: 'HR Round', overall_score: 72, created_at: 'May 22, 2025' },
        { company_name: 'Aptitude Test', round_type: 'Quantitative', overall_score: 68, created_at: 'May 21, 2025' }
      ];

  // CS pipeline nodes progress
  const pipelineStages = [
    { name: 'Foundation', completion: 100, color: 'text-emerald-400 border-emerald-500' },
    { name: 'Core Concepts', completion: 75, color: 'text-blue-400 border-blue-500' },
    { name: 'Advanced Topics', completion: 40, color: 'text-purple-400 border-purple-500' },
    { name: 'Interview Prep', completion: 20, color: 'text-amber-400 border-amber-500' },
    { name: 'Placement Ready', completion: 0, color: 'text-gray-500 border-gray-700' }
  ];

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  const CircularIndicator = ({ pct, label, subVal, desc, strokeColor = '#3B82F6', textClass = 'text-blue-400' }) => {
    const radius = 28;
    const circ = 2 * Math.PI * radius;
    const strokeDashoffset = circ - (pct / 100) * circ;
    return (
      <div className="glassmorphism p-5 rounded-2xl border border-gray-800/80 flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="32" cy="32" r={radius} stroke="#161F30" strokeWidth="4.5" fill="transparent" />
            <circle 
              cx="32" cy="32" r={radius} 
              stroke={strokeColor} strokeWidth="4.5" fill="transparent" 
              strokeDasharray={circ} strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-extrabold text-[13px] text-white">{pct}%</span>
        </div>
        <div className="min-w-0">
          <span className="text-gray-400 text-[10px] font-extrabold tracking-wider uppercase block truncate">{label}</span>
          <span className="text-sm font-extrabold text-white mt-0.5 block">{subVal}</span>
          <span className={`text-[10px] font-bold block mt-1 ${textClass}`}>{desc}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      
      {/* Global Top Dashboard Header Row */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-6 border-b border-gray-800/60 mb-8 gap-4">
        
        {/* Left greeting */}
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Good morning, {user?.name?.split(' ')[0] || 'Sagar'}! 👋
          </h1>
          <p className="text-gray-400 text-xs font-semibold">Track your placement preparation progress and achieve your dream job</p>
        </div>

        {/* Right Search, Notification, Profile Row */}
        <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
          
          {/* Mock Search Bar */}
          <div className="relative hidden md:block">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search anything...  ⌘K"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="bg-dark-card border border-dark-border text-xs text-white rounded-xl py-2 pl-9 pr-4 w-52 focus:outline-none focus:border-blue-500/80 transition-colors"
            />
          </div>

          {/* Bell Notifications */}
          <button className="p-2.5 bg-dark-card border border-dark-border text-gray-400 hover:text-white rounded-xl relative transition-all shadow-inner">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500"></span>
          </button>

          {/* Profile indicator */}
          <div className="flex items-center gap-2.5 bg-dark-card border border-dark-border px-3 py-1.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm text-white">
              {user?.name?.[0] || 'S'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-extrabold text-white block leading-none">{user?.name || 'Sagar'}</span>
              <span className="text-[9px] text-gray-500 block mt-0.5">{user?.email || 'sagar@example.com'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid: Left Panel (Stats and Charts) + Right Panel (Tasks and Streak) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT COLUMN: Main dashboard widgets (span 3) */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Header Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 glassmorphism p-5 rounded-2xl border border-gray-800">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl"><Sparkles size={20} /></span>
              <div>
                <h4 className="text-xs font-bold text-white">Ready for evaluation?</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Let AI conduct a mock interview or check your ATS match rating.</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Link 
                to="/interview"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/10 transition-all"
              >
                <Mic size={14} />
                Start Mock Interview
              </Link>
              <Link 
                to="/resume"
                className="flex items-center gap-2 bg-dark-card border border-dark-border text-gray-300 hover:text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all"
              >
                <FileText size={14} />
                Upload Resume
              </Link>
            </div>
          </div>

          {/* Row of 4 Circular Stats Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* 1. Placement Readiness */}
            <CircularIndicator 
              pct={readinessVal} 
              label="Placement Readiness" 
              subVal="Advanced" 
              desc="+12% this week ↗" 
              strokeColor="#8B5CF6" 
              textClass="text-indigo-400" 
            />

            {/* 2. Resume Match Score */}
            <CircularIndicator 
              pct={matchScoreVal} 
              label="Resume Match Score" 
              subVal="Great Match" 
              desc="+15% this week ↗" 
              strokeColor="#3B82F6" 
              textClass="text-blue-400" 
            />

            {/* 3. ATS Score */}
            <CircularIndicator 
              pct={atsScoreVal} 
              label="ATS Score" 
              subVal="Excellent" 
              desc="+10% this week ↗" 
              strokeColor="#10B981" 
              textClass="text-emerald-400" 
            />

            {/* 4. Skills Gap */}
            <CircularIndicator 
              pct={hasLiveAnalysis ? Math.round((learnedCountVal / totalSkillsVal) * 100) : 67} 
              label="Skills Gap" 
              subVal={`${missingCountVal} Skills Missing`} 
              desc={`Improve ${missingCountVal} skills`} 
              strokeColor="#F59E0B" 
              textClass="text-amber-400" 
            />

          </div>

          {/* Middle Charts: Radar Matching + Doughnut Skills Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Chart: Radar matching */}
            <div className="glassmorphism p-6 rounded-2xl border border-gray-800 flex flex-col justify-between h-[380px]">
              <div>
                <h3 className="text-sm font-extrabold text-white">Resume Match by Company</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Compatibility percentage matched across top hiring firms</p>
              </div>
              
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#243249" />
                    <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#243249" tick={false} />
                    <Radar name="Match Score" dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.25} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#161F30', borderColor: '#243249' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Chart: Doughnut skills count */}
            <div className="glassmorphism p-6 rounded-2xl border border-gray-800 flex flex-col justify-between h-[380px]">
              <div>
                <h3 className="text-sm font-extrabold text-white">Top Skills Breakdown</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Overview of targeted keywords matching target presets</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 flex-grow">
                {/* Visual Circle */}
                <div className="h-48 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Absolute Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-white">{totalSkillsVal}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Total Skills</span>
                  </div>
                </div>

                {/* Legends */}
                <div className="space-y-3.5 pr-2">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs border-b border-gray-800/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span className="text-gray-400 font-medium">{item.name}</span>
                      </div>
                      <span className="font-extrabold text-white">
                        {item.value} <span className="text-[10px] text-gray-500 font-normal">({Math.round((item.value / totalSkillsVal) * 100)}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Learning Roadmap Pipelines Timeline */}
          <div className="glassmorphism p-6 rounded-2xl border border-gray-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white">Learning Roadmap Progress</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Syllabus progression milestone status tracker</p>
              </div>
              <select className="bg-dark-card border border-dark-border text-[10px] font-bold rounded-lg py-1.5 px-3 text-gray-300 focus:outline-none">
                <option>90-Day Plan</option>
                <option>60-Day Plan</option>
                <option>30-Day Plan</option>
              </select>
            </div>

            {/* Horizontal Timeline Pipeline */}
            <div className="relative pt-2 pb-4">
              <div className="absolute top-[28px] left-[5%] right-[5%] h-1 bg-gray-800/80 -z-10 rounded-full">
                <div className="bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500 h-full rounded-full" style={{ width: '47%' }}></div>
              </div>
              
              <div className="flex justify-between items-start w-full">
                {pipelineStages.map((stage, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center w-[18%]">
                    {/* Circle Node */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-dark-card text-xs font-bold transition-all shadow-md ${
                      stage.completion > 0 
                        ? 'border-blue-500 text-blue-400 shadow-blue-500/10'
                        : 'border-gray-800 text-gray-500'
                    }`}>
                      {stage.completion === 100 ? '✓' : idx + 1}
                    </div>
                    {/* Name */}
                    <span className="text-[10px] text-white font-extrabold mt-3">{stage.name}</span>
                    {/* Percentage indicator */}
                    <span className={`text-[9px] font-bold mt-1 ${
                      stage.completion === 100 ? 'text-emerald-400' : (stage.completion > 0 ? 'text-blue-400' : 'text-gray-500')
                    }`}>
                      {stage.completion}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Master Progress Details */}
            <div className="pt-4 border-t border-gray-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-semibold">Overall Progress:</span>
                <span className="font-extrabold text-white">47%</span>
              </div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">42 of 90 days completed</span>
            </div>
          </div>

          {/* Bottom Grid: Insights, Focus Areas, Achievements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Section 1: AI Interview Insights */}
            <div className="glassmorphism p-5 rounded-2xl border border-gray-800 flex flex-col justify-between h-[300px]">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800/60">
                <h4 className="text-xs font-extrabold text-white">AI Interview Insights</h4>
                <Link to="/interview" className="text-[10px] font-bold text-blue-400 hover:text-blue-300">View Details</Link>
              </div>

              <div className="flex items-center justify-center gap-4 flex-grow my-2">
                {/* Circular Gauge */}
                <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 flex flex-col items-center justify-center relative shadow-inner shrink-0">
                  <span className="text-2xl font-extrabold text-indigo-400">76</span>
                  <span className="text-[8px] font-bold text-gray-400 uppercase">Avg Score</span>
                </div>
                {/* Dimensions metrics list */}
                <div className="space-y-2 flex-grow pr-1">
                  {[
                    { name: 'Technical', score: 78 },
                    { name: 'Communication', score: 74 },
                    { name: 'Problem Solving', score: 75 },
                    { name: 'Confidence', score: 77 }
                  ].map((dim, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-400 font-semibold">{dim.name}</span>
                      <span className="font-extrabold text-white">{dim.score}/100</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: Skills Focus */}
            <div className="glassmorphism p-5 rounded-2xl border border-gray-800 flex flex-col justify-between h-[300px]">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800/60">
                <h4 className="text-xs font-extrabold text-white">Skills You Should Focus On</h4>
                <Link to="/roadmap" className="text-[10px] font-bold text-blue-400 hover:text-blue-300">View All</Link>
              </div>

              {/* Skills prioritization labels lists */}
              <div className="grid grid-cols-2 gap-2 flex-grow my-4 content-center">
                {[
                  { name: 'System Design', prio: 'High Priority', color: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
                  { name: 'AWS', prio: 'High Priority', color: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
                  { name: 'Docker', prio: 'Medium Priority', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
                  { name: 'Kubernetes', prio: 'Medium Priority', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
                  { name: 'GraphQL', prio: 'Low Priority', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
                  { name: 'CI/CD', prio: 'Low Priority', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' }
                ].map((s, idx) => (
                  <div key={idx} className="p-2.5 bg-gray-900/40 border border-gray-800 rounded-xl">
                    <span className="font-extrabold text-[10px] text-white block truncate">{s.name}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border inline-block mt-1.5 ${s.color}`}>
                      {s.prio}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Achievements */}
            <div className="glassmorphism p-5 rounded-2xl border border-gray-800 flex flex-col justify-between h-[300px]">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800/60">
                <h4 className="text-xs font-extrabold text-white">Achievements</h4>
                <a href="#" className="text-[10px] font-bold text-blue-400 hover:text-blue-300">View All</a>
              </div>

              {/* Achievements icon cards grid */}
              <div className="grid grid-cols-3 gap-2 flex-grow my-4 items-center">
                {[
                  { name: 'Consistent Learner', label: '12 Day Streak', icon: '🔥', border: 'border-amber-500/20 text-amber-400 bg-amber-500/5' },
                  { name: 'Mock Master', label: '5 Interviews', icon: '🏆', border: 'border-blue-500/20 text-blue-400 bg-blue-500/5' },
                  { name: 'Skill Collector', label: '30+ Skills', icon: '🎯', border: 'border-purple-500/20 text-purple-400 bg-purple-500/5' }
                ].map((ach, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl border text-center space-y-1.5 h-36 flex flex-col justify-center items-center ${ach.border}`}>
                    <span className="text-2xl">{ach.icon}</span>
                    <h5 className="font-extrabold text-[9px] text-white leading-normal truncate w-full">{ach.name}</h5>
                    <span className="text-[8px] text-gray-400 block tracking-tight font-medium">{ach.label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Upcoming tasks, Streaks, Calendar widgets (span 1) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Calendar Widget Card */}
          <div className="glassmorphism p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl"><Calendar size={18} /></span>
              <div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Today's Date</span>
                <span className="text-xs font-extrabold text-white mt-0.5 block">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
            <span className="p-1.5 bg-dark-card border border-dark-border text-gray-400 rounded-lg"><Clock size={16} /></span>
          </div>

          {/* Upcoming Tasks Card Checklist */}
          <div className="glassmorphism p-5 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-800/60">
              <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <CheckSquare size={14} className="text-blue-400" />
                Upcoming Tasks
              </h4>
              <Link to="/roadmap" className="text-[9px] font-bold text-blue-400 hover:text-blue-300">View All</Link>
            </div>
            
            <div className="space-y-2.5">
              {upcomingTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2.5 bg-gray-900/40 border border-gray-800 rounded-xl">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-white block truncate">{t.title}</span>
                    <span className="text-[8px] text-gray-400 block mt-0.5">{t.due}</span>
                  </div>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    t.completed 
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 text-[10px]' 
                      : 'border-gray-700 bg-dark-card'
                  }`}>
                    {t.completed && '✓'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Performance Checklist */}
          <div className="glassmorphism p-5 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-800/60">
              <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Award size={14} className="text-indigo-400" />
                Recent Performance
              </h4>
              <select className="bg-dark-card border border-dark-border text-[8px] font-bold rounded-lg py-1 px-2 text-gray-400">
                <option>This Week</option>
                <option>This Month</option>
              </select>
            </div>

            <div className="space-y-2.5">
              {pastInterviews.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-gray-900/40 border border-gray-800 rounded-xl">
                  <div>
                    <h5 className="font-extrabold text-[10px] text-white block truncate max-w-[120px]">{item.company_name}</h5>
                    <p className="text-[8px] text-gray-400 mt-0.5">{item.round_type}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 text-[9px] font-extrabold border rounded-md ${getScoreColorClass(item.overall_score)}`}>
                      {item.overall_score}/100
                    </span>
                    <span className="text-[7px] text-gray-500 block mt-1">{item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Streak */}
          <div className="glassmorphism p-5 rounded-2xl border border-gray-800 bg-gradient-to-r from-amber-950/20 to-orange-950/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-bounce">🔥</span>
              <div>
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block">Current Streak</span>
                <span className="text-xs font-extrabold text-white mt-0.5 block">12 Days Active</span>
              </div>
            </div>
            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold text-[10px] px-2.5 py-1 rounded-lg">Level 2</span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
