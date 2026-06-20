import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { roadmapAPI } from '../services/api';
import { 
  CheckSquare, Square, ExternalLink, Calendar, 
  Award, Compass, Loader2, AlertCircle, RefreshCw 
} from 'lucide-react';

const Roadmap = () => {
  const location = useLocation();
  const [roadmap, setRoadmap] = useState(location.state?.roadmapData || null);
  const [activePeriod, setActivePeriod] = useState('thirty_day'); // thirty_day, sixty_day, ninety_day
  const [loading, setLoading] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!roadmap) {
      fetchActiveRoadmap();
    }
  }, [roadmap]);

  const fetchActiveRoadmap = async () => {
    setLoading(true);
    setErr('');
    try {
      const response = await roadmapAPI.getActive();
      setRoadmap(response.data);
    } catch (error) {
      setErr('No active preparation roadmap found. You can generate one from the Skill Gap tab.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId, currentCompleted) => {
    setTogglingTaskId(taskId);
    try {
      const response = await roadmapAPI.toggleTask(taskId, !currentCompleted);
      setRoadmap(response.data);
    } catch (error) {
      console.error('Failed to toggle task progress:', error);
    } finally {
      setTogglingTaskId(null);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setErr('');
    try {
      const response = await roadmapAPI.generate();
      setRoadmap(response.data);
    } catch (error) {
      setErr('Failed to regenerate roadmap.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate task statistics
  const plans = roadmap?.plans || {};
  const completedTasks = new Set(roadmap?.completed_tasks || []);
  
  const allTasks = [
    ...(plans.thirty_day || []),
    ...(plans.sixty_day || []),
    ...(plans.ninety_day || [])
  ];

  const totalTasks = allTasks.length;
  const completedCount = allTasks.filter(t => completedTasks.has(t.id)).length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const currentTasks = plans[activePeriod] || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Personalized Roadmap</h1>
          <p className="text-gray-400 mt-1">Structured 30/60/90-day learning curriculum tailored to fill your skill gaps</p>
        </div>
        {roadmap && (
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-2 bg-gray-800 text-gray-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 hover:text-white transition-all border border-gray-700 whitespace-nowrap self-start"
          >
            <RefreshCw size={16} />
            Regenerate Roadmap
          </button>
        )}
      </div>

      {err && (
        <div className="mb-8 p-6 glassmorphism border border-yellow-500/20 rounded-xl flex items-start gap-4">
          <AlertCircle size={24} className="text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white text-base">Roadmap Setup Required</h3>
            <p className="text-gray-400 text-sm mt-1 leading-relaxed">{err}</p>
            <button
              onClick={handleRegenerate}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all shadow-md"
            >
              Generate Roadmap Now
            </button>
          </div>
        </div>
      )}

      {roadmap && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: Progress summary card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glassmorphism p-6 rounded-2xl border border-gray-800 text-center flex flex-col items-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold mb-4">Total Curriculum Progress</span>
              
              <div className="relative w-32 h-32 rounded-full border-4 border-blue-500/20 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-blue-400 tracking-tight">{completionRate}%</span>
                <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wide">Completed</span>
                <div 
                  className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent pointer-events-none transition-all duration-500"
                  style={{ transform: `rotate(${(completionRate * 3.6) - 90}deg)` }}
                ></div>
              </div>

              <div className="mt-6 text-gray-400 text-xs flex flex-col gap-1">
                <span className="font-bold text-white text-sm">{completedCount} of {totalTasks} Tasks</span>
                <span>Study material covered</span>
              </div>
            </div>

            {/* Checklist details tips */}
            <div className="glassmorphism p-6 rounded-2xl border border-gray-800 text-gray-400 text-xs space-y-3 leading-relaxed">
              <h4 className="font-bold text-white text-sm">Roadmap Instructions</h4>
              <p>1. Start with the **30-Day Plan** targeting core coding practices and initial missing topics.</p>
              <p>2. Advance to the **60-Day Plan** adding systems integration, algorithms, and databases.</p>
              <p>3. Complete with the **90-Day Plan** focusing on system design and mock round preparations.</p>
              <p className="text-yellow-500/80">Check task boxes to track your live learning progress on the Dashboard.</p>
            </div>
          </div>

          {/* Right Column: Active schedule list */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Nav tabs */}
            <div className="flex border-b border-gray-800 space-x-2">
              <button
                onClick={() => setActivePeriod('thirty_day')}
                className={`py-3 px-6 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 ${
                  activePeriod === 'thirty_day'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-800'
                }`}
              >
                <Calendar size={16} />
                30-Day Focus
              </button>
              <button
                onClick={() => setActivePeriod('sixty_day')}
                className={`py-3 px-6 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 ${
                  activePeriod === 'sixty_day'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-800'
                }`}
              >
                <Calendar size={16} />
                60-Day Focus
              </button>
              <button
                onClick={() => setActivePeriod('ninety_day')}
                className={`py-3 px-6 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2 ${
                  activePeriod === 'ninety_day'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-800'
                }`}
              >
                <Calendar size={16} />
                90-Day Focus
              </button>
            </div>

            {/* Task list container */}
            <div className="space-y-4">
              {currentTasks.length > 0 ? (
                currentTasks.map((task) => {
                  const isCompleted = completedTasks.has(task.id);
                  const isToggling = togglingTaskId === task.id;
                  
                  return (
                    <div 
                      key={task.id} 
                      className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                        isCompleted
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : 'border-gray-800 bg-gray-900/40 hover:border-gray-700/80'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleTask(task.id, isCompleted)}
                        disabled={isToggling}
                        className={`mt-0.5 shrink-0 transition-colors ${
                          isCompleted ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-400'
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : isCompleted ? (
                          <CheckSquare size={20} />
                        ) : (
                          <Square size={20} />
                        )}
                      </button>

                      <div className="flex-grow space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className={`font-bold text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>
                            {task.topic}
                          </h4>
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-gray-800 text-indigo-400 border border-gray-700 rounded-md">
                            {task.category}
                          </span>
                        </div>

                        <p className="text-xs text-gray-400 leading-relaxed">
                          {task.description}
                        </p>

                        {task.resources?.length > 0 && (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-gray-800/40 mt-3">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Resources:</span>
                            {task.resources.map((res, rIdx) => (
                              <a
                                key={rIdx}
                                href={res.startsWith('http') ? res : `https://google.com/search?q=${encodeURIComponent(res)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                              >
                                {res}
                                <ExternalLink size={10} />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-gray-400 text-sm">
                  No learning tasks defined for this stage.
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default Roadmap;
