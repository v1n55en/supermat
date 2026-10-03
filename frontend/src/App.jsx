import { useState, useEffect, useCallback } from 'react';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import KeywordManager from './components/KeywordManager';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import CmsSettings from './components/CmsSettings';
import BillingPage from './components/BillingPage';
import { api, getToken, setToken } from './api';

export default function App() {
  const [me, setMe] = useState(null); // { user, plan, usage, cms }
  const [booting, setBooting] = useState(true);
  const [activeTab, setActiveTab] = useState('keywords'); // keywords | analytics | settings | billing

  const refreshMe = useCallback(async () => {
    if (!getToken()) { setMe(null); return null; }
    try { const data = await api('/api/me'); setMe(data); return data; }
    catch { setToken(''); setMe(null); return null; }
  }, []);

  useEffect(() => {
    // bersihkan sisa sesi mock versi lama
    ['supermat_user', 'supermat_plan', 'supermat_keywords', 'supermat_credentials', 'supermat_run_count'].forEach(k => { try { localStorage.removeItem(k); } catch { /* abaikan */ } });
    refreshMe().finally(() => setBooting(false));
    const onLogout = () => { setMe(null); setActiveTab('keywords'); };
    window.addEventListener('supermat:logout', onLogout);
    return () => window.removeEventListener('supermat:logout', onLogout);
  }, [refreshMe]);

  const handleLoginSuccess = async () => { setBooting(true); await refreshMe(); setBooting(false); };
  const handleLogout = () => { setToken(''); setMe(null); setActiveTab('keywords'); };

  if (booting) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Memuat Supermat…</div>;
  }
  if (!me) return <AuthScreen onLoginSuccess={handleLoginSuccess} />;

  const user = me.user;
  const plan = user.plan || 'free';

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout} plan={plan} usage={me.usage} />
      <main className="main-content">
        {activeTab === 'keywords' && <KeywordManager me={me} refreshMe={refreshMe} goTo={setActiveTab} />}
        {activeTab === 'analytics' && <AnalyticsDashboard me={me} />}
        {activeTab === 'settings' && <CmsSettings me={me} refreshMe={refreshMe} goTo={setActiveTab} />}
        {activeTab === 'billing' && <BillingPage me={me} refreshMe={refreshMe} />}
      </main>
    </div>
  );
}
