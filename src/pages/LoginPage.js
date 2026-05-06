import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes lp-up       { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lp-fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes lp-spin     { to{transform:rotate(360deg)} }
  @keyframes lp-rotate   { from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes lp-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes lp-shake    { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-7px)} 40%,80%{transform:translateX(7px)} }
  @keyframes lp-glow     { 0%,100%{opacity:.3} 50%{opacity:.8} }
  @keyframes lp-scan     { 0%{top:0;opacity:.6} 100%{top:100%;opacity:0} }

  * { box-sizing:border-box; margin:0; padding:0; }

  .lp-root {
    font-family:'DM Sans',sans-serif;
    min-height:100vh; background:#07111e;
    display:flex; align-items:center; justify-content:center;
    position:relative; overflow:hidden; animation:lp-fadeIn .4s ease;
  }
  .lp-root::before {
    content:''; position:absolute; inset:0;
    background-image:
      linear-gradient(rgba(99,210,190,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,210,190,.03) 1px, transparent 1px);
    background-size:40px 40px; pointer-events:none;
  }

  .lp-card {
    position:relative; z-index:10;
    background:rgba(255,255,255,.028);
    border:1px solid rgba(255,255,255,.07);
    border-radius:24px; padding:40px 36px;
    width:100%; max-width:420px;
    backdrop-filter:blur(12px);
    box-shadow:0 32px 80px rgba(0,0,0,.6);
    animation:lp-up .55s cubic-bezier(.22,1,.36,1);
    overflow:hidden;
  }

  .lp-scan {
    position:absolute; left:0; right:0; height:2px;
    background:linear-gradient(90deg,transparent,rgba(99,210,190,.4),transparent);
    animation:lp-scan 3s linear infinite; pointer-events:none;
  }

  .lp-dot {
    position:absolute; border-radius:50%;
    background:rgba(99,210,190,.3); animation:lp-float ease-in-out infinite;
    pointer-events:none;
  }

  .lp-input-wrap { position:relative; }
  .lp-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); font-size:14px; pointer-events:none; }

  .lp-input {
    width:100%; padding:13px 16px 13px 40px;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
    border-radius:13px; color:#e2f0ff;
    font-size:14px; font-family:'DM Sans',sans-serif;
    outline:none; transition:border-color .25s, background .25s, box-shadow .25s;
  }
  .lp-input::placeholder { color:#2a4a62; }
  .lp-input:focus {
    border-color:rgba(99,210,190,.4);
    background:rgba(99,210,190,.04);
    box-shadow:0 0 0 3px rgba(99,210,190,.07);
  }
  .lp-input.error { border-color:rgba(248,113,113,.4); background:rgba(248,113,113,.04); animation:lp-shake .4s ease; }

  .lp-eye {
    position:absolute; right:13px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer;
    font-size:14px; color:#2a4a62; transition:color .2s; padding:4px;
  }
  .lp-eye:hover { color:#63d2be; }

  .lp-submit {
    width:100%; padding:14px;
    background:linear-gradient(135deg,#63d2be,#2eb8a0);
    color:#071520; border:none; border-radius:13px;
    font-size:15px; font-family:'DM Sans',sans-serif; font-weight:700;
    cursor:pointer; letter-spacing:.3px;
    display:flex; align-items:center; justify-content:center; gap:9px;
    transition:filter .2s, transform .15s, box-shadow .2s;
  }
  .lp-submit:hover:not(:disabled) {
    filter:brightness(1.1); transform:translateY(-2px);
    box-shadow:0 12px 32px rgba(99,210,190,.22);
  }
  .lp-submit:disabled { background:rgba(255,255,255,.07); color:#2a4a62; cursor:not-allowed; transform:none; }

  .lp-error {
    display:flex; align-items:flex-start; gap:9px;
    background:rgba(248,113,113,.07); border:1px solid rgba(248,113,113,.2);
    border-radius:12px; padding:12px 14px; margin-bottom:18px;
    animation:lp-shake .4s ease;
  }

  .lp-link { color:#63d2be; cursor:pointer; font-weight:600; transition:color .2s; }
  .lp-link:hover { color:#4ade80; }
`;

function injectLpStyles() {
  if (document.getElementById('lp-styles')) return;
  const el = document.createElement('style');
  el.id = 'lp-styles'; el.textContent = CSS;
  document.head.appendChild(el);
}// ✅ Role checking functions
const isAdminUser = (role) => String(role || '').toLowerCase().includes('administrateur');
const isChargeEtude = (role) => {
  const r = String(role || '').toLowerCase().trim();
  return r.includes('charge d\'étude') || r.includes('charge_etude') || 
         r.includes('charge-etude') || r.includes('technical_review');
};
const isResponsable = (role) => {
  const r = String(role || '').toLowerCase().trim();
  return r.includes('responsable') || r.includes('suivi') || 
         r.includes('responsable de suivi');
};

export default function LoginPage() {
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [fieldErr, setFieldErr] = useState({ email:false, password:false });

  const isAdminUser = (role) => String(role || '').toLowerCase().includes('administrateur');
  const isChargeEtude = (role) => {
    const r = String(role || '').toLowerCase().trim();
    return r.includes('charge d\'étude') || r.includes('charge_etude') || r.includes('charge-etude') || r.includes('technical_review');
  };
  const isResponsable = (role) => {
    const r = String(role || '').toLowerCase().trim();
    return r.includes('responsable') || r.includes('suivi') || r.includes('responsable de suivi');
  };

  useEffect(() => {
    injectLpStyles();
    // Redirection si déjà connecté
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const u = JSON.parse(user);
        if (isAdminUser(u.role)) {
          navigate('/admin/dashboard');
        } else if (isChargeEtude(u.role)) {
          navigate('/charge-etude/dashboard');
        } else if (isResponsable(u.role)) {
          navigate('/responsable/dashboard');
        } else {
          navigate('/client/dashboard');
        }
      } catch { localStorage.clear(); }
    }
    return () => document.getElementById('lp-styles')?.remove();
  }, [navigate]);

  const validate = () => {
    const errs = { email: !email.includes('@'), password: password.length < 6 };
    setFieldErr(errs);
    if (errs.email)    { setError('Adresse email invalide.');               return false; }
    if (errs.password) { setError('Mot de passe trop court (min. 6 car.).'); return false; }
    return true;
  };

  const handleSubmit = async () => {
  setError('');
  if (!validate()) return;
  setLoading(true);
  try {
    const res = await API.post('/auth/login', { email, password, userType: 'client' });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user',  JSON.stringify(user));
    localStorage.removeItem('extractedData');
    
    // ✅ FIX: Route based on actual user role
    if (isAdminUser(user.role)) {
      navigate('/admin/dashboard');
    } else if (isChargeEtude(user.role)) {
      navigate('/charge-etude/dashboard');
    } else if (isResponsable(user.role)) {
      navigate('/responsable/dashboard');
    } else {
      navigate('/client/dashboard');
    }
  } catch (err) {
    // ... error handling
  } finally { setLoading(false); }
};

  const onKey = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="lp-root">
      {/* Floating dots */}
      {[[3,'8%','12%',3.2],[3,'88%','8%',4.5],[4,'5%','78%',5],[3,'92%','72%',3.8],[3,'48%','92%',4.2]].map(([s,t,l,d],i)=>(
        <div key={i} className="lp-dot" style={{ width:s, height:s, top:t, left:l, animationDuration:`${d}s`, animationDelay:`${i*.4}s` }} />
      ))}
      {/* Glow orbs */}
      {[['10%','20%','#63d2be'],['85%','70%','#818cf8'],['50%','5%','#38bdf8']].map(([t,l,c],i)=>(
        <div key={i} style={{ position:'absolute', top:t, left:l, width:300, height:300, borderRadius:'50%', background:c, opacity:.04, filter:'blur(60px)', pointerEvents:'none', animation:`lp-glow ${4+i}s ease-in-out infinite`, animationDelay:`${i*1.2}s` }} />
      ))}
      {/* Rotating rings */}
      {[500,380].map((s,i)=>(
        <div key={i} style={{ position:'absolute', width:s, height:s, borderRadius:'50%', border:'1px solid rgba(99,210,190,.04)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', animation:`lp-rotate ${30+i*10}s linear infinite`, pointerEvents:'none' }} />
      ))}

      <div className="lp-card">
        <div className="lp-scan" />

        {/* Brand */}
        <div style={{ textAlign:'center', marginBottom:30 }}>
          <div style={{ width:62, height:62, background:'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:27, margin:'0 auto 16px', boxShadow:'0 0 0 2px rgba(99,210,190,.25), 0 8px 24px rgba(0,0,0,.4)' }}>
            🏛️
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:23, fontWeight:800, color:'#e4f2ff', marginBottom:5, letterSpacing:'-.3px' }}>
            Portail ANCS
          </h1>
          <p style={{ fontSize:12, color:'#3d607a', letterSpacing:'.3px' }}>
            Audit de Sécurité des Systèmes d'Information
          </p>
        </div>

        {/* Espace entreprise badge */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'rgba(99,210,190,.07)', border:'1px solid rgba(99,210,190,.15)', borderRadius:12, padding:'10px 18px', marginBottom:24 }}>
          <span style={{ fontSize:16 }}>🏢</span>
          <span style={{ fontSize:13, color:'#63d2be', fontWeight:700, letterSpacing:'.3px' }}>Espace Entreprise</span>
        </div>

        {/* Error */}
        {error && (
          <div className="lp-error">
            <span style={{ fontSize:16, flexShrink:0 }}>⚠️</span>
            <span style={{ fontSize:13, color:'#f87171', lineHeight:1.5 }}>{error}</span>
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600, display:'block', marginBottom:7 }}>Email professionnel</label>
          <div className="lp-input-wrap">
            <span className="lp-icon">✉️</span>
            <input className={`lp-input${fieldErr.email?' error':''}`} type="email" placeholder="contact@entreprise.tn"
              value={email} onChange={e=>{ setEmail(e.target.value); setError(''); setFieldErr(f=>({...f,email:false})); }}
              onKeyDown={onKey} disabled={loading} autoComplete="email" />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom:24 }}>
          <label style={{ fontSize:11, color:'#3d607a', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600, display:'block', marginBottom:7 }}>Mot de passe</label>
          <div className="lp-input-wrap">
            <span className="lp-icon">🔑</span>
            <input className={`lp-input${fieldErr.password?' error':''}`} type={showPwd?'text':'password'} placeholder="••••••••"
              value={password} onChange={e=>{ setPassword(e.target.value); setError(''); setFieldErr(f=>({...f,password:false})); }}
              onKeyDown={onKey} disabled={loading} autoComplete="current-password" style={{ paddingRight:42 }} />
            <button className="lp-eye" onClick={()=>setShowPwd(v=>!v)} tabIndex={-1}>{showPwd?'🙈':'👁️'}</button>
          </div>
        </div>

        {/* Submit */}
        <button className="lp-submit" onClick={handleSubmit} disabled={loading}>
          {loading
            ? <><span style={{ width:16, height:16, border:'2px solid rgba(7,17,30,.3)', borderTop:'2px solid #07111e', borderRadius:'50%', animation:'lp-spin 1s linear infinite', flexShrink:0 }} />Connexion...</>
            : <>🔐 Se connecter</>}
        </button>

        {/* Register - Client only */}
        <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'#3d607a' }}>
          Pas encore de compte ?{' '}
          <span className="lp-link" onClick={() => navigate('/register')}>Inscrivez-vous</span>
        </p>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:22, paddingTop:16, borderTop:'1px solid rgba(255,255,255,.05)' }}>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,.04)' }} />
          <span style={{ fontSize:10, color:'#1e3a52', letterSpacing:'.5px', textTransform:'uppercase', fontWeight:600 }}>ANCS Platform © 2026</span>
          <div style={{ flex:1, height:1, background:'rgba(255,255,255,.04)' }} />
        </div>
      </div>
    </div>
  );
}