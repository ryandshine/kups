import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BerandaView } from './views/BerandaView';
import { ProgresTierView } from './views/ProgresTierView';
import { PetaSebaranView } from './views/PetaSebaranView';
import { LeaderboardView } from './views/LeaderboardView';
import { TentangView } from './views/TentangView';

export const App: React.FC = () => {
  const getTabFromHash = (): string => {
    const hash = window.location.hash.replace('#', '');
    if (['beranda', 'progres-tier', 'peta-sebaran', 'leaderboard', 'tentang'].includes(hash)) {
      return hash;
    }
    return 'beranda';
  };

  const [currentTab, setCurrentTab] = useState<string>(getTabFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentTab(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    window.location.hash = tab === 'beranda' ? '' : tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-earth-sand font-sans text-earth-soil">
      {/* Top Navbar */}
      <Navbar currentTab={currentTab} onSelectTab={handleSelectTab} />

      {/* Main Content Area */}
      <main className="flex-1 py-8">
        {currentTab === 'beranda' && <BerandaView onNavigate={handleSelectTab} />}
        {currentTab === 'progres-tier' && <ProgresTierView />}
        {currentTab === 'peta-sebaran' && <PetaSebaranView />}
        {currentTab === 'leaderboard' && <LeaderboardView />}
        {currentTab === 'tentang' && <TentangView />}
      </main>

      {/* Footer */}
      <Footer onSelectTab={handleSelectTab} />
    </div>
  );
};

export default App;
