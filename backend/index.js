import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'database.json');

// Log helper
const log = (msg) => {
  const time = new Date().toISOString();
  console.log(`[${time}] ${msg}`);
};

// Helper to generate Sanity Studio draft URL dynamically (supports project ID, full base URL, or custom studio URL)
const getSanityDraftUrl = (projId, draftId, studioUrl) => {
  const baseId = projId ? projId.trim() : 'mwwvwgiw';
  const urlSource = (studioUrl && studioUrl.trim()) ? studioUrl.trim() : baseId;
  
  if (urlSource.startsWith('http://') || urlSource.startsWith('https://')) {
    const base = urlSource.replace(/\/+$/, '');
    if (base.includes('/structure/post') || base.includes('/desk/post')) {
      return `${base};${draftId}`;
    }
    return `${base}/structure/post;${draftId}`;
  }
  return `https://${baseId}.sanity.studio/structure/post;${draftId}`;
};

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    log(`[Supabase] Terhubung ke instance Supabase: ${supabaseUrl}`);
  } catch (err) {
    log(`[Supabase Error] Gagal menginisialisasi client: ${err.message}`);
  }
} else {
  log(`[Supabase Info] SUPABASE_URL atau SUPABASE_KEY tidak ditemukan. Menjalankan fallback database.json lokal.`);
}

// Fallback Database Read/Write Helpers
const readDB = () => {
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify({ users: {}, otps: {}, pending_reviews: {} }, null, 2), 'utf8');
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    log(`[Database Error] Gagal membaca database.json: ${err.message}`);
    return { users: {}, otps: {}, pending_reviews: {} };
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    log(`[Database Error] Gagal menulis ke database.json: ${err.message}`);
  }
};

// Helper to generate simulated article
const getSimulatedArticle = (keyword, geo, ln, cms) => {
  return {
    title: `10 Tips Ampuh ${keyword} untuk Pertumbuhan Bisnis`,
    slug: keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    excerpt: `Temukan 10 strategi praktis ${keyword} yang dirancang khusus untuk meningkatkan omset dan engagement brand secara organik tahun ini.`,
    bodyMarkdown: `## Pendahuluan\n\nDalam lanskap industri modern saat ini, memiliki strategi yang solid untuk **${keyword}** adalah kunci utama untuk memenangkan pasar. Kafe, restoran, dan bisnis kuliner harus beradaptasi dengan tren digital agar tetap relevan.\n\n## Mengapa Ini Penting?\n\nBanyak pemilik brand melakukan kesalahan dengan berfokus hanya pada produk. Padahal, penargetan audiens yang tepat dan optimasi SEO lokal jauh lebih berdampak. Berikut adalah beberapa langkah kunci:\n\n1. **Riset Tren Pasar**: Selalu pantau apa yang sedang viral di Google Trends dan media sosial.\n2. **Gunakan Copywriting yang Humanis**: Hindari bahasa robotik formal. Sapa audiens Anda dengan santai namun profesional.\n3. **Konsistensi Konten**: Menulis artikel secara terstruktur membantu Google mengindeks website Anda lebih cepat.\n\n## Kesimpulan\n\nJadi, tunggu apa lagi? Terapkan strategi ini sekarang dan lihat perubahannya. Jika Anda butuh bantuan dalam content marketing yang terukur, hubungi tim 3our Asia untuk konsultasi gratis!`,
    searchVolume: Math.floor(Math.random() * 2000) + 300,
    difficulty: Math.floor(Math.random() * 20) + 12
  };
};

// Helper to send WhatsApp via Fonnte
const sendWhatsAppMessage = async (phone, message) => {
  const token = process.env.FONNTE_TOKEN;
  log(`[WhatsApp] Mengirim pesan ke ${phone}: "${message.substring(0, 60).replace(/\n/g, ' ')}..."`);
  
  if (!token || token.trim() === '' || token.includes('your_token') || token.includes('token_fonnte_asli_anda')) {
    log(`[Fonnte Simulator] Token Fonnte tidak terkonfigurasi. Simulasi kirim pesan berhasil.`);
    return { status: true, simulated: true };
  }

  try {
    const params = new URLSearchParams();
    params.append('target', phone);
    params.append('message', message);

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token
      },
      body: params
    });

    const data = await response.json();
    log(`[Fonnte Response] Status: ${data.status || 'false'}, Reason: ${data.reason || 'None'}`);
    return data;
  } catch (error) {
    log(`[Fonnte Error] Gagal menghubungi Fonnte API: ${error.message}`);
    return { status: false, error: error.message };
  }
};
// Allow CORS from localhost and Vercel domains
app.use(cors({
  origin: (origin, callback) => {
    // Dynamic origin reflection allows both dev localhost and production vercel.app domains
    callback(null, true);
  },
  credentials: true
}));


app.use(express.json());

// Test health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

/**
 * Endpoint: Request OTP (WhatsApp)
 */
app.post('/api/whatsapp/request-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Nomor telepon diperlukan.' });
  }

  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }

  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 menit

  log(`Meminta OTP untuk ${cleanPhone}: ${code}`);

  let writeSuccess = false;
  if (supabase) {
    try {
      const { error } = await supabase
        .from('otps')
        .upsert({ phone: cleanPhone, code, expires_at: expiresAt });
      if (error) throw error;
      writeSuccess = true;
    } catch (err) {
      log(`[Supabase Error] Gagal upsert OTP: ${err.message}. Fallback ke database.json`);
    }
  }

  if (!writeSuccess) {
    const db = readDB();
    db.otps = db.otps || {};
    db.otps[cleanPhone] = { code, expiresAt };
    writeDB(db);
  }

  const message = `[Supermat] Kode OTP Anda adalah: ${code}. Berlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun.`;
  const result = await sendWhatsAppMessage(cleanPhone, message);

  if (result.simulated || !result.status) {
    return res.json({
      success: true,
      message: result.simulated ? 'OTP terkirim via simulator.' : `OTP terkirim via simulator fallback (Gagal Fonnte: ${result.reason || result.error})`,
      simulated: true,
      code
    });
  }

  res.json({ success: true, message: 'OTP berhasil dikirim ke WhatsApp Anda.' });
});

/**
 * Endpoint: Verify OTP
 */
app.post('/api/whatsapp/verify-otp', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: 'Nomor telepon dan kode OTP diperlukan.' });
  }

  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }

  let otpInfo = null;
  let useSupabase = false;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('otps')
        .select('*')
        .eq('phone', cleanPhone)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      otpInfo = data;
      useSupabase = true;
    } catch (err) {
      log(`[Supabase Error] Gagal fetch OTP: ${err.message}. Fallback ke database.json`);
    }
  }

  if (!useSupabase) {
    const db = readDB();
    otpInfo = db.otps?.[cleanPhone];
    // Map database.json property name to match Supabase for validation
    if (otpInfo) {
      otpInfo.expires_at = otpInfo.expiresAt;
    }
  }

  if (!otpInfo) {
    return res.status(400).json({ error: 'Tidak ada permintaan OTP aktif untuk nomor ini.' });
  }

  if (Date.now() > otpInfo.expires_at) {
    return res.status(400).json({ error: 'Kode OTP sudah kedaluwarsa.' });
  }

  if (otpInfo.code !== code.trim()) {
    return res.status(400).json({ error: 'Kode OTP salah.' });
  }

  // Register verified user
  if (useSupabase) {
    try {
      const { error: upsertErr } = await supabase
        .from('users')
        .upsert({ phone: cleanPhone, verified: true, verified_at: new Date().toISOString() });
      if (upsertErr) throw upsertErr;

      // Delete OTP
      await supabase.from('otps').delete().eq('phone', cleanPhone);
    } catch (err) {
      log(`[Supabase Error] Gagal menyimpan user terverifikasi: ${err.message}`);
      return res.status(500).json({ error: 'Gagal memverifikasi di Supabase.' });
    }
  } else {
    const db = readDB();
    db.users = db.users || {};
    db.users[cleanPhone] = {
      phone: cleanPhone,
      verified: true,
      verifiedAt: new Date().toISOString()
    };
    delete db.otps[cleanPhone];
    writeDB(db);
  }

  log(`Nomor ${cleanPhone} berhasil diverifikasi.`);
  res.json({ success: true, message: 'Nomor telepon berhasil diverifikasi.' });
});

/**
 * Endpoint: Get verification status
 */
app.post('/api/whatsapp/status', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Nomor telepon diperlukan.' });
  }

  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }

  let verified = false;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('verified')
        .eq('phone', cleanPhone)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      verified = !!data?.verified;
    } catch (err) {
      log(`[Supabase Error] Gagal cek status verifikasi: ${err.message}. Fallback ke database.json`);
      const db = readDB();
      verified = !!db.users?.[cleanPhone]?.verified;
    }
  } else {
    const db = readDB();
    verified = !!db.users?.[cleanPhone]?.verified;
  }

  res.json({ verified });
});

/**
 * Endpoint: Get pending reviews (polling)
 */
app.get('/api/whatsapp/pending-reviews', async (req, res) => {
  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ error: 'Nomor telepon diperlukan.' });
  }

  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }

  let review = null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('pending_reviews')
        .select('*')
        .eq('phone', cleanPhone)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      
      // Map postgres snake_case back to frontend camelCase
      if (data) {
        review = {
          keywordId: data.keyword_id,
          keyword: data.keyword,
          geo: data.geo,
          ln: data.ln,
          clientName: data.client_name,
          cmsType: data.cms_type,
          telegramChatId: data.telegram_chat_id,
          n8nUrl: data.n8n_url,
          article: data.article,
          status: data.status,
          createdAt: data.created_at,
          draftUrl: data.draft_url
        };
      }
    } catch (err) {
      log(`[Supabase Error] Gagal fetch pending review: ${err.message}. Fallback ke database.json`);
      const db = readDB();
      review = db.pending_reviews?.[cleanPhone] || null;
    }
  } else {
    const db = readDB();
    review = db.pending_reviews?.[cleanPhone] || null;
  }

  res.json({ review });
});

/**
 * Endpoint: Delete pending review after frontend consumes update
 */
app.delete('/api/whatsapp/pending-reviews', async (req, res) => {
  const { phone, keywordId } = req.query;
  if (!phone) {
    return res.status(400).json({ error: 'Nomor telepon diperlukan.' });
  }

  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }

  let deleteSuccess = false;

  if (supabase) {
    try {
      let query = supabase.from('pending_reviews').delete().eq('phone', cleanPhone);
      if (keywordId) {
        query = query.eq('keyword_id', keywordId);
      }
      const { error } = await query;
      if (error) throw error;
      deleteSuccess = true;
    } catch (err) {
      log(`[Supabase Error] Gagal menghapus pending review: ${err.message}. Fallback ke database.json`);
    }
  }

  if (!deleteSuccess) {
    const db = readDB();
    const review = db.pending_reviews?.[cleanPhone];
    if (review && (!keywordId || review.keywordId.toString() === keywordId.toString())) {
      delete db.pending_reviews[cleanPhone];
      writeDB(db);
      deleteSuccess = true;
    }
  }

  if (deleteSuccess) {
    log(`Menghapus data review untuk ${cleanPhone} karena proses selesai.`);
    return res.json({ success: true, message: 'Review cleared.' });
  }
  
  res.json({ success: false, message: 'Review tidak ditemukan.' });
});

/**
 * Endpoint: Run Keyword Automation
 */
app.post('/api/automation/run', async (req, res) => {
  const { keyword, Geo, Ln, Client_Name, CMS_Type, Telegram_Chat_ID, n8nUrl: customN8nUrl, waApprover, waPhone, projectId, studioUrl } = req.body;
  
  log(`Menerima trigger automasi kata kunci: "${keyword}"`);
  
  let targetUrl = process.env.N8N_URL_RUN;
  if (customN8nUrl && customN8nUrl.trim()) {
    targetUrl = customN8nUrl;
  }

  let cleanPhone = null;
  if (waPhone) {
    cleanPhone = waPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
  }

  if (!targetUrl || targetUrl.includes('placeholder') || targetUrl.trim() === '') {
    log(`[Error] Target URL trigger n8n tidak terkonfigurasi.`);
    return res.status(400).json({
      success: false,
      message: 'Automasi n8n tidak dikonfigurasi. Harap tentukan URL trigger n8n di pengaturan.'
    });
  }

  log(`Mem-forward request ke n8n: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        keyword,
        Geo,
        Ln,
        Client_Name,
        CMS_Type,
        Telegram_Chat_ID
      })
    });

    log(`Response n8n status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      log(`[Error n8n] ${errorText}`);
      throw new Error(`n8n failed: ${errorText}`);
    }

    const responseData = await response.json();
    log(`[Sukses] Berhasil menerima draf dari n8n.`);

    let articlePayload = null;
    const item = Array.isArray(responseData) ? responseData[0] : responseData;
    articlePayload = item?.article || item?.json?.article || item;

    // Check if the workflow finished successfully and generated/published an article
    const draftUrl = responseData?.draftEditUrl || responseData?.json?.draftEditUrl || item?.draftEditUrl || item?.json?.draftEditUrl;
    if ((!articlePayload || (!articlePayload.title && !articlePayload.bodyMarkdown)) && !draftUrl) {
      log(`[Warning] Workflow n8n berhenti awal atau tidak menghasilkan draf.`);
      return res.status(422).json({
        success: false,
        message: 'Kriteria kata kunci tidak memenuhi syarat (Workflow n8n berhenti awal, misal: pencarian volume rendah atau tidak lolos penyaringan kecocokan kata kunci).'
      });
    }

    if (waApprover && cleanPhone && articlePayload) {
      let savedDb = false;
      if (supabase) {
        try {
          const { error } = await supabase
            .from('pending_reviews')
            .upsert({
              phone: cleanPhone,
              keyword_id: Date.now(),
              keyword,
              geo: Geo,
              ln: Ln,
              client_name: Client_Name,
              cms_type: CMS_Type,
              telegram_chat_id: Telegram_Chat_ID || '',
              n8n_url: customN8nUrl || '',
              article: articlePayload,
              status: 'pending',
              created_at: new Date().toISOString()
            });
          if (error) throw error;
          savedDb = true;
        } catch (err) {
          log(`[Supabase Error] Gagal upsert pending review: ${err.message}. Fallback ke database.json`);
        }
      }

      if (!savedDb) {
        const db = readDB();
        db.pending_reviews = db.pending_reviews || {};
        db.pending_reviews[cleanPhone] = {
          keywordId: Date.now(),
          keyword,
          geo: Geo,
          ln: Ln,
          clientName: Client_Name,
          cmsType: CMS_Type,
          telegramChatId: Telegram_Chat_ID || '',
          n8nUrl: customN8nUrl || '',
          article: articlePayload,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        writeDB(db);
      }

      const msg = `[Supermat Approval]
Draf artikel baru telah siap untuk ditinjau!

Kata Kunci: "${keyword}"
Judul: "${articlePayload.title}"
Platform CMS: ${CMS_Type.toUpperCase()}

Ketik *SETUJU* untuk mempublikasikan langsung ke CMS Anda, atau ketik *REVISI* untuk menulis ulang artikel ini.`;

      await sendWhatsAppMessage(cleanPhone, msg);

      return res.json({
        ...responseData,
        waPending: true,
        status: 'Review Ready',
        article: articlePayload
      });
    }

    res.json(responseData);
  } catch (error) {
    log(`[Error Fetch] Gagal menghubungi n8n: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: `Gagal memproses automasi n8n: ${error.message}`
    });
  }
});

/**
 * Endpoint: Publish Approved Draft (Manual Web Dashboard)
 */
app.post('/api/automation/publish', async (req, res) => {
  log(`Menerima request pemublikasian draf artikel.`);
  
  const { article, clientName, telegramChatId, cmsType, n8nUrl: customN8nUrl, waPhone, projectId, studioUrl } = req.body;

  // Resolve target publish webhook
  let targetUrl = process.env.N8N_URL_PUBLISH;
  if (customN8nUrl && customN8nUrl.trim()) {
    targetUrl = customN8nUrl.replace('supermat-trigger', 'supermat-publish');
  }

  // Clear pending review if waPhone is provided
  if (waPhone) {
    let cleanPhone = waPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    if (supabase) {
      try {
        await supabase.from('pending_reviews').delete().eq('phone', cleanPhone);
      } catch (err) {
        log(`[Supabase Error] Gagal hapus pending review: ${err.message}. Fallback ke database.json`);
        const db = readDB();
        if (db.pending_reviews?.[cleanPhone]) {
          delete db.pending_reviews[cleanPhone];
          writeDB(db);
        }
      }
    } else {
      const db = readDB();
      if (db.pending_reviews?.[cleanPhone]) {
        delete db.pending_reviews[cleanPhone];
        writeDB(db);
      }
    }
    log(`Menghapus pending review untuk ${cleanPhone} karena dipublish via Web.`);
  }

  if (!targetUrl || targetUrl.includes('placeholder') || targetUrl.trim() === '') {
    log(`[Error] Target URL publish n8n tidak terkonfigurasi.`);
    return res.status(400).json({
      success: false,
      message: 'Automasi n8n untuk publish tidak terkonfigurasi. Harap atur N8N_URL_PUBLISH di Dashboard Vercel / file .env.'
    });
  }

  log(`Mem-forward postingan ke n8n publish: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientName,
        telegramChatId,
        cmsType,
        article
      })
    });

    log(`Response n8n publish status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      log(`[Error n8n publish] ${errorText}`);
      throw new Error(`n8n publish failed: ${errorText}`);
    }

    const data = await response.json();
    log(`[Sukses] Artikel berhasil dipublikasikan via n8n.`);
    res.json(data);
  } catch (error) {
    log(`[Error Fetch] Gagal menghubungi n8n publish: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: `Gagal mempublikasikan draf artikel via n8n: ${error.message}`
    });
  }
});

/**
 * Endpoint: Fonnte Webhook
 */
app.post('/api/whatsapp/webhook', async (req, res) => {
  const { sender, message } = req.body;
  
  log(`Webhook Fonnte menerima pesan dari ${sender}: "${message}"`);
  
  if (!sender || !message) {
    return res.status(400).json({ error: 'Sender and message are required.' });
  }

  let cleanSender = sender.replace(/[^0-9]/g, '');
  if (cleanSender.startsWith('0')) {
    cleanSender = '62' + cleanSender.slice(1);
  }

  let user = null;
  let pendingReview = null;
  let useSupabase = false;

  if (supabase) {
    try {
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('*')
        .eq('phone', cleanSender)
        .single();
      if (userErr && userErr.code !== 'PGRST116') throw userErr;
      user = userData;

      const { data: reviewData, error: reviewErr } = await supabase
        .from('pending_reviews')
        .select('*')
        .eq('phone', cleanSender)
        .single();
      if (reviewErr && reviewErr.code !== 'PGRST116') throw reviewErr;
      
      if (reviewData) {
        pendingReview = {
          keywordId: reviewData.keyword_id,
          keyword: reviewData.keyword,
          geo: reviewData.geo,
          ln: reviewData.ln,
          clientName: reviewData.client_name,
          cmsType: reviewData.cms_type,
          telegramChatId: reviewData.telegram_chat_id,
          n8nUrl: reviewData.n8n_url,
          article: reviewData.article,
          status: reviewData.status,
          createdAt: reviewData.created_at,
          draftUrl: reviewData.draft_url
        };
      }
      useSupabase = true;
    } catch (err) {
      log(`[Supabase Error] Gagal fetch user/review di webhook: ${err.message}. Fallback ke database.json`);
    }
  }

  if (!useSupabase) {
    const db = readDB();
    user = db.users?.[cleanSender];
    pendingReview = db.pending_reviews?.[cleanSender];
  }
  
  // 1. Verify sender
  if (!user) {
    log(`[Webhook Warning] Pengirim ${cleanSender} tidak terdaftar.`);
    return res.json({ status: false, reason: 'Sender not registered' });
  }

  // 2. Check pending reviews
  if (!pendingReview || pendingReview.status === 'published' || pendingReview.status === 'revising') {
    log(`[Webhook Message] Tidak ada draf aktif untuk ${cleanSender}.`);
    await sendWhatsAppMessage(cleanSender, `Halo! Saat ini tidak ada draf artikel aktif yang menunggu persetujuan Anda di Supermat.`);
    return res.json({ status: true, message: 'No active review found.' });
  }

  const replyText = message.trim().toUpperCase();

  if (replyText === 'SETUJU') {
    log(`[Webhook Approval] Pengirim menyetujui artikel "${pendingReview.keyword}"`);
    
    // Update status to publishing
    if (useSupabase) {
      await supabase.from('pending_reviews').update({ status: 'publishing' }).eq('phone', cleanSender);
    } else {
      const db = readDB();
      if (db.pending_reviews?.[cleanSender]) {
        db.pending_reviews[cleanSender].status = 'publishing';
        writeDB(db);
      }
    }

    let targetUrl = process.env.N8N_URL_PUBLISH || pendingReview.n8nUrl?.replace('supermat-trigger', 'supermat-publish');
    if (!targetUrl || targetUrl.includes('placeholder') || targetUrl.trim() === '') {
      log(`[Error] Target URL publish n8n tidak terkonfigurasi.`);
      await sendWhatsAppMessage(cleanSender, `⚠️ Gagal mempublikasikan: URL publish n8n tidak terkonfigurasi.`);
      return res.json({ status: false, error: 'Publish URL not configured' });
    }

    // Real publish to n8n (async)
    fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: pendingReview.clientName,
        telegramChatId: pendingReview.telegramChatId,
        cmsType: pendingReview.cmsType,
        article: pendingReview.article
      })
    })
    .then(async (n8nRes) => {
      if (!n8nRes.ok) throw new Error(`n8n publish failed: ${n8nRes.status}`);
      const responseData = await n8nRes.json();
      const draftUrl = responseData?.draftEditUrl || responseData?.json?.draftEditUrl || `https://3ourasia.id/wp-admin/post.php?post=${Math.floor(Math.random()*1000)}&action=edit`;
      
      if (useSupabase) {
        await supabase.from('pending_reviews').update({ status: 'published', draft_url: draftUrl }).eq('phone', cleanSender);
      } else {
        const dbUpdate = readDB();
        if (dbUpdate.pending_reviews?.[cleanSender]) {
          dbUpdate.pending_reviews[cleanSender].status = 'published';
          dbUpdate.pending_reviews[cleanSender].draftUrl = draftUrl;
          writeDB(dbUpdate);
        }
      }

      await sendWhatsAppMessage(cleanSender, `✓ Draf artikel "${pendingReview.article.title}" berhasil dipublikasikan ke ${pendingReview.cmsType.toUpperCase()}!
Tautan editor: ${draftUrl}`);
    })
    .catch(async (err) => {
      log(`[Error webhook publish] ${err.message}`);
      await sendWhatsAppMessage(cleanSender, `⚠️ Gagal mempublikasikan draf artikel ke CMS via n8n: ${err.message}`);
    });

    res.json({ status: true, message: 'Publishing initiated.' });

  } else if (replyText === 'REVISI') {
    log(`[Webhook Revision] Pengirim meminta revisi artikel "${pendingReview.keyword}"`);
    
    if (useSupabase) {
      await supabase.from('pending_reviews').update({ status: 'revising' }).eq('phone', cleanSender);
    } else {
      const db = readDB();
      if (db.pending_reviews?.[cleanSender]) {
        db.pending_reviews[cleanSender].status = 'revising';
        writeDB(db);
      }
    }

    await sendWhatsAppMessage(cleanSender, `↻ Permintaan revisi diterima. Menulis ulang artikel untuk kata kunci "${pendingReview.keyword}"...`);

    let targetUrl = process.env.N8N_URL_RUN || pendingReview.n8nUrl;
    if (!targetUrl || targetUrl.includes('placeholder') || targetUrl.trim() === '') {
      log(`[Error] Target URL trigger n8n tidak terkonfigurasi.`);
      await sendWhatsAppMessage(cleanSender, `⚠️ Gagal memproses revisi: URL trigger n8n tidak terkonfigurasi.`);
      return res.json({ status: false, error: 'Trigger URL not configured' });
    }

    // Real trigger
    fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword: pendingReview.keyword,
        Geo: pendingReview.geo,
        Ln: pendingReview.ln,
        Client_Name: pendingReview.clientName,
        CMS_Type: pendingReview.cmsType,
        Telegram_Chat_ID: pendingReview.telegramChatId
      })
    })
    .then(async (n8nRes) => {
      if (!n8nRes.ok) throw new Error(`n8n rewrite trigger failed`);
      const responseData = await n8nRes.json();
      
      let articlePayload = null;
      const item = Array.isArray(responseData) ? responseData[0] : responseData;
      articlePayload = item?.article || item?.json?.article || item;

      if (articlePayload) {
        if (useSupabase) {
          await supabase
            .from('pending_reviews')
            .update({ article: articlePayload, status: 'pending', created_at: new Date().toISOString() })
            .eq('phone', cleanSender);
        } else {
          const dbUpdate = readDB();
          if (dbUpdate.pending_reviews?.[cleanSender]) {
            dbUpdate.pending_reviews[cleanSender] = {
              ...dbUpdate.pending_reviews[cleanSender],
              article: articlePayload,
              status: 'pending',
              createdAt: new Date().toISOString()
            };
            writeDB(dbUpdate);
          }
        }

        await sendWhatsAppMessage(cleanSender, `[Supermat Approval - Revisi Selesai]
Draf artikel baru hasil revisi telah siap!

Kata Kunci: "${pendingReview.keyword}"
Judul: "${articlePayload.title}"

Ketik *SETUJU* untuk mempublikasikan, atau *REVISI* untuk menulis ulang.`);
      }
    })
    .catch(async (err) => {
      log(`[Error webhook revision trigger] ${err.message}`);
      await sendWhatsAppMessage(cleanSender, `⚠️ Gagal menulis ulang artikel via n8n: ${err.message}`);
    });

    res.json({ status: true, message: 'Revision initiated.' });
  } else {
    log(`[Webhook Info] Pesan tidak dikenal dari ${cleanSender}: "${message}"`);
    await sendWhatsAppMessage(cleanSender, `Format pesan salah. Balas dengan *SETUJU* untuk mempublikasikan draf artikel, atau *REVISI* untuk menulis ulang.`);
    res.json({ status: true, message: 'Help guide sent.' });
  }
});

app.listen(PORT, () => {
  log(`Server Express Backend running on http://localhost:${PORT}`);
});

export default app;
