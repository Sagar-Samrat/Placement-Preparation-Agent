import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  BarChart2, FileText, Briefcase, Award, Compass, Mic, 
  Settings, HelpCircle, Trophy, BookOpen, Activity, 
  Sparkles, LogOut, Menu, X, Rocket, ChevronRight
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: BarChart2, active: true },
    { label: 'Resume Analysis', path: '/resume', icon: FileText },
    { label: 'Target & JD Match', path: '/company', icon: Briefcase },
    { label: 'Skill Gap', path: '/skill-gap', icon: Award },
    { label: 'Roadmap', path: '/roadmap', icon: Compass, badge: 'New' },
    { label: 'AI Interview', path: '/interview', icon: Mic },
  ];

  // Secondary items for high fidelity visual representation
  const secondaryItems = [
    { label: 'Practice Tests', path: '#', icon: Activity, disabled: true },
    { label: 'Progress Tracker', path: '#', icon: Sparkles, disabled: true },
    { label: 'Resources', path: '#', icon: BookOpen, disabled: true },
    { label: 'Achievements', path: '#', icon: Trophy, disabled: true },
    { label: 'Settings', path: '#', icon: Settings, disabled: true },
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col justify-between py-6 px-4">
      {/* Brand logo */}
      <div>
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Rocket size={18} className="text-white transform -rotate-45" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white leading-none block">PrepAgent AI</span>
            <span className="text-[10px] text-gray-500 font-semibold tracking-wider">Your Placement Partner</span>
          </div>
        </div>

        {/* Primary Menu */}
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/15'
                    : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Secondary Menu Divider */}
        <div className="my-5 border-t border-gray-800/60"></div>

        {/* Secondary Menu */}
        <div className="space-y-1">
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-500 cursor-not-allowed hover:bg-gray-800/20 hover:text-gray-400 transition-colors"
                title="Coming Soon"
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer Cards */}
      <div className="space-y-4">
        {/* Go Premium Card */}
        <div className="bg-gradient-to-b from-indigo-950/40 to-blue-950/20 border border-indigo-500/10 p-4 rounded-2xl text-center space-y-3 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-blue-500/10 rounded-full blur-xl"></div>
          <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-white">Go Premium</h4>
            <p className="text-[10px] text-gray-400 mt-1 leading-normal">Unlock advanced features and boost your preparation</p>
          </div>
          <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-2 rounded-xl text-[10px] shadow-lg shadow-indigo-600/20 transition-all">
            Upgrade Now
          </button>
        </div>

        {/* Logout Row */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <div className="flex items-center gap-3">
            <LogOut size={16} />
            <span>Sign Out</span>
          </div>
          <ChevronRight size={14} className="opacity-40" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden md:block fixed left-0 top-0 h-screen w-64 bg-dark-card border-r border-dark-border z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Top Navbar Header */}
      <header className="md:hidden sticky top-0 left-0 right-0 h-16 bg-dark-card border-b border-dark-border flex items-center justify-between px-4 z-40 glassmorphism">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <Rocket size={14} className="text-white transform -rotate-45" />
          </div>
          <span className="font-extrabold text-sm text-white tracking-wide">PrepAgent AI</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-gray-400 hover:text-white"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile Sidebar Slider */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Overlay click block */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          ></div>
          
          <div className="relative w-64 max-w-xs bg-dark-card border-r border-dark-border h-full z-50 animate-slide-in">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
