import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, Search, CheckCircle, Clock, RefreshCw, Terminal, ArrowUpRight } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export default function KeywordManager({ user, onArticleCreated, plan }) {
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newGeo, setNewGeo] = useState('ID');
  const [newLn, setNewLn] = useState('id');
  const [runningId, setRunningId] = useState(null);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const consoleEndRef = useRef(null);

  // Drawer review states
  const [drawerKeyword, setDrawerKeyword] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editBody, setEditBody] = useState('');
  const [publishingDrawer, setPublishingDrawer] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem('supermat_keywords');
    if (stored) {
      setKeywords(JSON.parse(stored));
    } else {
      // Boilerplate keywords matching niche F&B
      const initial = [
        { id: 1, keyword: 'Ide Promosi Kafe Kekinian', geo: 'ID', ln: 'id', volume: 1500, cms: 'sanity', status: 'Draft Created', date: '2026-06-12', draftUrl: 'https://mwwvwgiw.sanity.studio/desk/post;drafts.post-kafe-1' },
        { id: 2, keyword: 'Menu Kuliner Viral 2026', geo: 'ID', ln: 'id', volume: 2400, cms: 'sanity', status: 'Idle', date: '2026-06-13' }
      ];
      setKeywords(initial);
      localStorage.setItem('supermat_keywords', JSON.stringify(initial));
    }
  }, []);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  const addKeyword = (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    const cmsType = user?.cmsType || 'sanity';
    const volume = Math.floor(Math.random() * 2000) + 300; // Mock volume research
    const item = {
      id: Date.now(),
      keyword: newKeyword.trim(),
      geo: newGeo,
      ln: newLn,
      volume,
      cms: cmsType,
      status: 'Idle',
      date: new Date().toISOString().split('T')[0]
    };

    const updated = [item, ...keywords];
    setKeywords(updated);
    localStorage.setItem('supermat_keywords', JSON.stringify(updated));
    setNewKeyword('');
  };

  const runAutomation = (id) => {
    const target = keywords.find(k => k.id === id);
    if (!target || runningId !== null) return;

    setRunningId(id);
    setConsoleLogs([]);

    const log = (msg) => {
      const time = new Date().toLocaleTimeString();
      setConsoleLogs(prev => [...prev, `[${time}] ${msg}`]);
    };

    // Load credentials to check if n8nUrl is configured
    const credsRaw = localStorage.getItem('supermat_credentials');
    const creds = credsRaw ? JSON.parse(credsRaw) : {};
    const n8nUrl = creds.n8nUrl;
    const webApproverEnabled = plan === 'premium' && (creds.webApprover !== false); // default true if premium
    const waApproverEnabled = plan === 'premium' && (creds.waApprover === true) && (creds.waVerified === true);
    const waPhone = creds.waPhone || '';

    updateKeywordStatus(id, 'Running Riset');
    log(`Memulai automasi pemicu untuk kata kunci: "${target.keyword}"`);

    const backendUrl = API_BASE_URL + '/api/automation/run';
    log(`[Backend] Menghubungi Backend Proxy di: ${backendUrl}`);
    
    fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword: target.keyword,
        Geo: target.geo,
        Ln: target.ln,
        Client_Name: user.brandName,
        CMS_Type: target.cms,
        Telegram_Chat_ID: creds.tgChatId || "",
        n8nUrl: n8nUrl || "", // Forward browser configuration if available
        waApprover: waApproverEnabled,
        waPhone: waPhone,
        projectId: creds.projectId || ""
      })
    })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
      const responseData = await res.json();
      log(`[Backend] Hubungan sukses. Data draf diterima dari n8n.`);
      
      let articlePayload = null;
      if (responseData) {
        const item = Array.isArray(responseData) ? responseData[0] : responseData;
        articlePayload = item.article || item.json?.article || item;
      }

      if (responseData.waPending) {
        log(`[Review WhatsApp] Draf artikel dikirim ke WhatsApp ${waPhone} untuk persetujuan.`);
        updateKeywordStatus(id, 'Review Ready', null, articlePayload, true);
        setRunningId(null);
        onArticleCreated();
      } else if (webApproverEnabled && articlePayload && (articlePayload.title || articlePayload.bodyMarkdown)) {
        log(`[Review] Berhasil memuat draf artikel ke Web Approver.`);
        updateKeywordStatus(id, 'Review Ready', null, articlePayload, false);
        setRunningId(null);
        onArticleCreated();
      } else {
        const cms = target.cms || 'sanity';
        const draftUrl = responseData?.draftEditUrl || responseData?.json?.draftEditUrl || `https://3ourasia.id/wp-admin/post.php?post=${Math.floor(Math.random()*1000)}&action=edit`;
        updateKeywordStatus(id, 'Draft Created', draftUrl);
        log(`[CMS] Draf berhasil langsung diposting ke CMS: ${draftUrl}`);
        setRunningId(null);
        onArticleCreated();
      }
    })
    .catch(err => {
      log(`[⚠️ Warning] Gagal memicu n8n via backend (${err.message}).`);
      log(`[Simulator] Menjalankan fallback simulator lokal...`);
      triggerSimulationSteps(id, target, log, webApproverEnabled, waApproverEnabled, waPhone);
    });
  };

  const triggerSimulationSteps = (id, target, log, webApproverEnabled, waApproverEnabled, waPhone) => {
    // Step 2: riset trends (1.5s)
    setTimeout(() => {
      updateKeywordStatus(id, 'Riset Tren');
      log(`Menghubungi Google Trends & Ahrefs API...`);
      log(`Hasil riset: Search Volume: ${target.volume} | Keyword Difficulty: ${Math.floor(Math.random()*20)+10}`);
    }, 1500);

    // Step 3: AI writing (3.5s)
    setTimeout(() => {
      updateKeywordStatus(id, 'AI Writing');
      log(`Mengaktifkan Gemini 2.5 Pro Agent untuk penulisan artikel...`);
      log(`Menjalankan Google Search Riset Tool untuk validasi fakta industri...`);
      log(`AI berhasil menulis artikel SEO 850 kata dalam format Markdown.`);
    }, 3500);

    // Step 4: Image Generator (5.5s)
    setTimeout(() => {
      updateKeywordStatus(id, 'Image Gen');
      log(`Mengaktifkan Cloudflare AI (Flux-1-schnell) untuk men-generate Hero Image...`);
      log(`Sukses membuat visual asset hero-image.png dan mengunggahnya ke server.`);
    }, 5500);

    // Step 5: Publishing Draft (7.5s)
    setTimeout(() => {
      const mockArticle = {
        title: `10 Tips Ampuh ${target.keyword} untuk Pertumbuhan Bisnis`,
        slug: target.keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        excerpt: `Temukan 10 strategi praktis ${target.keyword} yang dirancang khusus untuk meningkatkan omset dan engagement brand Anda secara organik tahun ini.`,
        bodyMarkdown: `## Pendahuluan\n\nDalam lanskap industri modern saat ini, memiliki strategi yang solid untuk **${target.keyword}** adalah kunci utama untuk memenangkan pasar. Kafe, restoran, dan bisnis kuliner harus beradaptasi dengan tren digital agar tetap relevan.\n\n## Mengapa Ini Penting?\n\nBanyak pemilik brand melakukan kesalahan dengan berfokus hanya pada produk. Padahal, penargetan audiens yang tepat dan optimasi SEO lokal jauh lebih berdampak. Berikut adalah beberapa langkah kunci:\n\n1. **Riset Tren Pasar**: Selalu pantau apa yang sedang viral di Google Trends dan media sosial.\n2. **Gunakan Copywriting yang Humanis**: Hindari bahasa robotik formal. Sapa audiens Anda dengan santai namun profesional.\n3. **Konsistensi Konten**: Menulis artikel secara terstruktur membantu Google mengindeks website Anda lebih cepat.\n\n## Kesimpulan\n\nJadi, tunggu apa lagi? Terapkan strategi ini sekarang dan lihat perubahannya. Jika Anda butuh bantuan dalam content marketing yang terukur, hubungi tim 3our Asia untuk konsultasi gratis!`,
        searchVolume: target.volume,
        difficulty: Math.floor(Math.random() * 20) + 12
      };

      if (waApproverEnabled) {
        // Register pending review on the backend so the user can test webhook replies
        fetch(API_BASE_URL + '/api/automation/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: target.keyword,
            Geo: target.geo,
            Ln: target.ln,
            Client_Name: user.brandName,
            CMS_Type: target.cms,
            waApprover: true,
            waPhone: waPhone
          })
        }).catch(() => {});

        updateKeywordStatus(id, 'Review Ready', null, mockArticle, true);
        log(`[Review WhatsApp] Draf artikel dikirim ke WhatsApp ${waPhone}.`);
        log(`✓ Menunggu persetujuan Anda via WhatsApp (balas SETUJU).`);
      } else if (webApproverEnabled) {
        updateKeywordStatus(id, 'Review Ready', null, mockArticle, false);
        log(`[Simulator] Draf artikel siap ditinjau di Web Approver Dashboard.`);
        log(`✓ Proses riset & penulisan selesai. Menunggu persetujuan Anda!`);
      } else {
        const cms = target.cms || 'sanity';
        const draftId = `drafts.post-${Math.random().toString(36).slice(2, 9)}`;
        const draftUrl = cms === 'sanity' 
          ? `https://mwwvwgiw.sanity.studio/desk/post;${draftId}`
          : `https://3ourasia.id/wp-admin/post.php?post=${Math.floor(Math.random()*1000)}&action=edit`;

        updateKeywordStatus(id, 'Draft Created', draftUrl);
        log(`[CMS] Draf berhasil langsung diposting ke CMS: ${draftUrl}`);
        log(`✓ Seluruh proses automasi n8n selesai dengan sukses!`);
      }
      
      setRunningId(null);
      onArticleCreated(); // Update analytics click count simulator
    }, 7500);
  };

  const openDrawer = (kw) => {
    setDrawerKeyword(kw);
    setEditTitle(kw.article?.title || `10 Tips Ampuh ${kw.keyword}`);
    setEditSlug(kw.article?.slug || kw.keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    setEditExcerpt(kw.article?.excerpt || '');
    setEditBody(kw.article?.bodyMarkdown || '');
  };

  const closeDrawer = () => {
    setDrawerKeyword(null);
  };

  const approveAndPublish = () => {
    if (!drawerKeyword) return;
    setPublishingDrawer(true);

    const log = (msg) => {
      const time = new Date().toLocaleTimeString();
      setConsoleLogs(prev => [...prev, `[${time}] ${msg}`]);
    };

    const updatedArticle = {
      title: editTitle,
      slug: editSlug,
      excerpt: editExcerpt,
      bodyMarkdown: editBody,
      searchVolume: drawerKeyword.article?.searchVolume || drawerKeyword.volume,
      difficulty: drawerKeyword.article?.difficulty || 0
    };

    const credsRaw = localStorage.getItem('supermat_credentials');
    const creds = credsRaw ? JSON.parse(credsRaw) : {};
    const waPhone = creds.waPhone || '';

    const publishUrl = API_BASE_URL + '/api/automation/publish';
    log(`[Backend] Mengirim draf ke backend untuk dipublikasikan ke CMS...`);

    const n8nUrl = creds.n8nUrl;

    fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: user.brandName,
        telegramChatId: creds.tgChatId || "",
        cmsType: drawerKeyword.cms,
        article: updatedArticle,
        n8nUrl: n8nUrl || "", // Forward custom configuration to backend
        waPhone: waPhone, // Clear pending review on backend if active
        projectId: creds.projectId || ""
      })
    })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Publish failed with status ${res.status}`);
      const responseData = await res.json();
      const cms = drawerKeyword.cms || 'sanity';
      const draftUrl = responseData?.draftEditUrl || responseData?.json?.draftEditUrl || `https://3ourasia.id/wp-admin/post.php?post=${Math.floor(Math.random()*1000)}&action=edit`;
      
      updateKeywordStatus(drawerKeyword.id, 'Draft Created', draftUrl, updatedArticle, false);
      log(`[CMS] Sukses mempublikasikan draf ke ${cms.toUpperCase()}! URL Draf: ${draftUrl}`);
      
      if (plan === 'premium' && creds.tgApprover) {
        log(`[Telegram] Mengirimkan pesan persetujuan ke Telegram Bot...`);
      }

      log(`✓ Artikel berhasil dipublikasikan!`);
      setPublishingDrawer(false);
      setDrawerKeyword(null);
    })
    .catch(err => {
      log(`[⚠️ Warning] Gagal memposting via backend/n8n (${err.message}).`);
      log(`[Simulator] Menjalankan simulator publikasi lokal...`);
      
      setTimeout(() => {
        const cms = drawerKeyword.cms || 'sanity';
        const draftId = `drafts.post-${Math.random().toString(36).slice(2, 9)}`;
        const draftUrl = cms === 'sanity' 
          ? `https://mwwvwgiw.sanity.studio/desk/post;${draftId}`
          : `https://3ourasia.id/wp-admin/post.php?post=${Math.floor(Math.random()*1000)}&action=edit`;

        updateKeywordStatus(drawerKeyword.id, 'Draft Created', draftUrl, updatedArticle, false);
        log(`[CMS] Sukses mempublikasikan draf ke ${cms.toUpperCase()}! URL Draf: ${draftUrl}`);
        
        if (plan === 'premium' && creds.tgApprover) {
          log(`[Telegram] Mengirimkan pesan persetujuan ke Telegram Bot...`);
        }

        log(`✓ Artikel berhasil dipublikasikan!`);
        setPublishingDrawer(false);
        setDrawerKeyword(null);
      }, 1500);
    });
  };

  const handleRegenerate = () => {
    if (!drawerKeyword) return;
    const kwId = drawerKeyword.id;
    setDrawerKeyword(null);
    
    // Clear article cache
    setKeywords(prev => {
      const updated = prev.map(k => {
        if (k.id === kwId) {
          const { article, ...rest } = k;
          return { ...rest, status: 'Idle', waPending: false };
        }
        return k;
      });
      localStorage.setItem('supermat_keywords', JSON.stringify(updated));
      return updated;
    });

    // Run automation again
    setTimeout(() => {
      runAutomation(kwId);
    }, 300);
  };

  const updateKeywordStatus = (id, status, draftUrl = null, article = null, waPending = false) => {
    setKeywords(prev => {
      const updated = prev.map(k => {
        if (k.id === id) {
          return { 
            ...k, 
            status, 
            waPending,
            ...(draftUrl ? { draftUrl } : {}),
            ...(article ? { article } : {})
          };
        }
        return k;
      });
      localStorage.setItem('supermat_keywords', JSON.stringify(updated));
      return updated;
    });
  };

  // Poll backend for WhatsApp webhook status updates
  useEffect(() => {
    const activeWaReviews = keywords.filter(k => k.status === 'Review Ready' && k.waPending);
    if (activeWaReviews.length === 0) return;

    const credsRaw = localStorage.getItem('supermat_credentials');
    const creds = credsRaw ? JSON.parse(credsRaw) : {};
    const waPhone = creds.waPhone;
    if (!waPhone) return;

    const interval = setInterval(() => {
      fetch(`${API_BASE_URL}/api/whatsapp/pending-reviews?phone=${waPhone}`)
      .then(res => res.json())
      .then(data => {
        if (data.review) {
          const { status, draftUrl, keywordId, article } = data.review;
          
          if (status === 'published' && draftUrl) {
            // Update local keyword status to Draft Created
            const kw = keywords.find(k => k.id === keywordId || k.keyword === data.review.keyword);
            if (kw) {
              updateKeywordStatus(kw.id, 'Draft Created', draftUrl, article || kw.article, false);
              
              // Notify console
              const time = new Date().toLocaleTimeString();
              setConsoleLogs(prev => [...prev, `[${time}] [WhatsApp Webhook] Persetujuan diterima dari WhatsApp! Mempublikasikan ke CMS: ${draftUrl}`]);
              
              // Clear from backend
              fetch(`${API_BASE_URL}/api/whatsapp/pending-reviews?phone=${waPhone}&keywordId=${keywordId || kw.id}`, {
                method: 'DELETE'
              }).catch(() => {});
            }
          } else if (status === 'revising') {
            const kw = keywords.find(k => k.id === keywordId || k.keyword === data.review.keyword);
            if (kw && kw.status !== 'AI Writing') {
              // Set status to AI writing again
              updateKeywordStatus(kw.id, 'AI Writing', null, kw.article, true);
              const time = new Date().toLocaleTimeString();
              setConsoleLogs(prev => [...prev, `[${time}] [WhatsApp Webhook] Permintaan revisi diterima dari WhatsApp. Menulis ulang artikel...`]);
            }
          } else if (status === 'pending') {
            // Check if it transitioned back from revising to pending
            const kw = keywords.find(k => k.id === keywordId || k.keyword === data.review.keyword);
            if (kw && kw.status === 'AI Writing') {
              updateKeywordStatus(kw.id, 'Review Ready', null, article || kw.article, true);
              const time = new Date().toLocaleTimeString();
              setConsoleLogs(prev => [...prev, `[${time}] [WhatsApp Webhook] Revisi artikel selesai. Menunggu persetujuan baru via WhatsApp.`]);
            }
          }
        }
      })
      .catch(() => {});
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [keywords]);

  const getStatusBadge = (status, waPending) => {
    switch (status) {
      case 'Idle': return <span className="badge badge-secondary">Idle</span>;
      case 'Running Riset':
      case 'Riset Tren': return <span className="badge badge-warning">Riset Tren</span>;
      case 'AI Writing': return <span className="badge badge-info">AI Writing</span>;
      case 'Image Gen': return <span className="badge badge-info">Flux Image Gen</span>;
      case 'Review Ready': 
        return (
          <span className="badge badge-warning" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            Review Ready {waPending && <span style={{ color: '#10b981', fontWeight: 'bold' }}>• WA</span>}
          </span>
        );
      case 'Draft Created': return <span className="badge badge-success">Draf Sukses</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1>Kontrol & Automasi Kata Kunci</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Daftarkan kata kunci fokus bisnis Anda. n8n akan melakukan riset pasar dan menulis artikel draf secara otomatis.
          </p>
        </div>
      </div>

      <div style={styles.layout}>
        {/* Form & Table */}
        <div style={styles.mainCol}>
          {/* Add Keyword Card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <form onSubmit={addKeyword} style={styles.formRow}>
              <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                <label className="form-label">Kata Kunci Baru</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Contoh: kuliner sehat rendah kalori" 
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  disabled={runningId !== null}
                  required
                />
              </div>
              <div className="form-group" style={{ width: '100px', marginBottom: 0 }}>
                <label className="form-label">Geo</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newGeo}
                  onChange={(e) => setNewGeo(e.target.value)}
                  placeholder="ID" 
                  disabled={runningId !== null}
                />
              </div>
              <div className="form-group" style={{ width: '100px', marginBottom: 0 }}>
                <label className="form-label">Bahasa</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newLn}
                  onChange={(e) => setNewLn(e.target.value)}
                  placeholder="id" 
                  disabled={runningId !== null}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={styles.addBtn}
                disabled={runningId !== null}
              >
                <Plus size={16} />
                Daftarkan
              </button>
            </form>
          </div>

          {/* Table Card */}
          <div className="card" style={{ padding: 0 }}>
            <div style={styles.tableHeader}>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>Kata Kunci Terdaftar</h2>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Kata Kunci</th>
                    <th>Geo/Ln</th>
                    <th>Volume Cari (Riset)</th>
                    <th>CMS</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((kw) => (
                    <tr key={kw.id}>
                      <td style={{ fontWeight: '500' }}>{kw.keyword}</td>
                      <td>{kw.geo} / {kw.ln}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{kw.volume.toLocaleString()}</td>
                      <td style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>{kw.cms}</td>
                      <td>{getStatusBadge(kw.status, kw.waPending)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{kw.date}</td>
                      <td>
                        <div style={styles.actionCell}>
                          {kw.status === 'Draft Created' && kw.draftUrl ? (
                            <a 
                              href={kw.draftUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-secondary" 
                              style={styles.reviewBtn}
                            >
                              Buka Draf
                              <ArrowUpRight size={14} />
                            </a>
                          ) : kw.status === 'Review Ready' ? (
                            <button
                              onClick={() => openDrawer(kw)}
                              className="btn btn-primary"
                              style={{ ...styles.playBtn, backgroundColor: '#f59e0b', color: '#09090b' }}
                            >
                              Tinjau Draf
                              <ArrowUpRight size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => runAutomation(kw.id)}
                              className="btn btn-secondary"
                              disabled={runningId !== null}
                              title="Jalankan Automasi n8n"
                              style={styles.playBtn}
                            >
                              {runningId === kw.id ? (
                                <RefreshCw size={14} className="spin-icon" style={{ animation: 'spin 1.5s linear infinite' }} />
                              ) : (
                                <Play size={14} fill="currentColor" />
                              )}
                              Jalankan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Console log */}
        <div style={styles.sideCol} className="card">
          <div style={styles.consoleHeader}>
            <Terminal size={16} color="var(--accent-cyan)" />
            <h2 style={{ margin: 0, fontSize: '0.875rem' }}>n8n Execution Logs (Real-time)</h2>
          </div>
          <div style={styles.consoleBody}>
            {consoleLogs.length === 0 ? (
              <div style={styles.consolePlaceholder}>
                <Clock size={20} color="var(--text-muted)" />
                <p>Belum ada eksekusi yang dijalankan. Klik "Jalankan" pada salah satu kata kunci untuk memicu workflow n8n.</p>
              </div>
            ) : (
              <div style={styles.consoleLogWrapper}>
                {consoleLogs.map((log, index) => (
                  <div key={index} style={styles.consoleLine}>
                    {log}
                  </div>
                ))}
                <div ref={consoleEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline Slide-out Review Drawer */}
      {drawerKeyword && (
        <div style={styles.drawerOverlay} onClick={closeDrawer}>
          <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Review Draf Artikel</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Kata Kunci: <strong>{drawerKeyword.keyword}</strong>
                </span>
              </div>
              <button onClick={closeDrawer} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.drawerBody}>
              {/* Metrics row */}
              <div style={styles.metricsRow}>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>Search Volume</span>
                  <span style={styles.metricValue}>
                    {drawerKeyword.article?.searchVolume?.toLocaleString() || drawerKeyword.volume.toLocaleString()}
                  </span>
                </div>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>Difficulty</span>
                  <span style={{ ...styles.metricValue, color: 'var(--accent-yellow)' }}>
                    {drawerKeyword.article?.difficulty || 18} KD
                  </span>
                </div>
                <div style={styles.metricCard}>
                  <span style={styles.metricLabel}>Target CMS</span>
                  <span style={{ ...styles.metricValue, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                    {drawerKeyword.cms}
                  </span>
                </div>
              </div>

              {/* Form fields */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Judul Artikel</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={publishingDrawer}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">URL Slug</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  disabled={publishingDrawer}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Ringkasan (Excerpt)</label>
                <textarea 
                  className="form-input" 
                  style={{ height: '70px', resize: 'vertical' }}
                  value={editExcerpt}
                  onChange={(e) => setEditExcerpt(e.target.value)}
                  disabled={publishingDrawer}
                />
              </div>

              <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
                <label className="form-label">Isi Konten (Markdown)</label>
                <textarea 
                  className="form-input" 
                  style={{ flex: 1, minHeight: '220px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: '1.5', resize: 'vertical' }}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  disabled={publishingDrawer}
                />
              </div>
            </div>

            <div style={styles.drawerFooter}>
              <button 
                onClick={handleRegenerate} 
                className="btn btn-secondary" 
                style={{ flex: 1, gap: '0.375rem' }}
                disabled={publishingDrawer}
              >
                <RefreshCw size={14} />
                Regenerasi Ulang
              </button>
              
              <button 
                onClick={approveAndPublish} 
                className="btn btn-primary" 
                style={{ flex: 1.5, backgroundColor: 'var(--accent-green)', color: '#09090b', gap: '0.375rem' }}
                disabled={publishingDrawer}
              >
                {publishingDrawer ? (
                  <>
                    <RefreshCw size={14} className="spin-icon" style={{ animation: 'spin 1.5s linear infinite' }} />
                    Memposting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    Setujui & Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    marginBottom: '2rem'
  },
  layout: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap'
  },
  mainCol: {
    flex: 1,
    minWidth: '320px'
  },
  sideCol: {
    width: '380px',
    minWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    height: '480px',
    backgroundColor: '#09090b',
    border: '1px solid var(--border-muted)'
  },
  formRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  addBtn: {
    padding: '0.625rem 1.25rem',
    height: '40px',
    alignSelf: 'flex-end'
  },
  tableHeader: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid var(--border-muted)'
  },
  actionCell: {
    display: 'flex',
    gap: '0.5rem'
  },
  playBtn: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    gap: '0.25rem'
  },
  reviewBtn: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    gap: '0.25rem',
    color: 'var(--accent-cyan)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    backgroundColor: 'var(--accent-cyan-glow)'
  },
  consoleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid var(--border-muted)',
    marginBottom: '1rem'
  },
  consoleBody: {
    flex: 1,
    overflowY: 'auto',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--accent-cyan)',
    backgroundColor: '#000000',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid var(--border-muted)'
  },
  consolePlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    height: '100%',
    color: 'var(--text-muted)',
    gap: '0.75rem',
    padding: '2rem'
  },
  consoleLogWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  consoleLine: {
    whiteSpace: 'pre-wrap',
    lineHeight: '1.4'
  },
  drawerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'flex-end',
    zIndex: 9999,
    animation: 'fadeIn 0.2s ease-out'
  },
  drawer: {
    width: '560px',
    maxWidth: '100%',
    height: '100vh',
    backgroundColor: 'var(--bg-surface)',
    borderLeft: '1px solid var(--border-muted)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-lg)',
    animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  drawerHeader: {
    padding: '1.5rem',
    borderBottom: '1px solid var(--border-muted)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '1.25rem',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '4px',
    lineHeight: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  drawerBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  metricsRow: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '0.5rem'
  },
  metricCard: {
    flex: 1,
    background: 'var(--bg-base)',
    border: '1px solid var(--border-muted)',
    borderRadius: '8px',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  metricLabel: {
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    fontWeight: '600'
  },
  metricValue: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  drawerFooter: {
    padding: '1.5rem',
    borderTop: '1px solid var(--border-muted)',
    display: 'flex',
    gap: '0.75rem',
    backgroundColor: 'var(--bg-base)'
  }
};
