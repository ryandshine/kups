import React, { useState } from 'react';
import { Layers, MapPin, Trophy, BookOpen, Home, Menu, X, ShieldCheck, Building2 } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'beranda', label: 'Beranda', icon: <Home className="w-4 h-4" /> },
    { id: 'progres-tier', label: 'Progres Tier', icon: <Layers className="w-4 h-4" /> },
    { id: 'peta-sebaran', label: 'Peta Sebaran', icon: <MapPin className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Direktori & Leaderboard', icon: <Building2 className="w-4 h-4" /> },
    { id: 'tentang', label: 'Tentang & Metodologi', icon: <BookOpen className="w-4 h-4" /> },
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="bg-earth-soil text-earth-sand border-b-2 border-earth-terracotta sticky top-0 z-50">
      {/* Top Ministry Banner */}
      <div className="bg-earth-forest-dark border-b border-earth-forest text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 font-medium">
            <span className="inline-block w-2 h-2 bg-emerald-400"></span>
            <span>KEMENTERIAN KEHUTANAN REPUBLIK INDONESIA</span>
            <span className="hidden sm:inline text-stone-400">|</span>
            <span className="hidden sm:inline text-stone-300">Direktorat Pengembangan Usaha Perhutanan Sosial</span>
          </div>
          <div className="flex items-center space-x-2 text-stone-300 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Portal Publik Resmi (Read-Only)</span>
            <span className="bg-earth-terracotta text-white font-mono text-[10px] px-1.5 py-0.2">LIVE SIPEKAPS</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => handleNavClick('beranda')} 
            className="flex items-center space-x-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 bg-earth-terracotta text-white font-black text-xl flex items-center justify-center border border-earth-terracotta-light">
              K
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-mono">PORTAL KUPS</span>
                <span className="text-xs bg-earth-forest text-white px-1.5 py-0.5 border border-earth-forest-light font-medium">
                  GoKUPS 2026
                </span>
              </div>
              <p className="text-[11px] text-stone-400 -mt-0.5 tracking-wide hidden sm:block">
                Sistem Pemantauan Kelas & Komoditas Perhutanan Sosial
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 text-sm font-semibold transition-colors duration-150 border-b-2 ${
                    isActive
                      ? 'border-earth-terracotta bg-earth-soil-light text-white'
                      : 'border-transparent text-stone-300 hover:text-white hover:bg-earth-soil-light'
                  }`}
                >
                  <span className={isActive ? 'text-earth-terracotta' : 'text-stone-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border border-earth-soil-muted text-earth-sand hover:bg-earth-soil-light focus:outline-none"
              aria-label="Buka menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-earth-soil-light bg-earth-soil px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-semibold text-left border-l-4 ${
                  isActive
                    ? 'border-earth-terracotta bg-earth-soil-light text-white'
                    : 'border-transparent text-stone-300 hover:bg-earth-soil-light hover:text-white'
                }`}
              >
                <span className={isActive ? 'text-earth-terracotta' : 'text-stone-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
