import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, Shield, AlertTriangle, Eye, EyeOff, Terminal, Lock, Unlock, Settings } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export default function CmsSettings({ user, plan, onPlanChange }) {
  const [cmsType, setCmsType] = useState('sanity');
  const [projectId, setProjectId] = useState('');
  const [dataset, setDataset] = useState('production');
  const [authToken, setAuthToken] = useState('');
  const [studioUrl, setStudioUrl] = useState('');
  
  const [wpUrl, setWpUrl] = useState('');
  const [wpUser, setWpUser] = useState('');
  const [wpPass, setWpPass] = useState('');

  const [wixSiteId, setWixSiteId] = useState('');
  const [wixKey, setWixKey] = useState('');

  const [tgToken, setTgToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [n8nUrl, setN8nUrl] = useState('');

  const [webApprover, setWebApprover] = useState(true);
  const [tgApprover, setTgApprover] = useState(false);
  const [waApprover, setWaApprover] = useState(false);

  const [waPhone, setWaPhone] = useState('');
  const [waVerified, setWaVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [waError, setWaError] = useState('');
  const [waSuccess, setWaSuccess] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState('');

  const [showSecret, setShowSecret] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load existing credentials
  useEffect(() => {
    const creds = localStorage.getItem('supermat_credentials');
    if (creds) {
      const parsed = JSON.parse(creds);
      setCmsType(parsed.cmsType || 'sanity');
      setProjectId(parsed.projectId || '');
      setDataset(parsed.dataset || 'production');
      setAuthToken(parsed.authToken || '');
      setStudioUrl(parsed.studioUrl || '');
      setWpUrl(parsed.wpUrl || '');
      setWpUser(parsed.wpUser || '');
      setWpPass(parsed.wpPass || '');
      setWixSiteId(parsed.wixSiteId || '');
      setWixKey(parsed.wixKey || '');
      setTgToken(parsed.tgToken || '');
      setTgChatId(parsed.tgChatId || '');
      setN8nUrl(parsed.n8nUrl || '');
      setWebApprover(parsed.webApprover !== undefined ? parsed.webApprover : true);
      setTgApprover(parsed.tgApprover !== undefined ? parsed.tgApprover : false);
      setWaApprover(parsed.waApprover !== undefined ? parsed.waApprover : false);
      setWaPhone(parsed.waPhone || '');
      setWaVerified(parsed.waVerified !== undefined ? parsed.waVerified : false);
    }
  }, []);

  // Sync verification status from backend on load/change
  useEffect(() => {
    if (waPhone) {
      fetch(API_BASE_URL + '/api/whatsapp/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: waPhone })
      })
      .then(res => res.json())
      .then(data => {
        if (data.verified) {
          setWaVerified(true);
        }
      })
      .catch(() => {});
    }
  }, [waPhone]);

  const handleRequestOtp = async () => {
    if (!waPhone.trim()) {
      setWaError('Nomor telepon harus diisi.');
      return;
    }
    setSendingOtp(true);
    setWaError('');
    setWaSuccess('');
    setSimulatedCode('');

    try {
      const response = await fetch(API_BASE_URL + '/api/whatsapp/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: waPhone })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim OTP.');
      }
      setOtpSent(true);
      setWaSuccess('OTP berhasil dikirim ke WhatsApp Anda!');
      if (data.simulated && data.code) {
        setSimulatedCode(data.code);
        setWaSuccess(`OTP dikirim (Simulasi): Masukkan kode "${data.code}"`);
      }
    } catch (err) {
      setWaError(err.message || 'Gagal menghubungi server.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setWaError('Masukkan kode OTP.');
      return;
    }
    setVerifyingOtp(true);
    setWaError('');
    setWaSuccess('');

    try {
      const response = await fetch(API_BASE_URL + '/api/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: waPhone, code: otpCode })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Kode OTP salah atau kedaluwarsa.');
      }
      setWaVerified(true);
      setOtpSent(false);
      setOtpCode('');
      setWaSuccess('Nomor telepon berhasil diverifikasi!');
      
      // Auto save verified state
      const creds = JSON.parse(localStorage.getItem('supermat_credentials') || '{}');
      creds.waPhone = waPhone;
      creds.waVerified = true;
      creds.waApprover = true;
      setWaApprover(true);
      localStorage.setItem('supermat_credentials', JSON.stringify(creds));
    } catch (err) {
      setWaError(err.message || 'Gagal memverifikasi OTP.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleDisconnectWa = () => {
    setWaVerified(false);
    setWaPhone('');
    setWaApprover(false);
    setOtpSent(false);
    setSimulatedCode('');
    setWaSuccess('Nomor WhatsApp dinonaktifkan.');
    
    const creds = JSON.parse(localStorage.getItem('supermat_credentials') || '{}');
    creds.waPhone = '';
    creds.waVerified = false;
    creds.waApprover = false;
    localStorage.setItem('supermat_credentials', JSON.stringify(creds));
  };

  const handleSave = (e) => {
    e.preventDefault();
    const creds = {
      cmsType,
      projectId,
      dataset,
      authToken,
      studioUrl,
      wpUrl,
      wpUser,
      wpPass,
      wixSiteId,
      wixKey,
      tgToken,
      tgChatId,
      n8nUrl,
      webApprover: plan === 'premium' ? webApprover : false,
      tgApprover: plan === 'premium' ? tgApprover : false,
      waApprover: plan === 'premium' ? waApprover : false,
      waPhone,
      waVerified
    };
    
    localStorage.setItem('supermat_credentials', JSON.stringify(creds));
    
    // Save Client Config in user session
    const currentUser = JSON.parse(localStorage.getItem('supermat_user') || '{}');
    currentUser.cmsType = cmsType;
    localStorage.setItem('supermat_user', JSON.stringify(currentUser));

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1>Integrasi & Pengaturan CMS</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Sambungkan core automation engine n8n Anda dengan CMS dan saluran Telegram milik brand {user?.brandName || 'Anda'}.
          </p>
        </div>
        {saved && (
          <div style={styles.savedAlert}>
            <CheckCircle2 size={16} color="var(--accent-green)" />
            <span>Berhasil Disimpan</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} style={styles.layout}>
        <div style={styles.leftCol}>
          {/* CMS Config */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={styles.cardTitle}>
              <Shield size={18} color="var(--accent-cyan)" />
              Pilih Target CMS Klien
            </h2>
            
            <div className="form-group">
              <label className="form-label">Platform CMS</label>
              <select 
                className="form-select"
                value={cmsType}
                onChange={(e) => setCmsType(e.target.value)}
              >
                <option value="sanity">Sanity.io Studio (Headless)</option>
                <option value="wordpress">WordPress (Self-Hosted/Cloud)</option>
                <option value="wix">Wix CMS Website</option>
              </select>
            </div>

            {/* Sanity Credentials */}
            {cmsType === 'sanity' && (
              <div style={styles.credentialsGroup}>
                <div className="form-group">
                  <label className="form-label">Sanity Project ID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Contoh: mwwvwgiw" 
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sanity Studio URL (Opsional)</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder="Contoh: https://www.sanity.io/@username/studio/project-id/default" 
                    value={studioUrl}
                    onChange={(e) => setStudioUrl(e.target.value)}
                  />
                  <span style={styles.infoSpan}>Gunakan jika Studio di-host di Sanity Cloud/Domain kustom. Jika kosong, default ke domain sanity.studio standard.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Dataset</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="production" 
                    value={dataset}
                    onChange={(e) => setDataset(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sanity Write Token</label>
                  <div style={styles.passwordWrapper}>
                    <input 
                      type={showSecret ? "text" : "password"} 
                      className="form-input" 
                      placeholder="skBXK0a9..." 
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowSecret(!showSecret)} 
                      style={styles.eyeBtn}
                    >
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* WordPress Credentials */}
            {cmsType === 'wordpress' && (
              <div style={styles.credentialsGroup}>
                <div className="form-group">
                  <label className="form-label">WordPress Site URL</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder="https://3ourasia.id" 
                    value={wpUrl}
                    onChange={(e) => setWpUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Application Username</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="admin-klien" 
                    value={wpUser}
                    onChange={(e) => setWpUser(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Application Password</label>
                  <div style={styles.passwordWrapper}>
                    <input 
                      type={showSecret ? "text" : "password"} 
                      className="form-input" 
                      placeholder="xxxx xxxx xxxx xxxx" 
                      value={wpPass}
                      onChange={(e) => setWpPass(e.target.value)}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowSecret(!showSecret)} 
                      style={styles.eyeBtn}
                    >
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span style={styles.infoSpan}>Gunakan sandi aplikasi (Application Password) WordPress, bukan sandi login utama.</span>
                </div>
              </div>
            )}

            {/* Wix Credentials */}
            {cmsType === 'wix' && (
              <div style={styles.credentialsGroup}>
                <div className="form-group">
                  <label className="form-label">Wix Site ID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="site-id-guid" 
                    value={wixSiteId}
                    onChange={(e) => setWixSiteId(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Wix API Key</label>
                  <div style={styles.passwordWrapper}>
                    <input 
                      type={showSecret ? "text" : "password"} 
                      className="form-input" 
                      placeholder="wix-api-token-..." 
                      value={wixKey}
                      onChange={(e) => setWixKey(e.target.value)}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowSecret(!showSecret)} 
                      style={styles.eyeBtn}
                    >
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={styles.rightCol}>
          {/* Subscription Plan Card */}
          <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--border-muted)' }}>
            <h2 style={styles.cardTitle}>
              <Shield size={18} color="var(--accent-yellow)" />
              Simulasi Lisensi Klien (Plan Switcher)
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
              Ubah plan di bawah untuk menguji respon pembatasan fitur Web/Telegram/WhatsApp Approver.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => onPlanChange('free')}
                style={{
                  ...styles.planBtn,
                  backgroundColor: plan === 'free' ? 'var(--bg-surface-hover)' : 'transparent',
                  borderColor: plan === 'free' ? 'var(--border-active)' : 'var(--border-muted)',
                  color: plan === 'free' ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: plan === 'free' ? '600' : 'normal'
                }}
              >
                FREE PLAN
              </button>
              <button 
                type="button" 
                onClick={() => onPlanChange('premium')}
                style={{
                  ...styles.planBtn,
                  background: plan === 'premium' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                  borderColor: plan === 'premium' ? '#d97706' : 'var(--border-muted)',
                  color: plan === 'premium' ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: plan === 'premium' ? '600' : 'normal',
                  boxShadow: plan === 'premium' ? '0 2px 4px rgba(245, 158, 11, 0.2)' : 'none'
                }}
              >
                👑 PREMIUM (PAID)
              </button>
            </div>
          </div>

          {/* Approval Channels Configuration */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={styles.cardTitle}>
              <Settings size={18} color="var(--accent-cyan)" />
              Saluran Persetujuan (Approval Channels)
            </h2>
            
            {plan !== 'premium' && (
              <div style={styles.upgradeNotice}>
                <Lock size={12} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: '500', lineHeight: '1.4' }}>
                  Fitur persetujuan dikunci. Upgrade ke <a href="#upgrade" onClick={(e) => { e.preventDefault(); onPlanChange('premium'); }} style={{ color: 'var(--accent-cyan)', textDecoration: 'underline' }}>Premium Plan</a> untuk membukanya.
                </span>
              </div>
            )}

            {/* Web Approver Switch */}
            <div style={{ ...styles.channelRow, opacity: plan === 'premium' ? 1 : 0.6 }}>
              <div style={styles.channelLabelGroup}>
                <span style={styles.channelName}>🖥️ Web Approver Dashboard</span>
                <span style={styles.channelDesc}>Review draf artikel di web Supermat sebelum diposting.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {plan !== 'premium' ? (
                  <span style={styles.lockedBadge}>🔒 Locked</span>
                ) : (
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={webApprover} 
                      onChange={(e) => setWebApprover(e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                )}
              </div>
            </div>

            {/* Telegram Approver Switch */}
            <div style={{ ...styles.channelRow, opacity: plan === 'premium' ? 1 : 0.6 }}>
              <div style={styles.channelLabelGroup}>
                <span style={styles.channelName}>🤖 Telegram Bot Approver</span>
                <span style={styles.channelDesc}>Kirim draf tautan tinjau ke bot Telegram.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {plan !== 'premium' ? (
                  <span style={styles.lockedBadge}>🔒 Locked</span>
                ) : (
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={tgApprover} 
                      onChange={(e) => setTgApprover(e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                )}
              </div>
            </div>

            {/* WhatsApp Approver Switch */}
            <div style={{ ...styles.channelRow, opacity: plan === 'premium' ? 1 : 0.6 }}>
              <div style={styles.channelLabelGroup}>
                <span style={styles.channelName}>
                  💬 WhatsApp Bot Approver {waVerified && <span style={styles.verifiedBadge}>Aktif</span>}
                </span>
                <span style={styles.channelDesc}>Persetujuan langsung via WhatsApp menggunakan Fonnte API.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {plan !== 'premium' ? (
                  <span style={styles.lockedBadge}>🔒 Locked</span>
                ) : !waVerified ? (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    onClick={() => {
                      setWaApprover(true); // Open setup section
                    }}
                  >
                    Set Up
                  </button>
                ) : (
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={waApprover} 
                      onChange={(e) => {
                        if (waVerified) {
                          setWaApprover(e.target.checked);
                        }
                      }}
                    />
                    <span className="slider round"></span>
                  </label>
                )}
              </div>
            </div>

            {/* WhatsApp Setup Block */}
            {plan === 'premium' && (waApprover || !waVerified) && (
              <div style={styles.waSetupBox}>
                <h3 style={styles.waSetupTitle}>Konfigurasi WhatsApp Bot</h3>
                
                {waVerified ? (
                  <div style={styles.waVerifiedState}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Nomor Terhubung: <strong>{waPhone}</strong>
                    </p>
                    <button 
                      type="button" 
                      onClick={handleDisconnectWa}
                      style={styles.disconnectWaBtn}
                    >
                      Putuskan Nomor
                    </button>
                  </div>
                ) : (
                  <div>
                    {!otpSent ? (
                      <div style={styles.waInputGroup}>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Nomor WhatsApp (dengan kode negara)</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Contoh: 628123456789" 
                            value={waPhone}
                            onChange={(e) => setWaPhone(e.target.value)}
                            style={{ fontSize: '0.8rem', padding: '0.45rem' }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleRequestOtp}
                          disabled={sendingOtp || !waPhone}
                          style={{ height: '34px', fontSize: '0.75rem', marginTop: '1.4rem' }}
                        >
                          {sendingOtp ? 'Mengirim...' : 'Kirim OTP'}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={styles.waInputGroup}>
                          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Masukkan Kode OTP</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="Masukkan 4 digit OTP" 
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              style={{ fontSize: '0.8rem', padding: '0.45rem' }}
                            />
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleVerifyOtp}
                            disabled={verifyingOtp || !otpCode}
                            style={{ height: '34px', fontSize: '0.75rem', marginTop: '1.4rem' }}
                          >
                            {verifyingOtp ? 'Memverifikasi...' : 'Verifikasi'}
                          </button>
                        </div>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Kode dikirim ke nomor {waPhone}.{' '}
                          <span 
                            onClick={handleRequestOtp} 
                            style={{ color: 'var(--accent-cyan)', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Kirim Ulang
                          </span>
                        </p>
                      </div>
                    )}

                    {waError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>{waError}</p>}
                    {waSuccess && <p style={{ color: 'var(--accent-green)', fontSize: '0.75rem', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>{waSuccess}</p>}
                  </div>
                )}
              </div>
            )}
          </div>


          {/* Telegram Notifications */}
          <div className="card" style={{ marginBottom: '1.5rem', display: plan === 'premium' && tgApprover ? 'block' : 'none' }}>
            <h2 style={styles.cardTitle}>
              <AlertTriangle size={18} color="var(--accent-yellow)" />
              Telegram Approver Bot
            </h2>

            <div className="form-group">
              <label className="form-label">Telegram Bot Token</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="759492193:AAHw4b9z..." 
                value={tgToken}
                onChange={(e) => setTgToken(e.target.value)}
                required={plan === 'premium' && tgApprover}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Telegram Chat ID / Group ID</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Contoh: -412345678" 
                value={tgChatId}
                onChange={(e) => setTgChatId(e.target.value)}
                required={plan === 'premium' && tgApprover}
              />
              <span style={styles.infoSpan}>ID chat di mana n8n akan mengirimkan draf tautan tinjau.</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={styles.saveBtn}>
            <Save size={18} />
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '2rem'
  },
  savedAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'var(--accent-green-glow)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    color: 'var(--accent-green)',
    fontSize: '0.875rem',
    fontWeight: '500',
    animation: 'fadeIn 0.2s ease'
  },
  layout: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap'
  },
  leftCol: {
    flex: 1,
    minWidth: '320px'
  },
  rightCol: {
    width: '420px',
    minWidth: '320px'
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.25rem',
    color: 'var(--text-primary)'
  },
  credentialsGroup: {
    animation: 'fadeIn 0.2s ease-out'
  },
  passwordWrapper: {
    position: 'relative'
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer'
  },
  infoSpan: {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '0.375rem'
  },
  saveBtn: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.875rem'
  },
  planBtn: {
    flex: 1,
    padding: '0.625rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    border: '1px solid var(--border-muted)',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem'
  },
  upgradeNotice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    padding: '0.75rem',
    borderRadius: '8px',
    marginBottom: '1.25rem'
  },
  channelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    borderBottom: '1px solid var(--border-muted)',
    gap: '1rem'
  },
  channelLabelGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1
  },
  channelName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem'
  },
  channelDesc: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4'
  },
  lockedBadge: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: 'var(--accent-yellow)',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    whiteSpace: 'nowrap'
  },
  soonBadge: {
    fontSize: '0.6rem',
    fontWeight: 'bold',
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-surface-hover)',
    padding: '1px 4px',
    borderRadius: '4px',
    marginLeft: '0.375rem'
  },
  verifiedBadge: {
    fontSize: '0.65rem',
    fontWeight: 'bold',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
    marginLeft: '0.375rem'
  },
  waSetupBox: {
    backgroundColor: '#09090b',
    border: '1px solid var(--border-muted)',
    borderRadius: '8px',
    padding: '1.25rem',
    marginTop: '0.75rem',
    animation: 'fadeIn 0.2s ease-out'
  },
  waSetupTitle: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: '0 0 0.75rem 0'
  },
  waInputGroup: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-end'
  },
  waVerifiedState: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  disconnectWaBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ef4444',
    fontSize: '0.75rem',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0
  }
};
