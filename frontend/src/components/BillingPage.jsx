import { useEffect, useState } from 'react';
import { Crown, CheckCircle2, Loader2, CreditCard, QrCode, Building2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { api, formatIDR } from '../api';

const METHODS = [
  { id: 'qris', label: 'QRIS', icon: QrCode, note: 'GoPay, OVO, DANA, ShopeePay, m-banking' },
  { id: 'va', label: 'Virtual Account', icon: Building2, note: 'BCA, Mandiri, BNI, BRI' },
  { id: 'card', label: 'Kartu kredit/debit', icon: CreditCard, note: 'Visa, Mastercard' },
];

export default function BillingPage({ me, refreshMe }) {
  const user = me.user;
  const [data, setData] = useState(null);
  const [checkout, setCheckout] = useState(null); // plan id
  const [method, setMethod] = useState('qris');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ name: user.brandName || '', email: user.email || '', npwp: '' });

  const load = async () => { try { setData(await api('/api/billing')); } catch (e) { setMsg({ ok: false, text: e.message }); } };
  useEffect(() => { load(); }, []);

  const pay = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const d = await api('/api/billing/checkout', { method: 'POST', body: { plan: checkout, method, billing: form } });
      setMsg({ ok: true, text: d.message + ' Invoice ' + d.subscription.invoice_no + ' (simulasi).' });
      setCheckout(null); await refreshMe(); await load();
    } catch (err) { setMsg({ ok: false, text: err.message }); } finally { setBusy(false); }
  };
  const cancel = async () => {
    if (!window.confirm('Turunkan ke paket Free? Web Approver & jadwal otomatis akan nonaktif.')) return;
    setBusy(true); try { await api('/api/billing/cancel', { method: 'POST' }); await refreshMe(); await load(); setMsg({ ok: true, text: 'Langganan dibatalkan. Kamu kembali ke paket Free.' }); } catch (e) { setMsg({ ok: false, text: e.message }); } finally { setBusy(false); }
  };

  const plans = data?.plans || [];
  const current = user.plan || 'free';

  return (
    <div>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1>Langganan</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Bayar ke 3Our, semua biaya riset & AI sudah termasuk. <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>Mode simulasi — tidak ada tagihan nyata</span></p>
      </header>

      {msg && <div style={msg.ok ? styles.okBox : styles.errBox}>{msg.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {msg.text}</div>}

      <div className="grid-2" style={{ alignItems: 'stretch' }}>
        {plans.map(p => {
          const active = current === p.id; const pro = p.id === 'premium';
          return (
            <div className="card" key={p.id} style={{ ...styles.plan, ...(pro ? styles.planPro : {}) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{pro && <Crown size={18} color="#f59e0b" />}{p.name}</h2>
                {active && <span className="badge badge-success">Paket aktif</span>}
              </div>
              <div style={styles.price}>{p.price ? formatIDR(p.price) : 'Gratis'}<span style={styles.per}>{p.price ? ' / bulan' : ''}</span></div>
              <ul style={styles.ul}>{p.features.map(f => <li key={f} style={styles.li}><CheckCircle2 size={14} color="var(--accent-green)" /> {f}</li>)}</ul>
              <div style={{ marginTop: 'auto' }}>
                {pro && !active && <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setCheckout(p.id); setMsg(null); }}>Upgrade ke Pro</button>}
                {pro && active && <button className="btn btn-secondary" style={{ width: '100%' }} onClick={cancel} disabled={busy}>Batalkan langganan</button>}
                {!pro && !active && <div style={styles.sub}>Otomatis aktif bila langganan Pro dibatalkan.</div>}
              </div>
            </div>
          );
        })}
      </div>

      {checkout && (
        <form className="card" style={{ marginTop: '1.5rem' }} onSubmit={pay}>
          <h2 style={{ fontSize: '1rem' }}>Checkout — Paket Pro ({formatIDR(plans.find(p => p.id === checkout)?.price)} / bulan)</h2>
          <div className="grid-2">
            <div>
              <div className="form-group"><label className="form-label">Nama / perusahaan</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Email tagihan</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">NPWP (opsional)</label><input className="form-input" value={form.npwp} onChange={e => setForm({ ...form, npwp: e.target.value })} placeholder="untuk faktur pajak" /></div>
            </div>
            <div>
              <label className="form-label">Metode pembayaran</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {METHODS.map(m => { const Icon = m.icon; const on = method === m.id; return (
                  <button type="button" key={m.id} onClick={() => setMethod(m.id)} style={{ ...styles.method, ...(on ? styles.methodOn : {}) }}>
                    <Icon size={18} color={on ? 'var(--accent-cyan)' : 'var(--text-secondary)'} />
                    <div style={{ textAlign: 'left', flex: 1 }}><div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.label}</div><div style={styles.sub}>{m.note}</div></div>
                    {on && <CheckCircle2 size={16} color="var(--accent-cyan)" />}
                  </button>); })}
              </div>
              <div style={{ ...styles.sub, marginTop: '0.75rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}><ShieldCheck size={14} /> Halaman pembayaran ini masih simulasi (dummy). Integrasi payment gateway 3Our menyusul.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCheckout(null)} disabled={busy}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <Loader2 size={16} className="spin-icon" /> : <Crown size={16} />} Bayar {formatIDR(plans.find(p => p.id === checkout)?.price)} (simulasi)</button>
          </div>
        </form>
      )}

      {data?.history?.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem', padding: 0 }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-muted)' }}><h2 style={{ margin: 0, fontSize: '1rem' }}>Riwayat tagihan</h2></div>
          <div className="table-container"><table className="table">
            <thead><tr><th>Invoice</th><th>Paket</th><th>Metode</th><th>Jumlah</th><th>Periode</th><th>Status</th></tr></thead>
            <tbody>{data.history.map(s => <tr key={s.id}><td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{s.invoice_no}</td><td>{s.plan === 'premium' ? 'Pro' : s.plan}</td><td>{s.method}</td><td>{formatIDR(s.amount)}</td><td style={styles.sub}>{(s.started_at || '').slice(0, 10)} → {(s.ends_at || '').slice(0, 10)}</td><td><span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>{s.status}</span></td></tr>)}</tbody>
          </table></div>
        </div>
      )}
    </div>
  );
}

const styles = {
  plan: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  planPro: { borderColor: 'rgba(245,158,11,0.45)', boxShadow: '0 0 0 1px rgba(245,158,11,0.15), var(--shadow-md)' },
  price: { fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' },
  per: { fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 },
  ul: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0.25rem 0 0.75rem' },
  li: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' },
  sub: { fontSize: '0.78rem', color: 'var(--text-muted)' },
  method: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 10, border: '1px solid var(--border-muted)', background: 'var(--bg-base)', cursor: 'pointer', color: 'inherit' },
  methodOn: { borderColor: 'var(--accent-cyan)', background: 'var(--accent-cyan-glow)' },
  okBox: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 8, border: '1px solid rgba(16,185,129,0.35)', backgroundColor: 'rgba(16,185,129,0.08)', color: '#6ee7b7', fontSize: '0.85rem' },
  errBox: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 8, border: '1px solid rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.08)', color: '#fca5a5', fontSize: '0.85rem' },
};
