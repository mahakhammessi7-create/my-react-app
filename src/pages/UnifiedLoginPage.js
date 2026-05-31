import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

// ─── RBAC ───────────────────────────────────────────────────────
const ROLE_REDIRECTS = [
  { test: (r) => String(r).toLowerCase().includes('administrateur'), path: '/admin/dashboard',       label: 'Administration',       icon: '🛡️', color: '#f87171' },
  { test: (r) => String(r).toLowerCase().trim() === 'charge_etude',  path: '/charge-etude/dashboard', label: "Chargé d'Étude",        icon: '📊', color: '#a78bfa' },
 { test: (r) => {
    const s = String(r).toLowerCase();
    return s.includes('responsable') || s.includes('resp_suivi') || s.includes('resp');
  }, path: '/responsable/dashboard' },
  { test: (r) => { const s = String(r).toLowerCase(); return s.includes('decideur') || s.includes('décideur'); },
                                                                      path: '/decideur/dashboard',     label: 'Décideur',              icon: '🎯', color: '#60a5fa' },
];

function redirectByRole(role, navigate) {
  const match = ROLE_REDIRECTS.find((r) => r.test(role));
  navigate(match ? match.path : '/');
}

// ─── CSS ────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes ul-up    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ul-fadeIn{ from{opacity:0} to{opacity:1} }
  @keyframes ul-spin  { to{transform:rotate(360deg)} }
  @keyframes ul-rotate{ from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes ul-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-7px)} 40%,80%{transform:translateX(7px)} }
  @keyframes ul-glow  { 0%,100%{opacity:.2} 50%{opacity:.55} }
  @keyframes ul-scan  { 0%{top:0;opacity:.55} 100%{top:100%;opacity:0} }
  @keyframes ul-pulse { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.08);opacity:1} }

  * { box-sizing:border-box; margin:0; padding:0; }

  .ul-root {
    font-family:'DM Sans',sans-serif;
    min-height:100vh; background:#070d16;
    display:flex; align-items:center; justify-content:center;
    position:relative; overflow:hidden; animation:ul-fadeIn .4s ease;
  }
  .ul-root::before {
    content:''; position:absolute; inset:0;
    background-image:
      linear-gradient(rgba(248,113,113,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(248,113,113,.025) 1px, transparent 1px);
    background-size:40px 40px; pointer-events:none;
  }

  .ul-card {
    position:relative; z-index:10;
    background:rgba(255,255,255,.022);
    border:1px solid rgba(248,113,113,.12);
    border-radius:24px; padding:40px 36px;
    width:100%; max-width:420px;
    backdrop-filter:blur(14px);
    box-shadow:0 32px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(248,113,113,.06);
    animation:ul-up .55s cubic-bezier(.22,1,.36,1);
    overflow:hidden;
  }

  .ul-scan {
    position:absolute; left:0; right:0; height:2px;
    background:linear-gradient(90deg,transparent,rgba(248,113,113,.35),transparent);
    animation:ul-scan 3.5s linear infinite; pointer-events:none;
  }

  .ul-input-wrap { position:relative; margin-bottom:14px; }
  .ul-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); font-size:14px; pointer-events:none; }

  .ul-input {
    width:100%; padding:13px 16px 13px 40px;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07);
    border-radius:13px; color:#e2f0ff;
    font-size:14px; font-family:'DM Sans',sans-serif;
    outline:none; transition:border-color .25s, background .25s, box-shadow .25s;
  }
  .ul-input::placeholder { color:#2a3a52; }
  .ul-input:focus {
    border-color:rgba(248,113,113,.4);
    background:rgba(248,113,113,.04);
    box-shadow:0 0 0 3px rgba(248,113,113,.07);
  }
  .ul-input.error { border-color:rgba(248,113,113,.5); animation:ul-shake .4s ease; }

  .ul-eye {
    position:absolute; right:13px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer;
    font-size:14px; color:#2a3a52; transition:color .2s; padding:4px;
  }
  .ul-eye:hover { color:#f87171; }

  .ul-submit {
    width:100%; padding:14px;
    background:linear-gradient(135deg,#ef4444,#b91c1c);
    color:#fff; border:none; border-radius:13px;
    font-size:15px; font-family:'DM Sans',sans-serif; font-weight:700;
    cursor:pointer; letter-spacing:.3px;
    display:flex; align-items:center; justify-content:center; gap:9px;
    transition:filter .2s, transform .15s, box-shadow .2s;
    box-shadow:0 6px 24px rgba(239,68,68,.2);
  }
  .ul-submit:hover:not(:disabled) {
    filter:brightness(1.1); transform:translateY(-2px);
    box-shadow:0 12px 32px rgba(239,68,68,.3);
  }
  .ul-submit:disabled { background:rgba(255,255,255,.07); color:#2a3a52; cursor:not-allowed; transform:none; box-shadow:none; }

  .ul-error {
    display:flex; align-items:flex-start; gap:9px;
    background:rgba(248,113,113,.08); border:1px solid rgba(248,113,113,.22);
    border-radius:12px; padding:12px 14px; margin-bottom:16px;
    animation:ul-shake .4s ease;
  }

  .ul-footer {
    display:flex; align-items:center; gap:10px;
    margin-top:20px; padding-top:16px;
    border-top:1px solid rgba(248,113,113,.08);
  }
  .ul-footer-line { flex:1; height:1px; background:rgba(248,113,113,.06); }
  .ul-footer-text { font-size:10px; color:#3d1a1a; letter-spacing:.5px; text-transform:uppercase; font-weight:600; }
`;

function injectStyles() {
  if (document.getElementById('ul-styles')) return;
  const el = document.createElement('style');
  el.id = 'ul-styles'; el.textContent = CSS;
  document.head.appendChild(el);
}

// ─── Component ──────────────────────────────────────────────────
export default function UnifiedLoginPage() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [fieldErr, setFieldErr] = useState({ email: false, password: false });

  useEffect(() => {
    injectStyles();
    const stored = localStorage.getItem('user');
    if (stored) {
      try { redirectByRole(JSON.parse(stored).role, navigate); }
      catch { localStorage.clear(); }
    }
    return () => document.getElementById('ul-styles')?.remove();
  }, [navigate]);

  const validate = () => {
    const errs = { email: !email.includes('@'), password: password.length < 6 };
    setFieldErr(errs);
    if (errs.email)    { setError('Adresse email invalide.');                return false; }
    if (errs.password) { setError('Mot de passe trop court (min. 6 car.).'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      const { token, user } = res.data;

      const match = ROLE_REDIRECTS.find((r) => r.test(user?.role));
      if (!match) {
        setError(`Rôle non reconnu : "${user?.role}". Contactez l'administrateur.`);
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.removeItem('extractedData');
      navigate(match.path);
    } catch (err) {
      const status = err.response?.status;
      if (!err.response)       setError('Serveur inaccessible. Vérifiez que le backend est lancé.');
      else if (status === 401) { setError('Identifiants incorrects.'); setFieldErr({ email: true, password: true }); }
      else if (status === 403) setError("Compte désactivé. Contactez l'administrateur.");
      else setError(err.response?.data?.error || `Erreur serveur (${status}).`);
    } finally { setLoading(false); }
  };

  const onKey = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="ul-root">

      {/* Blobs décoratifs */}
      {[['15%','10%','#f87171'],['80%','80%','#ef4444'],['50%','5%','#dc2626']].map(([t,l,c],i) => (
        <div key={i} style={{ position:'absolute', top:t, left:l, width:280, height:280,
          borderRadius:'50%', background:c, opacity:.05, filter:'blur(70px)',
          pointerEvents:'none', animation:`ul-glow ${5+i}s ease-in-out infinite`,
          animationDelay:`${i*1.3}s` }} />
      ))}

      {/* Anneaux rotatifs */}
      {[480, 360].map((s, i) => (
        <div key={i} style={{ position:'absolute', width:s, height:s, borderRadius:'50%',
          border:'1px solid rgba(248,113,113,.05)',
          top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          animation:`ul-rotate ${35+i*10}s linear infinite`, pointerEvents:'none' }} />
      ))}

      <div className="ul-card">
        <div className="ul-scan" />

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:62, height:62,
            background:'linear-gradient(135deg,#5c0d0d,#991b1b)',
            borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:27, margin:'0 auto 16px',
            boxShadow:'0 0 0 2px rgba(248,113,113,.25), 0 8px 24px rgba(0,0,0,.5)',
            animation:'ul-pulse 3s ease-in-out infinite' }}>
            🔐
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800,
            color:'#ffe4e4', marginBottom:5, letterSpacing:'-.3px' }}>
            Portail ANCS
          </h1>
          <p style={{ fontSize:11, color:'#3d2a2a', letterSpacing:'.4px',
            textTransform:'uppercase', fontWeight:600 }}>
            Accès sécurisé · 2026
          </p>
        </div>

        {/* Bandeau info */}
        <div style={{ background:'rgba(248,113,113,.06)',
          border:'1px solid rgba(248,113,113,.12)',
          borderRadius:12, padding:'10px 14px', marginBottom:22,
          display:'flex', gap:9, alignItems:'flex-start' }}>
          <span style={{ fontSize:14, flexShrink:0 }}>🔒</span>
          <span style={{ fontSize:11, color:'#7a3a3a', lineHeight:1.6 }}>
            Accès réservé au personnel autorisé de l'ANCS. Toute tentative non autorisée est enregistrée.
          </span>
        </div>

        {/* Erreur */}
        {error && (
          <div className="ul-error">
            <span style={{ fontSize:16, flexShrink:0 }}>⚠️</span>
            <span style={{ fontSize:13, color:'#f87171', lineHeight:1.5 }}>{error}</span>
          </div>
        )}

        {/* Email */}
        <div>
          <label style={{ fontSize:11, color:'#5a2a2a', textTransform:'uppercase',
            letterSpacing:'.5px', fontWeight:600, display:'block', marginBottom:7 }}>
            Email
          </label>
          <div className="ul-input-wrap">
            <span className="ul-icon">✉️</span>
            <input className={`ul-input${fieldErr.email ? ' error' : ''}`}
              type="email" placeholder="votre@ancs.tn"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); setFieldErr(f => ({ ...f, email: false })); }}
              onKeyDown={onKey} disabled={loading} autoComplete="email" />
          </div>
        </div>

        {/* Mot de passe */}
        <div>
          <label style={{ fontSize:11, color:'#5a2a2a', textTransform:'uppercase',
            letterSpacing:'.5px', fontWeight:600, display:'block', marginBottom:7 }}>
            Mot de passe
          </label>
          <div className="ul-input-wrap">
            <span className="ul-icon">🔑</span>
            <input className={`ul-input${fieldErr.password ? ' error' : ''}`}
              type={showPwd ? 'text' : 'password'} placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); setFieldErr(f => ({ ...f, password: false })); }}
              onKeyDown={onKey} disabled={loading} autoComplete="current-password"
              style={{ paddingRight:42 }} />
            <button className="ul-eye" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
              {showPwd ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Bouton */}
        <button className="ul-submit" onClick={handleSubmit} disabled={loading} style={{ marginTop:6 }}>
          {loading
            ? <><span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.25)',
                borderTop:'2px solid white', borderRadius:'50%',
                animation:'ul-spin 1s linear infinite', flexShrink:0 }} />
                Authentification...</>
            : <>🔐 Se connecter</>}
        </button>

        <div className="ul-footer">
          <div className="ul-footer-line" />
          <span className="ul-footer-text">ANCS · Accès restreint © 2026</span>
          <div className="ul-footer-line" />
        </div>
      </div>
    </div>
  );
}