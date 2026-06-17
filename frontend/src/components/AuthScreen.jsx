import React, { useState } from 'react';
import { ShieldCheck, Rocket, UserPlus, LogIn, ArrowRight } from 'lucide-react';

export default function AuthScreen({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [brandName, setBrandName] = useState('');
  const [niche, setNiche] = useState('F&B');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Harap isi semua field wajib.');
      return;
    }
    if (!isLogin && !brandName) {
      setError('Harap isi nama brand bisnis Anda.');
      return;
    }

    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setLoading(false);
      const userProfile = {
        email,
        brandName: isLogin ? (email.split('@')[0].toUpperCase() + ' Brand') : brandName,
        niche: isLogin ? 'F&B' : niche,
        token: 'mock-session-jwt-token-12345'
      };
      
      // Save session in localStorage
      localStorage.setItem('supermat_user', JSON.stringify(userProfile));
      onLoginSuccess(userProfile);
    }, 1200);
  };

  return (
    <div style={styles.container}>
      {/* Decorative Glow */}
      <div style={styles.glowCyan}></div>
      <div style={styles.glowPurple}></div>

      <div style={styles.authCard} className="card">
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <Rocket size={28} color="var(--accent-cyan)" />
          </div>
          <h1 style={styles.title}>Supermat Automation</h1>
          <p style={styles.subtitle}>
            Platform Automasi Digital Marketing Multi-CMS & Niche Terpadu
          </p>
        </div>

        <div style={styles.tabContainer}>
          <button 
            style={{...styles.tab, ...(isLogin ? styles.tabActive : {})}} 
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            <LogIn size={16} />
            Masuk
          </button>
          <button 
            style={{...styles.tab, ...(!isLogin ? styles.tabActive : {})}} 
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            <UserPlus size={16} />
            Daftar Baru
          </button>
        </div>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">Nama Brand Bisnis</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Contoh: Kopi Makmur" 
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Niche Usaha / Kategori</label>
                <select 
                  className="form-select"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                >
                  <option value="F&B">F&B (Kuliner / Kafe / Resto)</option>
                  <option value="Retail">Retail & Fashion (E-commerce)</option>
                  <option value="Agency">Creative Agency / Jasa</option>
                  <option value="Tech">Software / Startup Teknologi</option>
                  <option value="Property">Properti & Real Estate</option>
                  <option value="Other">Lainnya</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Pengguna</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="klien@bisnis.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kata Sandi</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <span style={styles.loader}>Memuat...</span>
            ) : (
              <>
                {isLogin ? 'Masuk ke Dashboard' : 'Mulai Automasi Bisnis'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <ShieldCheck size={14} color="var(--text-muted)" />
          <span style={styles.footerText}>Koneksi aman dengan enkripsi SSL</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#09090b',
    position: 'relative',
    overflow: 'hidden',
    padding: '1.5rem'
  },
  glowCyan: {
    position: 'absolute',
    top: '10%',
    left: '20%',
    width: '350px',
    height: '350px',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: '50%',
    filter: 'blur(80px)',
    pointerEvents: 'none'
  },
  glowPurple: {
    position: 'absolute',
    bottom: '15%',
    right: '25%',
    width: '400px',
    height: '400px',
    backgroundColor: 'rgba(162, 28, 175, 0.06)',
    borderRadius: '50%',
    filter: 'blur(90px)',
    pointerEvents: 'none'
  },
  authCard: {
    width: '100%',
    maxWidth: '460px',
    padding: '2.5rem',
    borderRadius: '16px',
    zIndex: 10
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  logoContainer: {
    display: 'inline-flex',
    padding: '0.875rem',
    borderRadius: '12px',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    marginBottom: '1rem'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    marginBottom: '0.5rem',
    color: 'var(--text-primary)'
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4'
  },
  tabContainer: {
    display: 'flex',
    gap: '0.5rem',
    padding: '0.25rem',
    backgroundColor: '#09090b',
    border: '1px solid var(--border-muted)',
    borderRadius: '8px',
    marginBottom: '1.5rem'
  },
  tab: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all var(--transition-fast)'
  },
  tabActive: {
    backgroundColor: 'var(--bg-surface-hover)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-muted)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  submitBtn: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.875rem',
    marginTop: '0.75rem'
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: 'var(--accent-red)',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    marginBottom: '1rem'
  },
  loader: {
    display: 'inline-block',
    animation: 'pulse 1.5s infinite'
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    marginTop: '2rem'
  },
  footerText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)'
  }
};
