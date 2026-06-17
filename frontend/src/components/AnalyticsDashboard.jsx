import React, { useState } from 'react';
import { TrendingUp, MousePointerClick, Eye, Percent, CheckCircle2, DollarSign, Share2 } from 'lucide-react';

export default function AnalyticsDashboard({ user, runCount }) {
  const [activeChart, setActiveChart] = useState('gsc'); // gsc, ads, social

  // Mock data that escalates with runCount (simulating keyword automation impact)
  const baseMultiplier = 1 + (runCount * 0.12);
  
  const gscData = [
    { label: 'Senin', clicks: Math.round(120 * baseMultiplier), impressions: Math.round(1800 * baseMultiplier) },
    { label: 'Selasa', clicks: Math.round(145 * baseMultiplier), impressions: Math.round(2100 * baseMultiplier) },
    { label: 'Rabu', clicks: Math.round(190 * baseMultiplier), impressions: Math.round(2700 * baseMultiplier) },
    { label: 'Kamis', clicks: Math.round(175 * baseMultiplier), impressions: Math.round(2400 * baseMultiplier) },
    { label: 'Jumat', clicks: Math.round(220 * baseMultiplier), impressions: Math.round(3100 * baseMultiplier) },
    { label: 'Sabtu', clicks: Math.round(260 * baseMultiplier), impressions: Math.round(3600 * baseMultiplier) },
    { label: 'Minggu', clicks: Math.round(290 * baseMultiplier), impressions: Math.round(4200 * baseMultiplier) },
  ];

  const adsData = [
    { label: 'Meta', spend: Math.round(45 * baseMultiplier), leads: Math.round(12 * baseMultiplier) },
    { label: 'Google', spend: Math.round(65 * baseMultiplier), leads: Math.round(18 * baseMultiplier) },
    { label: 'TikTok', spend: Math.round(30 * baseMultiplier), leads: Math.round(8 * baseMultiplier) },
  ];

  const socialData = [
    { label: 'IG Reach', value: Math.round(2400 * baseMultiplier) },
    { label: 'FB Reach', value: Math.round(1200 * baseMultiplier) },
    { label: 'IG Engage', value: Math.round(450 * baseMultiplier) },
    { label: 'FB Engage', value: Math.round(180 * baseMultiplier) },
  ];

  // Calculate totals
  const totalClicks = gscData.reduce((acc, curr) => acc + curr.clicks, 0);
  const totalImpressions = gscData.reduce((acc, curr) => acc + curr.impressions, 0);
  const avgCtr = ((totalClicks / totalImpressions) * 100).toFixed(2);
  
  const totalLeads = adsData.reduce((acc, curr) => acc + curr.leads, 0);
  const totalSpend = adsData.reduce((acc, curr) => acc + curr.spend, 0);

  // SVG Chart helpers
  const maxImpressions = Math.max(...gscData.map(d => d.impressions));
  const maxClicks = Math.max(...gscData.map(d => d.clicks));

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1>Analitik & Performa Pemasaran</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Pantau performa SEO Google Search Console, kampanye Ads, dan insight media sosial Brand {user?.brandName || 'Anda'} pasca automasi.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, backgroundColor: 'var(--accent-cyan-glow)' }}>
            <MousePointerClick size={20} color="var(--accent-cyan)" />
          </div>
          <div>
            <p style={styles.kpiLabel}>Organic Clicks (GSC)</p>
            <h3 style={styles.kpiValue}>{totalClicks.toLocaleString()}</h3>
            <span style={styles.kpiDiff} className="badge badge-success">
              <TrendingUp size={10} />
              +{Math.round(18 + runCount * 2)}%
            </span>
          </div>
        </div>

        <div className="card" style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <Eye size={20} color="var(--accent-blue)" />
          </div>
          <div>
            <p style={styles.kpiLabel}>Impressions (GSC)</p>
            <h3 style={styles.kpiValue}>{totalImpressions.toLocaleString()}</h3>
            <span style={styles.kpiDiff} className="badge badge-success">
              <TrendingUp size={10} />
              +{Math.round(12 + runCount * 1.5)}%
            </span>
          </div>
        </div>

        <div className="card" style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            <Percent size={20} color="var(--accent-yellow)" />
          </div>
          <div>
            <p style={styles.kpiLabel}>CTR Rata-rata</p>
            <h3 style={styles.kpiValue}>{avgCtr}%</h3>
            <span style={styles.kpiDiff} className="badge badge-success">
              <TrendingUp size={10} />
              +0.8%
            </span>
          </div>
        </div>

        <div className="card" style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, backgroundColor: 'var(--accent-green-glow)' }}>
            <CheckCircle2 size={20} color="var(--accent-green)" />
          </div>
          <div>
            <p style={styles.kpiLabel}>Conversions (Ads)</p>
            <h3 style={styles.kpiValue}>{totalLeads} Leads</h3>
            <span style={styles.kpiDiff} className="badge badge-success">
              <TrendingUp size={10} />
              +{Math.round(25 + runCount * 3)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts & Controls */}
      <div style={styles.chartSection} className="card">
        <div style={styles.chartHeader}>
          <div style={styles.tabContainer}>
            <button 
              style={{ ...styles.tab, ...(activeChart === 'gsc' ? styles.tabActive : {}) }}
              onClick={() => setActiveChart('gsc')}
            >
              <Eye size={16} />
              Google Search Console
            </button>
            <button 
              style={{ ...styles.tab, ...(activeChart === 'ads' ? styles.tabActive : {}) }}
              onClick={() => setActiveChart('ads')}
            >
              <DollarSign size={16} />
              Kampanye Iklan (Meta/Google)
            </button>
            <button 
              style={{ ...styles.tab, ...(activeChart === 'social' ? styles.tabActive : {}) }}
              onClick={() => setActiveChart('social')}
            >
              <Share2 size={16} />
              Sosial Media Insight
            </button>
          </div>
        </div>

        <div style={styles.chartBody}>
          {activeChart === 'gsc' && (
            <div style={styles.svgWrapper}>
              <h3 style={styles.chartTitle}>Organic Clicks vs Impressions (Minggu Terakhir)</h3>
              <svg viewBox="0 0 700 240" style={styles.svgChart}>
                {/* Grids */}
                {[0, 1, 2, 3].map(i => (
                  <line 
                    key={i} 
                    x1="40" 
                    y1={30 + i * 50} 
                    x2="680" 
                    y2={30 + i * 50} 
                    stroke="var(--border-muted)" 
                    strokeWidth="1" 
                    strokeDasharray="4"
                  />
                ))}

                {/* Line: Impressions */}
                <path
                  d={gscData.map((d, i) => {
                    const x = 50 + i * 100;
                    const y = 200 - (d.impressions / maxImpressions) * 150;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="var(--accent-blue)"
                  strokeWidth="3"
                />

                {/* Line: Clicks */}
                <path
                  d={gscData.map((d, i) => {
                    const x = 50 + i * 100;
                    const y = 200 - (d.clicks / maxClicks) * 150;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="var(--accent-cyan)"
                  strokeWidth="3"
                />

                {/* Nodes & Tooltip dots */}
                {gscData.map((d, i) => {
                  const x = 50 + i * 100;
                  const yImp = 200 - (d.impressions / maxImpressions) * 150;
                  const yCli = 200 - (d.clicks / maxClicks) * 150;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={yImp} r="5" fill="#09090b" stroke="var(--accent-blue)" strokeWidth="3" />
                      <circle cx={x} cy={yCli} r="5" fill="#09090b" stroke="var(--accent-cyan)" strokeWidth="3" />
                      <text x={x} y="225" textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontFamily="var(--font-sans)">
                        {d.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div style={styles.legend}>
                <div style={styles.legendItem}>
                  <div style={{ ...styles.legendDot, backgroundColor: 'var(--accent-cyan)' }}></div>
                  <span style={styles.legendText}>Clicks (Skala Relatif)</span>
                </div>
                <div style={styles.legendItem}>
                  <div style={{ ...styles.legendDot, backgroundColor: 'var(--accent-blue)' }}></div>
                  <span style={styles.legendText}>Impressions (Skala Relatif)</span>
                </div>
              </div>
            </div>
          )}

          {activeChart === 'ads' && (
            <div style={styles.svgWrapper}>
              <h3 style={styles.chartTitle}>Ad Spend (USD) vs Leads (Conversion)</h3>
              <svg viewBox="0 0 700 240" style={styles.svgChart}>
                {/* Grids */}
                {[0, 1, 2, 3].map(i => (
                  <line 
                    key={i} 
                    x1="40" 
                    y1={30 + i * 50} 
                    x2="680" 
                    y2={30 + i * 50} 
                    stroke="var(--border-muted)" 
                    strokeWidth="1" 
                  />
                ))}

                {/* Bars */}
                {adsData.map((d, i) => {
                  const x = 120 + i * 180;
                  const hSpend = (d.spend / 100) * 150;
                  const hLeads = (d.leads / 30) * 150;
                  return (
                    <g key={i}>
                      {/* Bar 1: Spend */}
                      <rect x={x} y={200 - hSpend} width="35" height={hSpend} fill="var(--accent-yellow)" rx="4" />
                      {/* Bar 2: Leads */}
                      <rect x={x + 45} y={200 - hLeads} width="35" height={hLeads} fill="var(--accent-green)" rx="4" />
                      
                      <text x={x + 40} y="225" textAnchor="middle" fill="var(--text-primary)" fontSize="12" fontWeight="600">
                        {d.label} Ads
                      </text>
                      <text x={x + 17} y={190 - hSpend} textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontFamily="var(--font-mono)">
                        ${d.spend}
                      </text>
                      <text x={x + 62} y={190 - hLeads} textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontFamily="var(--font-mono)">
                        {d.leads}L
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div style={styles.legend}>
                <div style={styles.legendItem}>
                  <div style={{ ...styles.legendDot, backgroundColor: 'var(--accent-yellow)' }}></div>
                  <span style={styles.legendText}>Biaya Iklan ($ Spend)</span>
                </div>
                <div style={styles.legendItem}>
                  <div style={{ ...styles.legendDot, backgroundColor: 'var(--accent-green)' }}></div>
                  <span style={styles.legendText}>Leads Didapatkan (Conversions)</span>
                </div>
              </div>
            </div>
          )}

          {activeChart === 'social' && (
            <div style={styles.svgWrapper}>
              <h3 style={styles.chartTitle}>Media Sosial Reach & Engagement</h3>
              <svg viewBox="0 0 700 240" style={styles.svgChart}>
                {/* Grids */}
                {[0, 1, 2, 3].map(i => (
                  <line 
                    key={i} 
                    x1="40" 
                    y1={30 + i * 50} 
                    x2="680" 
                    y2={30 + i * 50} 
                    stroke="var(--border-muted)" 
                    strokeWidth="1" 
                    strokeDasharray="4"
                  />
                ))}

                {/* Bars for Social reach/engage metrics */}
                {socialData.map((d, i) => {
                  const x = 70 + i * 150;
                  const maxVal = Math.max(...socialData.map(s => s.value));
                  const h = (d.value / maxVal) * 150;
                  return (
                    <g key={i}>
                      <rect x={x} y={200 - h} width="70" height={h} fill="var(--accent-cyan)" rx="6" />
                      <text x={x + 35} y="225" textAnchor="middle" fill="var(--text-secondary)" fontSize="11">
                        {d.label}
                      </text>
                      <text x={x + 35} y={190 - h} textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontFamily="var(--font-mono)" fontWeight="600">
                        {d.value.toLocaleString()}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div style={styles.legend}>
                <div style={styles.legendItem}>
                  <div style={{ ...styles.legendDot, backgroundColor: 'var(--accent-cyan)' }}></div>
                  <span style={styles.legendText}>Jumlah Reach / Impression Medsos</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    marginBottom: '2rem'
  },
  kpiCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem'
  },
  kpiIconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    borderRadius: '10px'
  },
  kpiLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem'
  },
  kpiValue: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '0.375rem',
    lineHeight: '1'
  },
  kpiDiff: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.125rem 0.375rem',
    fontSize: '0.625rem',
    fontWeight: '600'
  },
  chartSection: {
    padding: '1.5rem',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'center',
    borderBottom: '1px solid var(--border-muted)',
    paddingBottom: '1rem',
    marginBottom: '1.5rem'
  },
  tabContainer: {
    display: 'inline-flex',
    gap: '0.5rem',
    backgroundColor: 'var(--bg-base)',
    padding: '0.25rem',
    borderRadius: '8px',
    border: '1px solid var(--border-muted)'
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    fontSize: '0.8125rem',
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
  chartBody: {
    minHeight: '260px'
  },
  svgWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%'
  },
  chartTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: 'var(--text-primary)',
    alignSelf: 'flex-start'
  },
  svgChart: {
    width: '100%',
    maxHeight: '240px',
    overflow: 'visible'
  },
  legend: {
    display: 'flex',
    gap: '1.5rem',
    marginTop: '1.5rem',
    justifyContent: 'center'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  legendText: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  }
};
