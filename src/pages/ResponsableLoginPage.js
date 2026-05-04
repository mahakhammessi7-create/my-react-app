import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing:border-box; margin:0; padding:0; }

  .rs-root {
    font-family:'DM Sans',sans-serif;
    min-height:100vh;
    display:flex;
    align-items:center;
    justify-content:center;
    background:#07111e;
    position:relative;
    overflow:hidden;
  }

  .rs-root::before {
    content:'';
    position:absolute;
    inset:0;
    background-image:
      linear-gradient(rgba(16,185,129,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(16,185,129,.025) 1px, transparent 1px);
    background-size:40px 40px;
    pointer-events:none;
  }

  .rs-card {
    position:relative;
    z-index:10;
    width:100%;
    max-width:420px;
    padding:42px 36px;
    border-radius:24px;
    background:rgba(255,255,255,.03);
    border:1px solid rgba(16,185,129,.15);
    backdrop-filter:blur(14px);
    box-shadow:0 32px 80px rgba(0,0,0,.6);
  }

  .rs-title { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; color:#d8f8ef; margin-bottom:8px; }
  .rs-subtitle { font-size:13px; color:#7ea894; margin-bottom:24px; }
  .rs-input-wrap { position:relative; margin-bottom:14px; }
  .rs-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); font-size:14px; pointer-events:none; color:#10b981; }
  .rs-input { width:100%; padding:13px 16px 13px 40px; border-radius:14px; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.04); color:#e7fffa; font-size:14px; outline:none; transition:border .2s, box-shadow .2s; }
  .rs-input:focus { border-color:rgba(16,185,129,.4); box-shadow:0 0 0 3px rgba(16,185,129,.08); }
  .rs-input.error { border-color:rgba(248,113,113,.5); }
  .rs-btn { width:100%; border:none; border-radius:14px; padding:14px; font-weight:700; font-size:14px; background:linear-gradient(135deg,#0f766e,#10b981); color:#07111e; cursor:pointer; transition:transform .2s, filter .2s; }
  .rs-btn:hover:not(:disabled) { transform:translateY(-1px); filter:brightness(1.05); }
  .rs-btn:disabled { opacity:.7; cursor:not-allowed; }
  .rs-error { background:rgba(248,113,113,.1); border:1px solid rgba(248,113,113,.2); padding:12px 14px; border-radius:12px; color:#ffb3b3; margin-bottom:18px; }
  .rs-link { margin-top:18px; font-size:13px; text-align:center; color:#7ea894; }
  .rs-link a { color:#10b981; text-decoration:none; font-weight:700; }
  .rs-eye { position:absolute; right:13px; top:50%; transform:translateY(-50%); border:none; background:none; color:#10b981; font-size:14px; cursor:pointer; }
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
      <div className="rs-card">
        <div style={{ marginBottom:24 }}>
          <h1 className="rs-title">Responsable de suivi</h1>
          <p className="rs-subtitle">Gestion, affectation et validation des rapports et indicateurs.</p>
        </div>
        {error && <div className="rs-error">⚠️ {error}</div>}
        <div className="rs-input-wrap">
          <span className="rs-icon">✉️</span>
          <input
            className={`rs-input${error && !email.includes('@') ? ' error' : ''}`}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoComplete="email"
          />
        </div>
        <div className="rs-input-wrap">
          <span className="rs-icon">🔒</span>
          <input
            className={`rs-input${error && password.length < 6 ? ' error' : ''}`}
            type={showPwd ? 'text' : 'password'}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoComplete="current-password"
            style={{ paddingRight: 44 }}
          />
          <button className="rs-eye" onClick={() => setShowPwd((v) => !v)} type="button">{showPwd ? '🙈' : '👁️'}</button>
        </div>
        <button className="rs-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        <div className="rs-link">
          Retour à <a href="/">connexion client</a>
        </div>
      </div>
    </div>
  );
}
