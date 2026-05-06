import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  @keyframes ce-up { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ce-fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes ce-spin { to{transform:rotate(360deg)} }
  @keyframes ce-shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
  @keyframes ce-glow { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.6;transform:scale(1.1)} }
  @keyframes ce-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
  @keyframes ce-pulse-ring { 0%{transform:scale(.8);opacity:.5} 100%{transform:scale(2);opacity:0} }
  @keyframes ce-gradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes ce-input-glow { 0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,0)} 50%{box-shadow:0 0 20px 8px rgba(139,92,246,.15)} }

  * { box-sizing:border-box; margin:0; padding:0; }

  .ce-root {
    font-family:'DM Sans',sans-serif;
    min-height:100vh;
    background:linear-gradient(135deg,#0a0e27 0%,#1a1f4b 50%,#0f1729 100%);
    display:flex;
    align-items:center;
    justify-content:center;
    position:relative;
    overflow:hidden;
    animation:ce-fadeIn .6s ease;
  }

  /* Animated background blobs */
  .ce-root::before, .ce-root::after {
    content:'';
    position:absolute;
    border-radius:50%;
    filter:blur(80px);
    opacity:.4;
    animation:ce-float 8s ease-in-out infinite;
  }
  
  .ce-root::before {
    width:400px;
    height:400px;
    background:radial-gradient(circle,rgba(139,92,246,.4) 0%,transparent 70%);
    top:-100px;
    left:-100px;
    animation-delay:0s;
  }
  
  .ce-root::after {
    width:300px;
    height:300px;
    background:radial-gradient(circle,rgba(99,102,241,.3) 0%,transparent 70%);
    bottom:-50px;
    right:-50px;
    animation-delay:2s;
  }

  /* Grid pattern overlay */
  .ce-grid {
    position:absolute;
    inset:0;
    background-image:
      linear-gradient(rgba(139,92,246,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(139,92,246,.03) 1px, transparent 1px);
    background-size:50px 50px;
    pointer-events:none;
    opacity:.5;
  }

  .ce-card {
    position:relative;
    z-index:10;
    background:rgba(255,255,255,.03);
    border:1px solid rgba(139,92,246,.2);
    border-radius:28px;
    padding:48px 40px;
    width:100%;
    max-width:420px;
    backdrop-filter:blur(20px) saturate(180%);
    box-shadow:
      0 25px 50px -12px rgba(0,0,0,.5),
      0 0 0 1px rgba(139,92,246,.1),
      inset 0 1px 0 rgba(255,255,255,.05);
    animation:ce-up .7s cubic-bezier(.16,1,.3,1);
    overflow:hidden;
  }

  /* Animated border glow */
  .ce-card::before {
    content:'';
    position:absolute;
    inset:-2px;
    background:linear-gradient(45deg,transparent,rgba(139,92,246,.3),transparent);
    border-radius:30px;
    opacity:0;
    transition:opacity .3s;
    z-index:-1;
    animation:ce-glow 3s ease-in-out infinite;
  }

  .ce-card:hover::before {
    opacity:1;
  }

  .ce-header {
    text-align:center;
    margin-bottom:32px;
  }

  .ce-icon-wrapper {
    width:64px;
    height:64px;
    margin:0 auto 20px;
    background:linear-gradient(135deg,rgba(139,92,246,.2),rgba(99,102,241,.2));
    border-radius:20px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:28px;
    border:1px solid rgba(139,92,246,.3);
    box-shadow:0 8px 32px rgba(139,92,246,.2);
    animation:ce-up .6s ease .2s both;
  }

  .ce-title {
    font-family:'Syne',sans-serif;
    font-size:32px;
    font-weight:700;
    color:#fff;
    margin-bottom:8px;
    background:linear-gradient(135deg,#fff 0%,#a78bfa 50%,#8b5cf6 100%);
    -webkit-background-clip:text;
    -webkit-text-fill-color:transparent;
    background-clip:text;
    animation:ce-up .6s ease .3s both;
    letter-spacing:-.5px;
  }

  .ce-subtitle {
    font-size:14px;
    color:#64748b;
    font-weight:400;
    animation:ce-up .6s ease .4s both;
  }

  .ce-form {
    animation:ce-up .6s ease .5s both;
  }

  .ce-input-group {
    position:relative;
    margin-bottom:20px;
  }

  .ce-label {
    position:absolute;
    left:44px;
    top:50%;
    transform:translateY(-50%);
    font-size:14px;
    color:#64748b;
    pointer-events:none;
    transition:all .3s cubic-bezier(.4,0,.2,1);
    background:transparent;
    padding:0 4px;
  }

  .ce-input {
    width:100%;
    padding:16px 16px 16px 48px;
    background:rgba(15,23,42,.6);
    border:1.5px solid rgba(139,92,246,.15);
    border-radius:14px;
    color:#e2e8f0;
    font-size:15px;
    font-family:'DM Sans',sans-serif;
    outline:none;
    transition:all .3s cubic-bezier(.4,0,.2,1);
  }

  .ce-input::placeholder {
    color:transparent;
  }

  .ce-input:focus {
    border-color:rgba(139,92,246,.5);
    background:rgba(15,23,42,.8);
    box-shadow:
      0 0 0 4px rgba(139,92,246,.1),
      0 4px 20px rgba(139,92,246,.15);
  }

  .ce-input:focus + .ce-label,
  .ce-input:not(:placeholder-shown) + .ce-label {
    top:0;
    font-size:12px;
    color:#8b5cf6;
    background:linear-gradient(135deg,#0f172a,#1e293b);
    font-weight:600;
  }

  .ce-input.error {
    border-color:rgba(239,68,68,.5);
    animation:ce-shake .5s ease;
    background:rgba(239,68,68,.05);
  }

  .ce-icon {
    position:absolute;
    left:16px;
    top:50%;
    transform:translateY(-50%);
    font-size:18px;
    color:#64748b;
    transition:all .3s;
    pointer-events:none;
  }

  .ce-input:focus ~ .ce-icon {
    color:#8b5cf6;
    transform:translateY(-50%) scale(1.1);
  }

  .ce-eye {
    position:absolute;
    right:16px;
    top:50%;
    transform:translateY(-50%);
    background:none;
    border:none;
    cursor:pointer;
    font-size:18px;
    color:#64748b;
    transition:all .2s;
    padding:4px;
    border-radius:8px;
  }

  .ce-eye:hover {
    color:#8b5cf6;
    background:rgba(139,92,246,.1);
  }

  .ce-submit {
    width:100%;
    padding:16px;
    background:linear-gradient(135deg,#8b5cf6 0%,#6366f1 50%,#8b5cf6 100%);
    background-size:200% 200%;
    border:none;
    border-radius:14px;
    color:#fff;
    font-size:15px;
    font-weight:600;
    cursor:pointer;
    transition:all .3s cubic-bezier(.4,0,.2,1);
    position:relative;
    overflow:hidden;
    margin-top:8px;
    font-family:'DM Sans',sans-serif;
    box-shadow:
      0 4px 20px rgba(139,92,246,.3),
      0 0 0 0 rgba(139,92,246,.4);
    animation:ce-gradient 3s ease infinite;
  }

  .ce-submit::before {
    content:'';
    position:absolute;
    top:0;
    left:-100%;
    width:100%;
    height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);
    transition:left .5s;
  }

  .ce-submit:hover {
    transform:translateY(-2px);
    box-shadow:
      0 8px 30px rgba(139,92,246,.4),
      0 0 30px rgba(139,92,246,.3);
  }

  .ce-submit:hover::before {
    left:100%;
  }

  .ce-submit:active {
    transform:translateY(0);
  }

  .ce-submit:disabled {
    opacity:.7;
    cursor:not-allowed;
    transform:none;
    animation:none;
  }

  .ce-error {
    background:linear-gradient(135deg,rgba(239,68,68,.1),rgba(239,68,68,.05));
    border:1px solid rgba(239,68,68,.3);
    border-radius:12px;
    padding:14px 16px;
    color:#fca5a5;
    font-size:13px;
    margin-bottom:20px;
    animation:ce-up .3s ease;
    display:flex;
    align-items:center;
    gap:8px;
    backdrop-filter:blur(10px);
  }

  .ce-debug {
    background:rgba(15,23,42,.8);
    border:1px solid rgba(99,210,190,.2);
    border-radius:12px;
    padding:14px;
    color:#63d2be;
    font-size:12px;
    margin-bottom:20px;
    font-family:'JetBrains Mono',monospace;
    max-height:200px;
    overflow-y:auto;
    animation:ce-up .3s ease;
    white-space:pre-wrap;
    word-break:break-all;
    line-height:1.5;
  }

  .ce-links {
    margin-top:24px;
    text-align:center;
    font-size:14px;
    color:#64748b;
    animation:ce-up .6s ease .6s both;
  }

  .ce-links a {
    color:#8b5cf6;
    text-decoration:none;
    font-weight:600;
    transition:all .2s;
    position:relative;
  }

  .ce-links a::after {
    content:'';
    position:absolute;
    bottom:-2px;
    left:0;
    width:0;
    height:2px;
    background:linear-gradient(90deg,#8b5cf6,#a78bfa);
    transition:width .3s;
  }

  .ce-links a:hover {
    color:#a78bfa;
  }

  .ce-links a:hover::after {
    width:100%;
  }

  .ce-spinner {
    display:inline-block;
    width:18px;
    height:18px;
    border:2.5px solid rgba(255,255,255,.3);
    border-top-color:#fff;
    border-radius:50%;
    animation:ce-spin .8s linear infinite;
    vertical-align:middle;
    margin-right:10px;
  }

  /* Responsive */
  @media (max-width: 480px) {
    .ce-card {
      padding:40px 24px;
      margin:20px;
    }
    .ce-title {
      font-size:26px;
    }
  }

  /* Scrollbar styling */
  .ce-debug::-webkit-scrollbar {
    width:6px;
  }
  .ce-debug::-webkit-scrollbar-track {
    background:rgba(15,23,42,.5);
    border-radius:3px;
  }
  .ce-debug::-webkit-scrollbar-thumb {
    background:rgba(139,92,246,.3);
    border-radius:3px;
  }
  .ce-debug::-webkit-scrollbar-thumb:hover {
    background:rgba(139,92,246,.5);
  }
`;

const isChargeEtude = (role) => {
  const r = String(role || '').toLowerCase().trim();
  return r === 'charge_etude';
};

export default function ChargeEtudeLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (isChargeEtude(u.role)) {
          navigate('/charge-etude/dashboard');
        } else {
          navigate('/');
        }
      } catch (e) {
        localStorage.clear();
      }
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
    setDebug('');

    try {
      const requestPayload = { email, password, userType: 'charge-etude' };
      setDebug(`📤 Request:\n${JSON.stringify(requestPayload, null, 2)}`);

      const res = await API.post('/auth/login', requestPayload);
      setDebug(prev => prev + `\n\n📥 Response:\n${JSON.stringify(res.data, null, 2)}`);

      const { token, user } = res.data;
      setDebug(prev => prev + `\n\n👤 User role: "${user?.role}"\n✅ Matches: ${isChargeEtude(user?.role)}`);

      if (!isChargeEtude(user?.role)) {
        setError(`Rôle reçu: "${user?.role}" - ne correspond pas`);
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/charge-etude/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const errorData = err.response?.data;
      setDebug(prev => prev + `\n\n❌ Status: ${status}\nError: ${JSON.stringify(errorData, null, 2)}`);

      if (!err.response) setError('Serveur inaccessible.');
      else if (status === 401) setError('Email ou mot de passe incorrect.');
      else if (status === 400) setError('Champs manquants ou invalides.');
      else setError(err.response?.data?.error || `Erreur serveur (${status}).`);
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
      <div className="ce-grid"></div>
      <div className="ce-card">
        <div className="ce-header">
          <div className="ce-icon-wrapper">📊</div>
          <h1 className="ce-title">Charge d'Étude</h1>
          <p className="ce-subtitle">Analyse Technique des Audits</p>
        </div>

        {error && <div className="ce-error">⚠️ {error}</div>}
        {debug && <div className="ce-debug">{debug}</div>}

        <div className="ce-form">
          <div className="ce-input-group">
            <input
              type="email"
              className="ce-input"
              placeholder=" "
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); setDebug(''); }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoComplete="email"
            />
            <span className="ce-icon">✉️</span>
            <label className="ce-label">Adresse email</label>
          </div>

          <div className="ce-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              className="ce-input"
              placeholder=" "
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); setDebug(''); }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoComplete="current-password"
              style={{ paddingRight: 48 }}
            />
            <span className="ce-icon">🔒</span>
            <label className="ce-label">Mot de passe</label>
            <button className="ce-eye" onClick={() => setShowPassword(v => !v)} tabIndex={-1} type="button">
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <button className="ce-submit" onClick={handleLogin} disabled={loading} type="button">
            {loading ? <><span className="ce-spinner" />Connexion en cours...</> : 'Se connecter'}
          </button>
        </div>

        
      </div>
    </div>
  );
}