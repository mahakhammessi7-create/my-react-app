import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

/* ══════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes rp-up    { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes rp-spin  { to{transform:rotate(360deg)} }
  @keyframes rp-glow  { 0%,100%{opacity:.25} 50%{opacity:.7} }
  @keyframes rp-scan  { 0%{top:0;opacity:.6} 100%{top:100%;opacity:0} }
  @keyframes rp-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
  @keyframes rp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }

  * { box-sizing:border-box; margin:0; padding:0; }

  .rp-root {
    font-family:'DM Sans',sans-serif;
    min-height:100vh; background:#07111e;
    display:flex; align-items:flex-start; justify-content:center;
    padding:32px 20px; position:relative; overflow-x:hidden;
  }
  .rp-root::before {
    content:'';
    position:fixed; inset:0;
    background-image:
      linear-gradient(rgba(99,210,190,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,210,190,.025) 1px, transparent 1px);
    background-size:40px 40px; pointer-events:none;
  }

  .rp-card {
    position:relative; z-index:10;
    background:rgba(255,255,255,.028);
    border:1px solid rgba(255,255,255,.07);
    border-radius:24px; padding:36px;
    width:100%; max-width:480px;
    backdrop-filter:blur(12px);
    box-shadow:0 32px 80px rgba(0,0,0,.55);
    animation:rp-up .55s cubic-bezier(.22,1,.36,1);
  }

  .rp-scan {
    position:absolute; left:0; right:0; height:2px;
    background:linear-gradient(90deg,transparent,rgba(99,210,190,.35),transparent);
    animation:rp-scan 3.5s linear infinite; pointer-events:none;
  }

  .rp-label {
    display:block; font-size:11px; font-weight:600;
    color:#3d607a; text-transform:uppercase; letter-spacing:.5px; margin-bottom:7px;
  }

  .rp-input-wrap { position:relative; margin-bottom:14px; }

  .rp-input {
    width:100%; padding:12px 16px 12px 40px;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
    border-radius:12px; color:#e2f0ff;
    font-size:14px; font-family:'DM Sans',sans-serif;
    outline:none; transition:border-color .25s, background .25s, box-shadow .25s;
  }
  .rp-input::placeholder { color:#2a4a62; }
  .rp-input:focus {
    border-color:rgba(99,210,190,.4);
    background:rgba(99,210,190,.04);
    box-shadow:0 0 0 3px rgba(99,210,190,.07);
  }
  .rp-input.err {
    border-color:rgba(248,113,113,.4);
    background:rgba(248,113,113,.04);
  }
  .rp-icon {
    position:absolute; left:13px; top:50%;
    transform:translateY(-50%); font-size:14px; pointer-events:none;
  }
  .rp-eye {
    position:absolute; right:13px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer;
    font-size:14px; color:#2a4a62; transition:color .2s; padding:4px;
  }
  .rp-eye:hover { color:#63d2be; }

  .rp-submit {
    width:100%; padding:14px; margin-top:6px;
    background:linear-gradient(135deg,#63d2be,#2eb8a0);
    color:#071520; border:none; border-radius:12px;
    font-size:15px; font-family:'DM Sans',sans-serif; font-weight:700;
    cursor:pointer; letter-spacing:.3px;
    display:flex; align-items:center; justify-content:center; gap:9px;
    transition:filter .2s, transform .15s, box-shadow .2s;
  }
  .rp-submit:hover:not(:disabled) {
    filter:brightness(1.1); transform:translateY(-2px);
    box-shadow:0 12px 32px rgba(99,210,190,.22);
  }
  .rp-submit:disabled {
    background:rgba(255,255,255,.07); color:#2a4a62; cursor:not-allowed; transform:none;
  }

  .rp-error {
    display:flex; align-items:flex-start; gap:9px;
    background:rgba(248,113,113,.07); border:1px solid rgba(248,113,113,.2);
    border-radius:12px; padding:12px 14px; margin-bottom:16px;
    animation:rp-shake .4s ease;
  }

  .rp-success {
    display:flex; align-items:center; gap:12px;
    background:rgba(74,222,128,.07); border:1px solid rgba(74,222,128,.2);
    border-radius:12px; padding:14px 18px; margin-bottom:16px;
  }

  .rp-select {
    width:100%; padding:12px 16px 12px 40px;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
    border-radius:12px; color:#8ab0c8;
    font-size:14px; font-family:'DM Sans',sans-serif;
    outline:none; cursor:pointer; transition:border-color .2s;
    appearance:none;
  }
  .rp-select:focus { border-color:rgba(99,210,190,.4); }
  .rp-select option { background:#0c1e34; color:#e2f0ff; }

  .rp-link {
    color:#63d2be; cursor:pointer; font-weight:600; transition:color .2s;
  }
  .rp-link:hover { color:#4ade80; }

  .rp-dot {
    position:fixed; border-radius:50%;
    background:rgba(99,210,190,.28); animation:rp-float ease-in-out infinite;
    pointer-events:none; z-index:1;
  }
`;

function injectRpStyles() {
  if (document.getElementById('rp-styles')) return;
  const el = document.createElement('style');
  el.id = 'rp-styles'; el.textContent = CSS;
  document.head.appendChild(el);
}

const SECTORS = ['Finance / Banque','Santé','Administration publique','Énergie','Industrie','Télécoms','Commerce','Éducation','Autre'];

/* ══════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════ */
export default function RegisterPage() {
  const navigate = useNavigate();

  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [showPwd,      setShowPwd]      = useState(false);

  // Client fields only
  const [username,     setUsername]     = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [companyName,  setCompanyName]  = useState('');
  const [sector,       setSector]       = useState('');

  useEffect(() => {
    injectRpStyles();
    return () => document.getElementById('rp-styles')?.remove();
  }, []);

  const reset = () => { setError(''); setSuccess(''); };

  /* ── Client submit ── */
  const handleRegister = async () => {
    reset();
    if (!username || !email || !password || !companyName || !sector) {
      return setError('Veuillez remplir tous les champs obligatoires.');
    }
    if (!email.includes('@')) return setError('Adresse email invalide.');
    if (password.length < 6)  return setError('Le mot de passe doit contenir au moins 6 caractères.');

    setLoading(true);
    try {
      await API.post('/auth/register', { username, email, password, company_name: companyName, sector });
      setSuccess("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
      setTimeout(() => navigate('/'), 2500);
    } catch (err) {
      const msg = err.response?.data?.error;
      if (!err.response) setError("Impossible de joindre le serveur. Vérifiez que le backend est démarré.");
      else setError(msg || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === 'Enter') handleRegister(); };

  /* ══════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════ */
  return (
    <div className="rp-root">
      {/* Floating dots */}
      {[[3,'8%','15%',3.5],[3,'90%','12%',4.2],[4,'6%','80%',5],[3,'91%','75%',3.8],[3,'50%','95%',4.5]].map(([s,t,l,d],i)=>(
        <div key={i} className="rp-dot" style={{ width:s, height:s, top:t, left:l, animationDuration:`${d}s`, animationDelay:`${i*.4}s` }} />
      ))}
      {/* Glow orbs */}
      {[['10%','20%','#63d2be'],['85%','70%','#818cf8']].map(([t,l,c],i)=>(
        <div key={i} style={{ position:'fixed', top:t, left:l, width:300, height:300, borderRadius:'50%', background:c, opacity:.04, filter:'blur(60px)', pointerEvents:'none', animation:`rp-glow ${4+i}s ease-in-out infinite` }} />
      ))}

      <div className="rp-card">
        <div className="rp-scan" />

        {/* Brand */}
        <div style={{ textAlign:'center', marginBottom:26 }}>
          <div style={{ width:56, height:56, background:'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 14px', boxShadow:'0 0 0 2px rgba(99,210,190,.25), 0 8px 24px rgba(0,0,0,.4)' }}>
            🏛️
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:'#e4f2ff', marginBottom:4, letterSpacing:'-.2px' }}>
            Créer un compte entreprise
          </h1>
          <p style={{ fontSize:12, color:'#3d607a' }}>Plateforme ANCS · Audit des Systèmes d'Information</p>
        </div>

        {/* Success */}
        {success && (
          <div className="rp-success">
            <span style={{ fontSize:22 }}>✅</span>
            <span style={{ fontSize:13, color:'#4ade80', fontWeight:500 }}>{success}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rp-error">
            <span style={{ fontSize:16, flexShrink:0 }}>⚠️</span>
            <span style={{ fontSize:13, color:'#f87171', lineHeight:1.5 }}>{error}</span>
          </div>
        )}

        {/* ══ CLIENT FORM ══ */}
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:2 }}>
            {/* Username */}
            <div>
              <label className="rp-label">Nom d'utilisateur *</label>
              <div className="rp-input-wrap" style={{ marginBottom:0 }}>
                <span className="rp-icon">👤</span>
                <input className="rp-input" placeholder="votre_nom" value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={onKey} disabled={loading} />
              </div>
            </div>
            {/* Email */}
            <div>
              <label className="rp-label">Email professionnel *</label>
              <div className="rp-input-wrap" style={{ marginBottom:0 }}>
                <span className="rp-icon">✉️</span>
                <input className="rp-input" type="email" placeholder="contact@entreprise.tn" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={onKey} disabled={loading} />
              </div>
            </div>
          </div>

          {/* Company */}
          <div style={{ marginTop:12 }}>
            <label className="rp-label">Nom de l'entreprise *</label>
            <div className="rp-input-wrap">
              <span className="rp-icon">🏢</span>
              <input className="rp-input" placeholder="Société Nationale de..." value={companyName} onChange={e=>setCompanyName(e.target.value)} onKeyDown={onKey} disabled={loading} />
            </div>
          </div>

          {/* Sector */}
          <div>
            <label className="rp-label">Secteur d'activité *</label>
            <div className="rp-input-wrap">
              <span className="rp-icon">🏭</span>
              <select className="rp-select" value={sector} onChange={e=>setSector(e.target.value)} disabled={loading}>
                <option value="">Sélectionnez un secteur</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="rp-label">Mot de passe *</label>
            <div className="rp-input-wrap">
              <span className="rp-icon">🔑</span>
              <input className="rp-input" type={showPwd?'text':'password'} placeholder="Minimum 6 caractères" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={onKey} disabled={loading} style={{ paddingRight:40 }} />
              <button className="rp-eye" onClick={()=>setShowPwd(v=>!v)} tabIndex={-1}>{showPwd?'🙈':'👁️'}</button>
            </div>
          </div>

          <button className="rp-submit" onClick={handleRegister} disabled={loading}>
            {loading
              ? <><span style={{ width:16, height:16, border:'2px solid rgba(7,17,30,.2)', borderTop:'2px solid #07111e', borderRadius:'50%', animation:'rp-spin 1s linear infinite', flexShrink:0 }} />Création en cours...</>
              : <>🏢 Créer le compte entreprise</>}
          </button>
        </div>

        {/* Back to login */}
        <p style={{ textAlign:'center', marginTop:22, fontSize:13, color:'#3d607a' }}>
          Déjà un compte ?{' '}
          <span className="rp-link" onClick={() => navigate('/')}>Se connecter</span>
        </p>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:20, paddingTop:18, borderTop:'1px solid rgba(255,255,255,.05)' }}>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,.04)' }} />
          <span style={{ fontSize:10, color:'#1e3a52', letterSpacing:'.5px', textTransform:'uppercase', fontWeight:600 }}>ANCS Platform © 2026</span>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,.04)' }} />
        </div>
      </div>
    </div>
  );
}