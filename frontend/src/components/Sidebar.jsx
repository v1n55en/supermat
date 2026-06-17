import React from 'react';
import { Terminal, BarChart2, Settings, LogOut, Rocket, User } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, plan, onPlanChange }) {
  const navItems = [
    { id: 'keywords', label: 'Kontrol Automasi', icon: Terminal },
    { id: 'analytics', label: 'Analitik & Insights', icon: BarChart2 },
    { id: 'settings', label: 'Pengaturan CMS', icon: Settings },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Branding */}
      <div style={styles.brand}>
        <div style={styles.logoBox}>
          <Rocket size={20} color="var(--accent-cyan)" />
        </div>
        <div>
          <h2 style={styles.brandTitle}>Supermat</h2>
          <span style={styles.brandVersion}>v1.0.0</span>
        </div>
      </div>

      {/* User Info Card */}
      <div style={{...styles.userCard, marginBottom: '0.5rem'}}>
        <div style={styles.avatar}>
          <User size={16} color="var(--text-secondary)" />
        </div>
        <div style={styles.userInfo}>
          <p style={styles.userName} title={user?.brandName}>{user?.brandName || 'My Brand'}</p>
          <span style={styles.userRole}>{user?.niche || 'F&B'} Niche</span>
        </div>
      </div>

      {/* Plan Badge Section */}
      <div style={styles.planSection}>
        {plan === 'premium' ? (
          <div style={styles.premiumBadge}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>👑 PREMIUM PLAN</span>
          </div>
        ) : (
          <div style={styles.freeBadgeContainer}>
            <span style={styles.freeBadge}>FREE PLAN</span>
            <button 
              onClick={() => onPlanChange('premium')} 
              style={styles.upgradeBtn}
              title="Upgrade ke Premium untuk membuka semua fitur"
            >
              👑 Upgrade
            </button>
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{...styles.navLink, ...(isActive ? styles.navLinkActive : {})}}
            >
              {isActive && <div style={styles.activeBar}></div>}
              <Icon size={18} color={isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Actions */}
      <div style={styles.footer}>
        <button onClick={onLogout} style={styles.logoutBtn} className="logout-btn">
          <LogOut size={18} />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--bg-surface)',
    borderRight: '1px solid var(--border-muted)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    padding: '1.5rem',
    flexShrink: 0
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '2rem'
  },
  logoBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    borderRadius: '8px',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.15)'
  },
  brandTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
    lineHeight: '1.2'
  },
  brandVersion: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)'
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    borderRadius: '10px',
    backgroundColor: 'var(--bg-base)',
    border: '1px solid var(--border-muted)',
    marginBottom: '2rem'
  },
  avatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-surface-hover)'
  },
  userInfo: {
    minWidth: 0,
    flex: 1
  },
  userName: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    margin: 0
  },
  userRole: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    flex: 1
  },
  navLink: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '8px',
    textAlign: 'left',
    transition: 'all var(--transition-fast)',
    width: '100%'
  },
  navLinkActive: {
    backgroundColor: 'var(--bg-base)',
    color: 'var(--text-primary)',
    fontWeight: '600'
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: '25%',
    height: '50%',
    width: '3px',
    backgroundColor: 'var(--accent-cyan)',
    borderRadius: '0 4px 4px 0'
  },
  footer: {
    marginTop: 'auto',
    borderTop: '1px solid var(--border-muted)',
    paddingTop: '1rem'
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--text-muted)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    borderRadius: '8px',
    textAlign: 'left',
    transition: 'color var(--transition-fast)'
  },
  planSection: {
    marginBottom: '1.5rem',
  },
  premiumBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.375rem 0.75rem',
    borderRadius: '6px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.1)',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)'
  },
  freeBadgeContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.25rem 0.5rem 0.25rem 0.75rem',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-base)',
    border: '1px solid var(--border-muted)'
  },
  freeBadge: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: 'var(--text-muted)'
  },
  upgradeBtn: {
    padding: '0.25rem 0.5rem',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#0a84ff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  }
};
