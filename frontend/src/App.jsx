import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import KeywordManager from './components/KeywordManager';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import CmsSettings from './components/CmsSettings';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('keywords'); // keywords, analytics, settings
  const [runCount, setRunCount] = useState(0);
  const [plan, setPlan] = useState('free'); // free, premium

  // Check if session exists in localStorage
  useEffect(() => {
    const session = localStorage.getItem('supermat_user');
    if (session) {
      setUser(JSON.parse(session));
    }
    
    const count = localStorage.getItem('supermat_run_count');
    if (count) {
      setRunCount(parseInt(count, 10));
    }

    const storedPlan = localStorage.getItem('supermat_plan');
    if (storedPlan) {
      setPlan(storedPlan);
    } else {
      localStorage.setItem('supermat_plan', 'free');
    }
  }, []);

  const handleLoginSuccess = (profile) => {
    setUser(profile);
  };

  const handleLogout = () => {
    localStorage.removeItem('supermat_user');
    setUser(null);
    setActiveTab('keywords');
  };

  const handlePlanChange = (newPlan) => {
    setPlan(newPlan);
    localStorage.setItem('supermat_plan', newPlan);
  };

  const handleArticleCreated = () => {
    const nextCount = runCount + 1;
    setRunCount(nextCount);
    localStorage.setItem('supermat_run_count', nextCount.toString());
  };

  // Render AuthScreen if user session not active
  if (!user) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Retractable Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout} 
        plan={plan}
        onPlanChange={handlePlanChange}
      />

      {/* Main Panel Router */}
      <main className="main-content">
        {activeTab === 'keywords' && (
          <KeywordManager 
            user={user} 
            onArticleCreated={handleArticleCreated} 
            plan={plan}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard 
            user={user} 
            runCount={runCount} 
          />
        )}
        {activeTab === 'settings' && (
          <CmsSettings 
            user={user} 
            plan={plan}
            onPlanChange={handlePlanChange}
          />
        )}
      </main>
    </div>
  );
}
