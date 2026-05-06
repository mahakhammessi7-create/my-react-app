import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

/* ─────────────────────────────────────────────
   Role guard
───────────────────────────────────────────── */
const isDecideur = (role) => {
  const r = String(role || '').toLowerCase().trim();
  return r.includes('decideur') || r.includes('décideur');
};

/* ─────────────────────────────────────────────
   CSS — Enhanced with premium effects
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  @keyframes d-fadeIn { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
  @keyframes d-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
  @keyframes d-pulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.7;transform:scale(1.05)} }
  @keyframes d-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
  @keyframes d-scan { 0%{top:-100%;opacity:0} 10%{opacity:.6} 90%{opacity:.6} 100%{top:100%;opacity:0} }
  @keyframes d-gradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes d-spin { to{transform:rotate(360deg)} }
  @keyframes d-glow { 0%,100%{box-shadow:0 0 20px rgba(59,130,246,.3)} 50%{box-shadow:0 0 40px rgba(59,130,246,.6)} }

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  .d-root {
    font-family:'DM Sans',sans-serif;
    min-height:100vh;
    background:linear-gradient(135deg,#0a1628 0%,#0f213a 50%,#0a1628 100%);
    display:flex;
    align-items:center;
    justify-content:center;
    position:relative;
    overflow:hidden;
    animation:d-fadeIn .7s cubic-bezier(.16,1,.3,1);
  }

  /* Animated ambient blobs */
  .d-root::before, .d-root::after {
    content:'';
    position:absolute;
    border-radius:50%;
    filter:blur(80px);
    opacity:.35;
    animation:d-float 12s ease-in-out infinite;
    pointer-events:none;
    z-index:1;
  }
  .d-root::before {
    width:450px; height:450px;
    background:radial-gradient(circle, rgba(59,130,246,.4) 0%, transparent 70%);
    top:-120px; left:-80px;
    animation-delay:0s;
  }
  .d-root::after {
    width:380px; height:380px;
    background:radial-gradient(circle, rgba(99,102,241,.35) 0%, transparent 70%);
    bottom:-100px; right:-60px;
    animation-delay:4s;
  }

  /* Grid overlay */
  .d-grid {
    position:absolute;
    inset:0;
    background-image:
      linear-gradient(rgba(59,130,246,.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59,130,246,.035) 1px, transparent 1px);
    background-size:50px 50px;
    pointer-events:none;
    z-index:2;
    opacity:.7;
  }

  /* Subtle particle dots */
  .d-particles {
    position:absolute;
    inset:0;
    background-image:radial-gradient(rgba(59,130,246,.15) 1px, transparent 1px);
    background-size:30px 30px;
    pointer-events:none;
    z-index:2;
    opacity:.4;
    animation:d-pulse 8s ease-in-out infinite;
  }

  /* ── Card ── */
  .d-card {
    position:relative;
    z-index:10;
    background:rgba(10,22,40,.85);
    border:1px solid rgba(59,130,246,.25);
    border-radius:32px;
    padding:52px 44px;
    width:100%;
    max-width:460px;
    backdrop-filter:blur(24px) saturate(180%);
    box-shadow:
      0 25px 80px -20px rgba(0,0,0,.6),
      0 0 0 1px rgba(59,130,246,.12),
      inset 0 1px 0 rgba(255,255,255,.08);
    animation:d-fadeIn .8s cubic-bezier(.16,1,.3,1);
    overflow:hidden;
  }

  /* Animated border glow on hover */
  .d-card::before {
    content:'';
    position:absolute;
    inset:-2px;
    background:linear-gradient(45deg,transparent,rgba(59,130,246,.3),transparent,rgba(99,102,241,.3),transparent);
    background-size:300% 300%;
    border-radius:34px;
    opacity:0;
    transition:opacity .4s ease;
    z-index:-1;
    animation:d-gradient 6s ease infinite;
  }
  .d-card:hover::before { opacity:1; }

  /* Scanning line */
  .d-scan-line {
    position:absolute;
    left:0; right:0;
    height:2px;
    background:linear-gradient(90deg, transparent, rgba(59,130,246,.6), rgba(99,102,241,.6), transparent);
    animation:d-scan 5s linear infinite;
    pointer-events:none;
    z-index:5;
    box-shadow:0 0 20px rgba(59,130,246,.4);
  }

  /* ── Badge ── */
  .d-badge {
    display:inline-flex;
    align-items:center;
    gap:10px;
    background:linear-gradient(135deg, rgba(59,130,246,.15), rgba(99,102,241,.1));
    border:1px solid rgba(59,130,246,.35);
    border-radius:999px;
    padding:8px 18px;
    font-size:11px;
    font-weight:700;
    letter-spacing:.12em;
    color:#93c5fd;
    text-transform:uppercase;
    margin:0 auto 24px;
    animation:d-fadeIn .6s ease .1s both;
    box-shadow:0 4px 20px rgba(59,130,246,.15);
  }
  .d-badge-dot {
    width:8px; height:8px;
    border-radius:50%;
    background:#3b82f6;
    box-shadow:0 0 12px rgba(59,130,246,.8);
    animation:d-pulse 2s ease-in-out infinite;
  }

  /* ── Header ── */
  .d-header {
    text-align:center;
    margin-bottom:36px;
  }

  .d-icon-badge {
    width:76px;
    height:76px;
    margin:0 auto 22px;
    background:linear-gradient(135deg, rgba(59,130,246,.2), rgba(99,102,241,.15));
    border-radius:24px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:34px;
    border:1px solid rgba(59,130,246,.4);
    box-shadow:
      0 8px 32px rgba(59,130,246,.25),
      inset 0 1px 0 rgba(255,255,255,.1);
    animation:d-fadeIn .6s ease .15s both;
  }

  .d-title {
    font-family:'Syne',sans-serif;
    font-size:34px;
    font-weight:800;
    color:#fff;
    margin-bottom:8px;
    line-height:1.1;
    animation:d-fadeIn .6s ease .25s both;
    letter-spacing:-.5px;
  }
  .d-title span {
    background:linear-gradient(135deg,#60a5fa 0%,#3b82f6 40%,#6366f1 100%);
    -webkit-background-clip:text;
    -webkit-text-fill-color:transparent;
    background-clip:text;
    background-size:200% 200%;
    animation:d-gradient 4s ease infinite;
  }

  .d-subtitle {
    font-size:14px;
    color:#64748b;
    font-weight:400;
    line-height:1.6;
    animation:d-fadeIn .6s ease .35s both;
  }

  .d-form { animation:d-fadeIn .6s ease .45s both; }

  /* ── Inputs with floating labels ── */
  .d-input-group {
    position:relative;
    margin-bottom:22px;
  }

  .d-label {
    position:absolute;
    left:48px;
    top:50%;
    transform:translateY(-50%);
    font-size:14px;
    color:#475569;
    pointer-events:none;
    transition:all .3s cubic-bezier(.4,0,.2,1);
    padding:0 6px;
    background:transparent;
    font-weight:500;
  }

  .d-input {
    width:100%;
    padding:18px 16px 18px 52px;
    background:rgba(15,31,51,.6);
    border:1.5px solid rgba(59,130,246,.15);
    border-radius:16px;
    color:#e2f0ff;
    font-size:15px;
    font-family:'DM Sans',sans-serif;
    outline:none;
    transition:all .3s cubic-bezier(.4,0,.2,1);
  }

  .d-input::placeholder { color:transparent; }

  .d-input:focus {
    border-color:rgba(59,130,246,.55);
    background:rgba(15,31,51,.85);
    box-shadow:
      0 0 0 5px rgba(59,130,246,.12),
      0 4px 24px rgba(59,130,246,.2);
  }

  .d-input:focus + .d-label,
  .d-input:not(:placeholder-shown) + .d-label {
    top:0;
    font-size:11px;
    color:#60a5fa;
    background:linear-gradient(135deg,#0a1628,#0f213a);
    font-weight:600;
    letter-spacing:.02em;
  }

  .d-input.err {
    border-color:rgba(239,68,68,.5);
    background:rgba(239,68,68,.05);
    animation:d-shake .5s ease;
  }

  .d-icon {
    position:absolute;
    left:18px;
    top:50%;
    transform:translateY(-50%);
    font-size:19px;
    color:#475569;
    transition:all .3s;
    pointer-events:none;
  }

  .d-input:focus ~ .d-icon {
    color:#60a5fa;
    transform:translateY(-50%) scale(1.1);
  }

  .d-eye {
    position:absolute;
    right:18px;
    top:50%;
    transform:translateY(-50%);
    background:none;
    border:none;
    cursor:pointer;
    font-size:19px;
    color:#475569;
    transition:all .25s;
    padding:6px;
    border-radius:10px;
  }

  .d-eye:hover {
    color:#60a5fa;
    background:rgba(59,130,246,.12);
  }

  /* ── Submit button ── */
  .d-submit {
    width:100%;
    padding:18px;
    background:linear-gradient(135deg,#1d4ed8 0%,#4f46e5 45%,#1d4ed8 100%);
    background-size:200% 200%;
    border:none;
    border-radius:16px;
    color:#fff;
    font-size:15px;
    font-weight:700;
    cursor:pointer;
    transition:all .35s cubic-bezier(.4,0,.2,1);
    position:relative;
    overflow:hidden;
    margin-top:12px;
    font-family:'DM Sans',sans-serif;
    letter-spacing:.02em;
    box-shadow:
      0 6px 28px rgba(59,130,246,.35),
      0 0 0 0 rgba(59,130,246,.4);
    animation:d-gradient 4s ease infinite;
  }

  .d-submit::before {
    content:'';
    position:absolute;
    top:0;
    left:-100%;
    width:100%;
    height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent);
    transition:left .6s ease;
  }

  .d-submit:hover:not(:disabled) {
    transform:translateY(-3px);
    box-shadow:
      0 12px 40px rgba(59,130,246,.45),
      0 0 50px rgba(59,130,246,.3);
  }

  .d-submit:hover::before { left:100%; }

  .d-submit:active:not(:disabled) { transform:translateY(-1px); }

  .d-submit:disabled {
    opacity:.7;
    cursor:not-allowed;
    transform:none;
    animation:none;
  }

  /* ── Error banner ── */
  .d-error {
    background:linear-gradient(135deg, rgba(239,68,68,.12), rgba(239,68,68,.06));
    border:1px solid rgba(239,68,68,.35);
    border-radius:14px;
    padding:15px 18px;
    color:#fecaca;
    font-size:13px;
    margin-bottom:22px;
    animation:d-fadeIn .35s ease;
    display:flex;
    align-items:center;
    gap:10px;
    backdrop-filter:blur(10px);
  }

  /* ── Footer link ── */
  .d-links {
    margin-top:28px;
    text-align:center;
    font-size:14px;
    color:#64748b;
    animation:d-fadeIn .6s ease .55s both;
  }

  .d-links a {
    color:#60a5fa;
    text-decoration:none;
    font-weight:700;
    transition:all .3s ease;
    position:relative;
    display:inline-flex;
    align-items:center;
    gap:6px;
    padding:6px 12px;
    border-radius:8px;
  }

  .d-links a::before {
    content:'↩';
    font-size:14px;
    transition:transform .3s ease;
  }

  .d-links a:hover {
    color:#93c5fd;
    background:rgba(59,130,246,.12);
  }

  .d-links a:hover::before { transform:translateX(-3px); }

  .d-links a::after {
    content:'';
    position:absolute;
    bottom:-3px;
    left:50%;
    transform:translateX(-50%) scaleX(0);
    width:80%;
    height:2px;
    background:linear-gradient(90deg, transparent, #60a5fa, transparent);
    transition:transform .3s ease;
    transform-origin:center;
  }

  .d-links a:hover::after { transform:translateX(-50%) scaleX(1); }

  /* ── Spinner ── */
  .d-spinner {
    display:inline-block;
    width:19px;
    height:19px;
    border:2.5px solid rgba(255,255,255,.35);
    border-top-color:#fff;
    border-radius:50%;
    animation:d-spin .85s linear infinite;
    vertical-align:middle;
    margin-right:10px;
  }

  /* ── Responsive ── */
  @media (max-width: 480px) {
    .d-card {
      padding:44px 28px;
      margin:20px;
      border-radius:28px;
    }
    .d-title { font-size:28px; }
    .d-icon-badge { width:64px; height:64px; font-size:28px; }
    .d-input { padding:16px 14px 16px 48px; }
    .d-label { left:44px; }
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width:6px; }
  ::-webkit-scrollbar-track { background:rgba(10,22,40,.6); border-radius:3px; }
  ::-webkit-scrollbar-thumb { background:rgba(59,130,246,.4); border-radius:3px; }
  ::-webkit-scrollbar-thumb:hover { background:rgba(59,130,246,.6); }
`;

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export default function DecideurLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shakeField, setShakeField] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return;
      const u = JSON.parse(stored);
      if (isDecideur(u.role)) navigate('/decideur/dashboard', { replace: true });
      else navigate('/', { replace: true });
    } catch {
      localStorage.clear();
    }
  }, [navigate]);

  const shake = (field = 'both') => {
    setShakeField(field);
    setTimeout(() => setShakeField(''), 450);
  };

  const handleLogin = async () => {
    setError('');
    if (!email && !password) { shake('both'); setError('Veuillez remplir tous les champs.'); return; }
    if (!email) { shake('email'); setError('Adresse email requise.'); return; }
    if (!email.includes('@')) { shake('email'); setError('Adresse email invalide.'); return; }
    if (!password) { shake('password'); setError('Mot de passe requis.'); return; }

    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      const { token, user } = res.data;

      if (!isDecideur(user?.role)) {
        setError('Accès refusé — ce portail est réservé aux décideurs.');
        shake('both');
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/decideur/dashboard');
    } catch (err) {
      const status = err.response?.status;
      if (!err.response) setError('Serveur inaccessible. Vérifiez votre connexion.');
      else if (status === 401) setError('Email ou mot de passe incorrect.');
      else if (status === 403) setError("Compte désactivé. Contactez l'administrateur.");
      else if (status === 400) setError('Champs manquants ou invalides.');
      else setError(err.response?.data?.error || `Erreur serveur (${status}).`);
      shake('both');
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === 'Enter' && !loading) handleLogin(); };

  const cls = (field) => [
    'd-input',
    error ? 'err' : '',
    shakeField === field || shakeField === 'both' ? 'shake' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="d-root">
      <style>{CSS}</style>
      <div className="d-grid"></div>
      <div className="d-particles"></div>

      <div className="d-card">
        <div className="d-scan-line" />

        {/* Badge */}
        <div className="d-badge">
          <div className="d-badge-dot" />
          Portail Décideur
        </div>

        {/* Header */}
        <div className="d-header">
          <div className="d-icon-badge">🎯</div>
          <h1 className="d-title">Espace <span>Décideur</span></h1>
          <p className="d-subtitle">Tableau de bord national — Audit SSI 2026</p>
        </div>

        {/* Error */}
        {error && <div className="d-error">⚠️ {error}</div>}

        {/* Form */}
        <div className="d-form">
          {/* Email */}
          <div className="d-input-group">
            <input
              type="email"
              className={cls('email')}
              placeholder=" "
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              onKeyDown={onKey}
              disabled={loading}
              autoComplete="email"
            />
            <span className="d-icon">✉️</span>
            <label className="d-label">Adresse email</label>
          </div>

          {/* Password */}
          <div className="d-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              className={cls('password')}
              placeholder=" "
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={onKey}
              disabled={loading}
              autoComplete="current-password"
              style={{ paddingRight: 52 }}
            />
            <span className="d-icon">🔒</span>
            <label className="d-label">Mot de passe</label>
            <button
              type="button"
              className="d-eye"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {/* Submit */}
          <button
            className="d-submit"
            onClick={handleLogin}
            disabled={loading}
            type="button"
          >
            {loading ? (
              <><span className="d-spinner" />Connexion en cours…</>
            ) : (
              'Accéder au tableau de bord'
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="d-links">
          <a href="/">Retour à la connexion</a>
        </div>
      </div>
    </div>
  );
}