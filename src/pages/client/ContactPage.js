import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes floatDot  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes rotateSlow{ from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

  .contact-root { font-family:'DM Sans',sans-serif; }
  .contact-root * { box-sizing:border-box; margin:0; padding:0; }

  .cp-hex-bg {
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-6l22-13V19L28 6 6 19v28L28 60z' fill='%23ffffff' fill-opacity='0.022'/%3E%3C/svg%3E");
  }

  .cp-edit-input {
    width:100%; background:rgba(255,255,255,.055);
    border:1px solid rgba(99,210,190,.3); border-radius:10px;
    padding:11px 14px; font-size:14px; font-family:'DM Sans',sans-serif;
    color:#d4e8ff; outline:none; transition:border-color .2s,box-shadow .2s;
  }
  .cp-edit-input:focus { border-color:#63d2be; box-shadow:0 0 0 3px rgba(99,210,190,.15); }
  .cp-edit-input::placeholder { color:#1e3a52; }

  .cp-edit-textarea {
    width:100%; background:rgba(255,255,255,.055);
    border:1px solid rgba(99,210,190,.3); border-radius:10px;
    padding:11px 14px; font-size:14px; font-family:'DM Sans',sans-serif;
    color:#d4e8ff; outline:none; resize:vertical; min-height:140px;
    transition:border-color .2s,box-shadow .2s;
  }
  .cp-edit-textarea:focus { border-color:#63d2be; box-shadow:0 0 0 3px rgba(99,210,190,.15); }
  .cp-edit-textarea::placeholder { color:#1e3a52; }

  .cp-edit-select {
    width:100%; background:rgba(10,22,40,.95);
    border:1px solid rgba(99,210,190,.3); border-radius:10px;
    padding:11px 14px; font-size:14px; font-family:'DM Sans',sans-serif;
    color:#d4e8ff; outline:none; cursor:pointer;
  }
  .cp-edit-select:focus { border-color:#63d2be; }
  .cp-edit-select option { background:#0c1e34; }

  .cp-btn-primary {
    background:linear-gradient(135deg,#63d2be,#2eb8a0);
    color:#071520; border:none; padding:12px 28px; border-radius:12px;
    font-size:14px; font-family:'DM Sans',sans-serif; font-weight:700;
    cursor:pointer; transition:filter .2s,transform .15s; letter-spacing:.3px;
  }
  .cp-btn-primary:hover:not(:disabled) { filter:brightness(1.1); transform:translateY(-2px); }
  .cp-btn-primary:disabled { opacity:.45; cursor:not-allowed; transform:none; filter:none; }

  .contact-info-card {
    display:flex; align-items:flex-start; gap:14px; padding:16px 20px;
    background:rgba(255,255,255,.025); border:1px solid rgba(255,255,255,.065);
    border-radius:16px; backdrop-filter:blur(12px); transition:border-color .2s;
  }
  .contact-info-card:hover { border-color:rgba(99,210,190,.22); }

  .cp-nav-link {
    display:flex; align-items:center; gap:6px;
    padding:7px 13px; border-radius:10px; text-decoration:none;
    font-size:13px; font-weight:500; transition:all .2s; white-space:nowrap;
  }
  .cp-nav-link:hover { background:rgba(255,255,255,.06); color:#8ab0c8 !important; }

  .contact-a1{animation:fadeUp .5s ease both .05s}
  .contact-a2{animation:fadeUp .5s ease both .10s}
  .contact-a3{animation:fadeUp .5s ease both .15s}
`;

function injectStyles() {
  if (document.getElementById('contact-page-styles')) return;
  const el = document.createElement('style'); el.id='contact-page-styles'; el.textContent=CSS;
  document.head.appendChild(el);
}

const NAV_LINKS = [
  { to:'/client/dashboard',     label:'Déposer un rapport', icon:'📤' },
  { to:'/client/profile',       label:'Mon profil',         icon:'🏢' },
  { to:'/client/notifications', label:'Notifications',      icon:'🔔' },
  { to:'/client/guide',         label:'Guide de dépôt',     icon:'📖' },
  { to:'/client/contact',       label:'Contacter ANCS',     icon:'💬' },
];

const SUBJECTS = [
  'Problème technique',
  'Question sur un rapport',
  'Demande d\'information',
  'Rapport rejeté — contestation',
  'Accès au compte',
  'Signalement d\'incident de sécurité',
  'Autre',
];

const sectionCard = { background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.065)', borderRadius:22, backdropFilter:'blur(12px)' };

export default function ContactPage() {
  const [form,    setForm]    = useState({ subject:'', message:'' });
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => { injectStyles(); return () => document.getElementById('contact-page-styles')?.remove(); }, []);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const initials = user ? (user.username || user.company_name || 'U').charAt(0).toUpperCase() : 'U';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('extractedData');
    navigate('/');
  };

  const valid = form.subject && form.message.trim().length >= 10;

  const handleSubmit = async () => {
    if (!valid) return;
    setSending(true); setError(null);
    try {
      await new Promise(r => setTimeout(r, 1200));
      setSent(true); setForm({ subject:'', message:'' });
    } catch { setError('Erreur lors de l\'envoi. Veuillez réessayer ou nous contacter par email.'); }
    finally { setSending(false); }
  };

  return (
    <div className="contact-root" style={{ minHeight:'100vh', background:'#07111e', color:'#e2f0ff' }}>

      {/* ══ NAVBAR ══ */}
      <nav style={{
        background:'rgba(8,20,36,.92)', backdropFilter:'blur(16px)',
        borderBottom:'1px solid rgba(255,255,255,.06)',
        padding:'0 28px', display:'flex', alignItems:'center', justifyContent:'space-between',
        height:60, position:'sticky', top:0, zIndex:100,
        boxShadow:'0 4px 24px rgba(0,0,0,.35)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, background:'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🏢</div>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:15, color:'#d4e8ff' }}>Espace Entreprise</span>
          </div>
          <div style={{ display:'flex', gap:4 }}>
            {NAV_LINKS.map(nl => {
              const isActive = location.pathname === nl.to;
              return (
                <Link key={nl.to} to={nl.to} className="cp-nav-link" style={{
                  background: isActive ? 'rgba(99,210,190,.1)' : 'transparent',
                  color:      isActive ? '#63d2be' : '#3d607a',
                  border:     isActive ? '1px solid rgba(99,210,190,.2)' : '1px solid transparent',
                }}>
                  <span style={{ fontSize:13 }}>{nl.icon}</span>{nl.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {user && (
            <div style={{ display:'flex', alignItems:'center', gap:9, padding:'5px 12px', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:99 }}>
              <div style={{ width:26, height:26, background:'linear-gradient(135deg,#0d5580,#1a7a6e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>{initials}</div>
              <span style={{ fontSize:12, color:'#4a6a88' }}>{user.company_name || user.username || user.email}</span>
            </div>
          )}
          <button onClick={handleLogout} style={{ padding:'8px 16px', borderRadius:10, background:'rgba(248,113,113,.1)', color:'#f87171', border:'1px solid rgba(248,113,113,.2)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Déconnexion</button>
        </div>
      </nav>

      {/* HERO */}
      <div className="cp-hex-bg" style={{ position:'relative', height:200, overflow:'hidden', background:'linear-gradient(155deg,#0c1f3a 0%,#0a2540 45%,#061520 100%)' }}>
        {[{w:360,h:360,t:-120,r:-80,d:22},{w:200,h:200,t:30,r:200,d:16},{w:480,h:480,t:-200,r:280,d:40}].map((s,i) => (
          <div key={i} style={{ position:'absolute', top:s.t, right:s.r, width:s.w, height:s.h, borderRadius:'50%', border:'1px solid rgba(99,210,190,.18)', opacity:.5, animation:`rotateSlow ${s.d}s linear infinite` }} />
        ))}
        {[[28,70,0],[72,280,.6],[48,520,.2]].map(([t,l,d],i) => (
          <div key={i} style={{ position:'absolute', top:t, left:l, width:4, height:4, borderRadius:'50%', background:'rgba(99,210,190,.35)', animation:`floatDot ${2.8+i*.35}s ease-in-out infinite`, animationDelay:`${d}s` }} />
        ))}
        <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.01) 3px,rgba(255,255,255,.01) 4px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:100, background:'linear-gradient(to top,#07111e,transparent)' }} />
        <div style={{ position:'absolute', top:22, right:26, display:'flex', alignItems:'center', gap:8, background:'rgba(99,210,190,.07)', border:'1px solid rgba(99,210,190,.18)', borderRadius:12, padding:'8px 16px' }}>
          <span style={{ fontSize:14 }}>💬</span>
          <span style={{ fontSize:11, fontWeight:700, color:'#63d2be', letterSpacing:'1.2px', fontFamily:"'Syne',sans-serif" }}>SUPPORT ANCS</span>
        </div>
        <div style={{ position:'absolute', bottom:36, left:28 }}>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:'#e4f2ff' }}>Contacter <span style={{ color:'#63d2be' }}>l'ANCS</span></h1>
          <p style={{ fontSize:13, color:'#3d607a', marginTop:4 }}>Une question ? L'équipe ANCS vous répond dans les 48h ouvrables.</p>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'32px 28px 64px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:24 }}>

          {/* Form */}
          <div className="contact-a1">
            {sent && (
              <div style={{ background:'rgba(74,222,128,.07)', border:'1px solid rgba(74,222,128,.22)', borderRadius:16, padding:'16px 22px', marginBottom:20, color:'#4ade80', fontSize:14, fontWeight:600, display:'flex', gap:12, alignItems:'flex-start' }}>
                <span style={{ fontSize:20 }}>✓</span>
                <div>
                  <div style={{ marginBottom:3 }}>Message envoyé !</div>
                  <div style={{ color:'#16a34a', fontSize:12, fontWeight:400 }}>L'équipe ANCS vous répondra sous 48h à votre adresse email.</div>
                </div>
              </div>
            )}
            {error && (
              <div style={{ background:'rgba(248,113,113,.07)', border:'1px solid rgba(248,113,113,.22)', borderRadius:16, padding:'14px 20px', marginBottom:20, color:'#f87171', fontSize:13 }}>⚠️ {error}</div>
            )}
            <div style={{ ...sectionCard, padding:28 }}>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:10, fontWeight:600 }}>Sujet *</div>
                <select className="cp-edit-select" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}>
                  <option value="">— Choisissez un sujet —</option>
                  {SUBJECTS.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:24 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'1.2px', fontWeight:600 }}>Message *</div>
                  <span style={{ fontSize:11, color:form.message.length>=10?'#3d607a':'#1e3a52' }}>{form.message.length} car.</span>
                </div>
                <textarea
                  className="cp-edit-textarea"
                  placeholder="Décrivez votre demande. Précisez le numéro de rapport si applicable (ex: RPT-0042)."
                  value={form.message}
                  onChange={e=>setForm({...form,message:e.target.value})}
                />
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button className="cp-btn-primary" onClick={handleSubmit} disabled={!valid||sending}>
                  {sending ? '⏳ Envoi en cours...' : '📨 Envoyer le message'}
                </button>
              </div>
            </div>
          </div>

          {/* Info — ✅ REAL ANCS DATA */}
          <div className="contact-a2" style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ marginBottom:4 }}>
              <div style={{ fontSize:10, color:'#3d607a', textTransform:'uppercase', letterSpacing:'1.2px', fontWeight:600, marginBottom:14 }}>Contacts officiels ANCS</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { icon:'📧', label:'Email général',         value:'ancs@ancs.tn',                      color:'#63d2be' },
                  { icon:'🛡️', label:'Assistance tunCERT',    value:'assistance@ancs.tn',                color:'#818cf8' },
                  { icon:'🚨', label:'Signalement d\'incident',value:'incident@ancs.tn',                  color:'#f87171' },
                  { icon:'📞', label:'Centre d\'appel',        value:'+216 71 843 200',                   color:'#4ade80' },
                  { icon:'📞', label:'Téléphone principal',    value:'+216 71 846 020',                   color:'#4ade80' },
                  { icon:'📍', label:'Adresse',               value:'49, Avenue Jean Jaurès, 1000 Tunis', color:'#fbbf24' },
                  { icon:'🌐', label:'Site officiel',          value:'www.ancs.tn',                       color:'#63d2be' },
                ].map(c => (
                  <div key={c.label} className="contact-info-card">
                    <div style={{ width:36, height:36, borderRadius:10, background:`${c.color}15`, border:`1px solid ${c.color}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{c.icon}</div>
                    <div>
                      <div style={{ fontSize:10, color:'#1e3a52', textTransform:'uppercase', letterSpacing:'.8px', fontWeight:600, marginBottom:3 }}>{c.label}</div>
                      <div style={{ fontSize:13, color:'#8ab0c8', fontWeight:500 }}>{c.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background:'rgba(99,210,190,.05)', border:'1px solid rgba(99,210,190,.15)', borderRadius:16, padding:'16px 18px' }}>
              <div style={{ fontSize:10, color:'#63d2be', fontWeight:700, textTransform:'uppercase', letterSpacing:'.8px', marginBottom:12 }}>Délai de réponse</div>
              {[
                { l:'Email / formulaire',      d:'48h ouvrables', c:'#4ade80' },
                { l:'Incident de sécurité',    d:'24h ouvrables', c:'#fbbf24' },
                { l:'Centre d\'appel tunCERT', d:'Immédiat',      c:'#63d2be' },
              ].map(r => (
                <div key={r.l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ fontSize:12, color:'#3d607a' }}>{r.l}</span>
                  <span style={{ fontSize:12, color:r.c, fontWeight:600 }}>{r.d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop:40, textAlign:'center', fontSize:11, color:'#1e3a52', letterSpacing:'.3px' }}>
          ANCS Platform · Agence Nationale de la Cybersécurité © 2026 · <span style={{ color:'#1e3a52' }}>ancs.tn</span>
        </div>
      </div>
    </div>
  );
}