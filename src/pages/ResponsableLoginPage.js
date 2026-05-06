import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  @keyframes rs-fadeIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes rs-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-15px)} }
  @keyframes rs-pulse { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.5;transform:scale(1.1)} }
  @keyframes rs-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
  @keyframes rs-gradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes rs-spin { to{transform:rotate(360deg)} }

  * { box-sizing:border-box; margin:0; padding:0; }

  .rs-root {
    font-family:'DM Sans',sans-serif;
    min-height:100vh;
    display:flex;
    align-items:center;
    justify-content:center;
    background:linear-gradient(135deg,#07111e 0%,#0a1f2e 50%,#07111e 100%);
    position:relative;
    overflow:hidden;
    animation:rs-fadeIn .6s ease;
  }

  /* Animated background blobs */
  .rs-root::before, .rs-root::after {
    content:'';
    position:absolute;
    border-radius:50%;
    filter:blur(70px);
    opacity:.35;
    animation:rs-float 10s ease-in-out infinite;
    pointer-events:none;
  }
  .rs-root::before {
    width:380px; height:380px;
    background:radial-gradient(circle, rgba(16,185,129,.35) 0%, transparent 70%);
    top:-80px; left:-60px;
    animation-delay:0s;
  }
  .rs-root::after {
    width:320px; height:320px;
    background:radial-gradient(circle, rgba(15,118,110,.3) 0%, transparent 70%);
    bottom:-60px; right:-40px;
    animation-delay:3s;
  }

  /* Grid overlay */
  .rs-grid {
    position:absolute;
    inset:0;
    background-image:
      linear-gradient(rgba(16,185,129,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(16,185,129,.03) 1px, transparent 1px);
    background-size:45px 45px;
    pointer-events:none;
    opacity:.6;
  }

  .rs-card {
    position:relative;
    z-index:10;
    width:100%;
    max-width:440px;
    padding:48px 40px;
    border-radius:28px;
    background:rgba(7,17,30,.85);
    border:1px solid rgba(16,185,129,.2);
    backdrop-filter:blur(20px) saturate(180%);
    box-shadow:
      0 25px 50px -12px rgba(0,0,0,.5),
      0 0 0 1px rgba(16,185,129,.1),
      inset 0 1px 0 rgba(255,255,255,.05);
    animation:rs-fadeIn .7s cubic-bezier(.16,1,.3,1);
    overflow:hidden;
  }

  /* Animated border glow */
  .rs-card::before {
    content:'';
    position:absolute;
    inset:-2px;
    background:linear-gradient(45deg,transparent,rgba(16,185,129,.25),transparent);
    border-radius:30px;
    opacity:0;
    transition:opacity .3s;
    z-index:-1;
    animation:rs-pulse 4s ease-in-out infinite;
  }
  .rs-card:hover::before { opacity:1; }

  .rs-header {
    text-align:center;
    margin-bottom:32px;
  }

  .rs-icon-badge {
    width:68px;
    height:68px;
    margin:0 auto 20px;
    background:linear-gradient(135deg,rgba(16,185,129,.15),rgba(15,118,110,.15));
    border-radius:20px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:30px;
    border:1px solid rgba(16,185,129,.3);
    box-shadow:0 8px 32px rgba(16,185,129,.2);
    animation:rs-fadeIn .6s ease .15s both;
  }

  .rs-title {
    font-family:'Syne',sans-serif;
    font-size:30px;
    font-weight:800;
    color:#d8f8ef;
    margin-bottom:6px;
    background:linear-gradient(135deg,#d8f8ef 0%,#6ee7b7 50%,#10b981 100%);
    -webkit-background-clip:text;
    -webkit-text-fill-color:transparent;
    background-clip:text;
    animation:rs-fadeIn .6s ease .25s both;
    letter-spacing:-.5px;
  }

  .rs-subtitle {
    font-size:14px;
    color:#7ea894;
    font-weight:400;
    line-height:1.5;
    animation:rs-fadeIn .6s ease .35s both;
  }

  .rs-form { animation:rs-fadeIn .6s ease .45s both; }

  .rs-input-group {
    position:relative;
    margin-bottom:20px;
  }

  .rs-label {
    position:absolute;
    left:44px;
    top:50%;
    transform:translateY(-50%);
    font-size:14px;
    color:#5a7f6d;
    pointer-events:none;
    transition:all .3s cubic-bezier(.4,0,.2,1);
    padding:0 4px;
    background:transparent;
  }

  .rs-input {
    width:100%;
    padding:16px 16px 16px 48px;
    background:rgba(15,31,46,.6);
    border:1.5px solid rgba(16,185,129,.15);
    border-radius:14px;
    color:#e7fffa;
    font-size:15px;
    font-family:'DM Sans',sans-serif;
    outline:none;
    transition:all .3s cubic-bezier(.4,0,.2,1);
  }

  .rs-input::placeholder { color:transparent; }

  .rs-input:focus {
    border-color:rgba(16,185,129,.5);
    background:rgba(15,31,46,.85);
    box-shadow:
      0 0 0 4px rgba(16,185,129,.1),
      0 4px 20px rgba(16,185,129,.15);
  }

  .rs-input:focus + .rs-label,
  .rs-input:not(:placeholder-shown) + .rs-label {
    top:0;
    font-size:11px;
    color:#10b981;
    background:linear-gradient(135deg,#07111e,#0a1f2e);
    font-weight:600;
  }

  .rs-input.error {
    border-color:rgba(248,113,113,.5);
    animation:rs-shake .5s ease;
    background:rgba(248,113,113,.05);
  }

  .rs-icon {
    position:absolute;
    left:16px;
    top:50%;
    transform:translateY(-50%);
    font-size:18px;
    color:#5a7f6d;
    transition:all .3s;
    pointer-events:none;
  }

  .rs-input:focus ~ .rs-icon {
    color:#10b981;
    transform:translateY(-50%) scale(1.1);
  }

  .rs-eye {
    position:absolute;
    right:16px;
    top:50%;
    transform:translateY(-50%);
    background:none;
    border:none;
    cursor:pointer;
    font-size:18px;
    color:#5a7f6d;
    transition:all .2s;
    padding:4px;
    border-radius:8px;
  }

  .rs-eye:hover {
    color:#10b981;
    background:rgba(16,185,129,.1);
  }

  .rs-btn {
    width:100%;
    padding:16px;
    background:linear-gradient(135deg,#0f766e 0%,#10b981 50%,#0f766e 100%);
    background-size:200% 200%;
    border:none;
    border-radius:14px;
    color:#07111e;
    font-size:15px;
    font-weight:700;
    cursor:pointer;
    transition:all .3s cubic-bezier(.4,0,.2,1);
    position:relative;
    overflow:hidden;
    margin-top:8px;
    font-family:'DM Sans',sans-serif;
    box-shadow:
      0 4px 20px rgba(16,185,129,.25),
      0 0 0 0 rgba(16,185,129,.3);
    animation:rs-gradient 3s ease infinite;
  }

  .rs-btn::before {
    content:'';
    position:absolute;
    top:0;
    left:-100%;
    width:100%;
    height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);
    transition:left .5s;
  }

  .rs-btn:hover:not(:disabled) {
    transform:translateY(-2px);
    box-shadow:
      0 8px 30px rgba(16,185,129,.35),
      0 0 30px rgba(16,185,129,.25);
  }

  .rs-btn:hover::before { left:100%; }

  .rs-btn:active:not(:disabled) { transform:translateY(0); }

  .rs-btn:disabled {
    opacity:.7;
    cursor:not-allowed;
    transform:none;
    animation:none;
  }

  .rs-error {
    background:linear-gradient(135deg,rgba(248,113,113,.1),rgba(248,113,113,.05));
    border:1px solid rgba(248,113,113,.3);
    border-radius:12px;
    padding:14px 16px;
    color:#ffb3b3;
    font-size:13px;
    margin-bottom:20px;
    animation:rs-fadeIn .3s ease;
    display:flex;
    align-items:center;
    gap:8px;
    backdrop-filter:blur(10px);
  }

  .rs-links {
    margin-top:24px;
    text-align:center;
    font-size:14px;
    color:#7ea894;
    animation:rs-fadeIn .6s ease .55s both;
  }

  .rs-links a {
    color:#10b981;
    text-decoration:none;
    font-weight:700;
    transition:all .2s;
    position:relative;
  }

  .rs-links a::after {
    content:'';
    position:absolute;
    bottom:-2px;
    left:0;
    width:0;
    height:2px;
    background:linear-gradient(90deg,#10b981,#6ee7b7);
    transition:width .3s;
  }

  .rs-links a:hover { color:#6ee7b7; }
  .rs-links a:hover::after { width:100%; }

  .rs-spinner {
    display:inline-block;
    width:18px;
    height:18px;
    border:2.5px solid rgba(7,17,30,.3);
    border-top-color:#07111e;
    border-radius:50%;
    animation:rs-spin .8s linear infinite;
    vertical-align:middle;
    margin-right:10px;
  }

  /* Responsive */
  @media (max-width: 480px) {
    .rs-card {
      padding:40px 24px;
      margin:20px;
    }
    .rs-title { font-size:26px; }
    .rs-icon-badge { width:60px; height:60px; font-size:26px; }
  }

  /* Scrollbar for any scrollable content */
  ::-webkit-scrollbar { width:6px; }
  ::-webkit-scrollbar-track { background:rgba(7,17,30,.5); border-radius:3px; }
  ::-webkit-scrollbar-thumb { background:rgba(16,185,129,.3); border-radius:3px; }
  ::-webkit-scrollbar-thumb:hover { background:rgba(16,185,129,.5); }
`;

const isResponsable = (role) => {
  const r = String(role || '').toLowerCase().trim();
  return r.includes('responsable') || r.includes('suivi') || r.includes('responsable de suivi');
};

export default function ResponsableLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) return;
    try {
      const u = JSON.parse(user);
      if (isResponsable(u.role)) navigate('/responsable/dashboard');
    } catch { localStorage.clear(); }
  }, [navigate]);

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !loading) handleSubmit(); };

  const handleSubmit = async () => {
    setError('');
    if (!email.includes('@')) { setError('Adresse email invalide.'); return; }
    if (password.length < 6) { setError('Mot de passe trop court (6 caractères minimum).'); return; }
    setLoading(true);

    try {
      const res = await API.post('/auth/login', { email, password });
      const { token, user } = res.data;

      if (!isResponsable(user?.role)) {
        setError("Accès réservé au Responsable de suivi.");
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/responsable/dashboard');
    } catch (err) {
      const status = err.response?.status;
      if (!err.response) setError('Serveur inaccessible. Vérifiez que le backend est lancé.');
      else if (status === 401) setError('Email ou mot de passe incorrect.');
      else setError(err.response?.data?.error || `Erreur serveur (${status}).`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rs-root">
      <style>{CSS}</style>
      <div className="rs-grid"></div>
      <div className="rs-card">
        <div className="rs-header">
          <div className="rs-icon-badge">📋</div>
          <h1 className="rs-title">Responsable de suivi</h1>
          <p className="rs-subtitle">Gestion, affectation et validation des rapports et indicateurs.</p>
        </div>

        {error && <div className="rs-error">⚠️ {error}</div>}

        <div className="rs-form">
          <div className="rs-input-group">
            <input
              className={`rs-input${error && !email.includes('@') ? ' error' : ''}`}
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoComplete="email"
            />
            <span className="rs-icon">✉️</span>
            <label className="rs-label">Adresse email</label>
          </div>

          <div className="rs-input-group">
            <input
              className={`rs-input${error && password.length < 6 ? ' error' : ''}`}
              type={showPwd ? 'text' : 'password'}
              placeholder=" "
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoComplete="current-password"
              style={{ paddingRight: 48 }}
            />
            <span className="rs-icon">🔒</span>
            <label className="rs-label">Mot de passe</label>
            <button 
              type="button"
              className="rs-eye" 
              onClick={() => setShowPwd((v) => !v)}
              tabIndex={-1}
            >
              {showPwd ? '🙈' : '👁️'}
            </button>
          </div>

          <button 
            className="rs-btn" 
            onClick={handleSubmit} 
            disabled={loading}
            type="button"
          >
            {loading ? (
              <><span className="rs-spinner" />Connexion...</>
            ) : (
              'Se connecter'
            )}
          </button>
        </div>

       
      </div>
    </div>
  );
}