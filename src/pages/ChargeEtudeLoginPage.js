import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes ce-up    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ce-fadeIn{ from{opacity:0} to{opacity:1} }
  @keyframes ce-spin  { to{transform:rotate(360deg)} }
  @keyframes ce-rotate{ from{transform:rotate(0)} to{transform:rotate(360deg)} }
  @keyframes ce-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-7px)} 40%,80%{transform:translateX(7px)} }
  @keyframes ce-glow  { 0%,100%{opacity:.2} 50%{opacity:.55} }
  @keyframes ce-scan  { 0%{top:0;opacity:.55} 100%{top:100%;opacity:0} }
  @keyframes ce-pulse { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.08);opacity:1} }

  * { box-sizing:border-box; margin:0; padding:0; }

  .ce-root {
    font-family:'DM Sans',sans-serif;
    min-height:100vh; background:#0f1c2e;
    display:flex; align-items:center; justify-content:center;
    position:relative; overflow:hidden; animation:ce-fadeIn .4s ease;
  }
  .ce-root::before {
    content:''; position:absolute; inset:0;
    background-image:
      linear-gradient(rgba(139,92,246,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(139,92,246,.025) 1px, transparent 1px);
    background-size:40px 40px; pointer-events:none;
  }

  .ce-card {
    position:relative; z-index:10;
    background:rgba(255,255,255,.022);
    border:1px solid rgba(139,92,246,.15);
    border-radius:24px; padding:40px 36px;
    width:100%; max-width:400px;
    backdrop-filter:blur(14px);
    box-shadow:0 32px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(139,92,246,.08);
    animation:ce-up .55s cubic-bezier(.22,1,.36,1);
    overflow:hidden;
  }

  .ce-scan {
    position:absolute; left:0; right:0; height:2px;
    background:linear-gradient(90deg,transparent,rgba(139,92,246,.35),transparent);
    animation:ce-scan 3.5s linear infinite; pointer-events:none;
  }

  .ce-title {
    font-size:28px; font-weight:700; color:#fff; margin-bottom:8px;
    background:linear-gradient(135deg,#8b5cf6,#6366f1); -webkit-background-clip:text;
    -webkit-text-fill-color:transparent; background-clip:text;
  }

  .ce-subtitle { font-size:13px; color:#7c8aa6; margin-bottom:24px; }

  .ce-input-wrap { position:relative; margin-bottom:14px; }
  .ce-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); font-size:14px; pointer-events:none; color:#4c5a7d; }

  .ce-input {
    width:100%; padding:13px 16px 13px 40px;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07);
    border-radius:13px; color:#e2f0ff;
    font-size:14px; font-family:'DM Sans',sans-serif;
    outline:none; transition:border-color .25s, background .25s, box-shadow .25s;
  }
  .ce-input::placeholder { color:#2a3a52; }
  .ce-input:focus {
    border-color:rgba(139,92,246,.4);
    background:rgba(139,92,246,.04);
    box-shadow:0 0 0 3px rgba(139,92,246,.07);
  }
  .ce-input.error { border-color:rgba(139,92,246,.5); animation:ce-shake .4s ease; }

  .ce-eye {
    position:absolute; right:13px; top:50%; transform:translateY(-50%);
    background:none; border:none; cursor:pointer;
    font-size:14px; color:#2a3a52; transition:color .2s; padding:4px;
  }
  .ce-eye:hover { color:#8b5cf6; }

  .ce-submit {
    width:100%; padding:14px;
    background:linear-gradient(135deg,#8b5cf6,#6366f1);
    border:none; border-radius:13px; color:#fff;
    font-size:14px; font-weight:600; cursor:pointer;
    transition:all .25s; position:relative;
    overflow:hidden; margin-top:8px;
  }
  .ce-submit:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(139,92,246,.3); }
  .ce-submit:active { transform:translateY(0); }
  .ce-submit:disabled { opacity:.7; cursor:not-allowed; transform:none; }

  .ce-error {
    background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.3);
    border-radius:11px; padding:12px 14px;
    color:#fca5a5; font-size:13px; margin-bottom:16px;
    animation:ce-up .3s ease;
  }

  .ce-links { margin-top:18px; text-align:center; font-size:13px; }
  .ce-links a { color:#8b5cf6; text-decoration:none; transition:color .2s; }
  .ce-links a:hover { color:#a78bfa; }

  .ce-spinner {
    display:inline-block; width:16px; height:16px;
    border:2px solid rgba(255,255,255,.3); border-top-color:#fff;
    border-radius:50%; animation:ce-spin .7s linear infinite;
    vertical-align:middle; margin-right:8px;
  }
`;

// ✅ Matches all possible role formats from the backend
const isChargeEtude = (role) => {
  const r = String(role || '').toLowerCase().trim();
  return r === 'charge_etude' || r === 'charge d\'étude' || r === 'chargedetude' || r === 'charge etude';
};

export default function ChargeEtudeLoginPage() {
  // ✅ FIX 1: use "email" not "username" — matches what the backend expects
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (isChargeEtude(u.role)) navigate('/charge-etude/dashboard');
        else navigate('/');
      } catch { localStorage.clear(); }
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (!email.includes('@')) {
      setError('Adresse email invalide.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ✅ FIX 2: send { email, password } — same shape as the working admin login
      const res = await API.post('/auth/login', { email, password });

      // ✅ FIX 3: destructure correctly — token & user are separate fields in res.data
      const { token, user } = res.data;

      if (user?.role !== 'charge_etude') {
       setError("Accès refusé.");
       return;
    }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/charge-etude/dashboard');
    } catch (err) {
      const status = err.response?.status;
      if (!err.response)       setError('Serveur inaccessible. Vérifiez que le backend est lancé.');
      else if (status === 401) setError('Email ou mot de passe incorrect.');
      else if (status === 400) setError('Champs manquants ou invalides.');
      else                     setError(err.response?.data?.error || `Erreur serveur (${status}).`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) handleLogin();
  };

  return (
    <div className="ce-root">
      <style>{CSS}</style>
      <div className="ce-card">
        <div className="ce-scan"></div>
        <h1 className="ce-title">Charge d'Étude</h1>
        <p className="ce-subtitle">Analyse Technique des Audits</p>

        {error && <div className="ce-error">⚠️ {error}</div>}

        {/* ✅ FIX 1: field is now "email", not "username" */}
        <div className="ce-input-wrap">
          <span className="ce-icon">✉️</span>
          <input
            type="email"
            className="ce-input"
            placeholder="Email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoComplete="email"
          />
        </div>

        <div className="ce-input-wrap">
          <span className="ce-icon">🔒</span>
          <input
            type={showPassword ? 'text' : 'password'}
            className="ce-input"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoComplete="current-password"
            style={{ paddingRight: 42 }}
          />
          <button className="ce-eye" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        <button className="ce-submit" onClick={handleLogin} disabled={loading}>
          {loading ? <><span className="ce-spinner" />Connexion...</> : 'Connexion'}
        </button>

        <div className="ce-links">
          Retour à <a href="/">connexion client</a>
        </div>
      </div>
    </div>
  );
}