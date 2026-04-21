import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  @keyframes fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes floatDot  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes rotateSlow{ from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

  .guide-root { font-family:'DM Sans',sans-serif; }
  .guide-root * { box-sizing:border-box; margin:0; padding:0; }

  .cp-hex-bg {
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-6l22-13V19L28 6 6 19v28L28 60z' fill='%23ffffff' fill-opacity='0.022'/%3E%3C/svg%3E");
  }

  .guide-step {
    display:flex; gap:18px; align-items:flex-start; padding:20px 22px;
    border-radius:18px; border:1px solid rgba(255,255,255,.065);
    background:rgba(255,255,255,.025); cursor:pointer;
    transition:background .2s,border-color .2s,transform .2s;
    backdrop-filter:blur(12px);
  }
  .guide-step:hover { background:rgba(99,210,190,.05); border-color:rgba(99,210,190,.22); transform:translateX(4px); }
  .guide-step.open  { background:rgba(99,210,190,.06); border-color:rgba(99,210,190,.3); }

  .guide-faq-item { border-radius:16px; border:1px solid rgba(255,255,255,.065); background:rgba(255,255,255,.025); overflow:hidden; backdrop-filter:blur(12px); transition:border-color .2s; }
  .guide-faq-item:hover { border-color:rgba(99,210,190,.22); }
  .guide-faq-q { width:100%; background:none; border:none; padding:16px 22px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; text-align:left; gap:12px; }

  .guide-checklist-item { display:flex; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,.04); }
  .guide-checklist-item:last-child { border-bottom:none; }

  .cp-nav-link {
    display:flex; align-items:center; gap:6px;
    padding:7px 13px; border-radius:10px; text-decoration:none;
    font-size:13px; font-weight:500; transition:all .2s; white-space:nowrap;
  }
  .cp-nav-link:hover { background:rgba(255,255,255,.06); color:#8ab0c8 !important; }

  .guide-a1{animation:fadeUp .5s ease both .05s}
  .guide-a2{animation:fadeUp .5s ease both .10s}
  .guide-a3{animation:fadeUp .5s ease both .15s}
  .guide-a4{animation:fadeUp .5s ease both .20s}
`;

function injectStyles() {
  if (document.getElementById('guide-page-styles')) return;
  const el = document.createElement('style'); el.id='guide-page-styles'; el.textContent=CSS;
  document.head.appendChild(el);
}

const NAV_LINKS = [
  { to:'/client/dashboard',     label:'Déposer un rapport', icon:'📤' },
  { to:'/client/profile',       label:'Mon profil',         icon:'🏢' },
  { to:'/client/notifications', label:'Notifications',      icon:'🔔' },
  { to:'/client/guide',         label:'Guide de dépôt',     icon:'📖' },
  { to:'/client/contact',       label:'Contacter ANCS',     icon:'💬' },
];

const STEPS = [
  { num:1, title:'Préparez votre rapport',     color:'#63d2be', icon:'📁', summary:'Rassemblez tous les documents avant de commencer.', details:['Le rapport doit être au format PDF ou Excel (.xlsx).','Toutes les sections obligatoires doivent être complètes : gouvernance, sécurité technique, continuité d\'activité, sauvegarde.','Votre RSSI doit valider le document en interne avant soumission.','Taille maximale : 20 Mo.'] },
  { num:2, title:'Connectez-vous au portail',  color:'#4ade80', icon:'🔐', summary:'Accédez à votre espace client avec vos identifiants ANCS.', details:['Rendez-vous sur le portail ANCS et connectez-vous avec l\'email fourni lors de l\'inscription.','Si vous avez oublié votre mot de passe, utilisez "Mot de passe oublié".','La session expire après 30 minutes d\'inactivité.'] },
  { num:3, title:'Déposez votre fichier',      color:'#818cf8', icon:'📤', summary:'Utilisez le formulaire de dépôt pour soumettre votre audit.', details:['Cliquez sur "Déposer un rapport" depuis votre tableau de bord.','Sélectionnez le fichier ou glissez-déposez.','Remplissez les métadonnées : secteur, année d\'audit, responsable.','Cliquez sur "Soumettre" — une confirmation sera envoyée par email.'] },
  { num:4, title:'Suivez le statut',           color:'#fbbf24', icon:'🔄', summary:'Consultez l\'avancement de votre dossier en temps réel.', details:['Statuts : En attente → En révision → Validé ou Rejeté.','Vous recevrez une notification à chaque changement de statut.','Délai moyen de traitement : 5 à 10 jours ouvrables.','En cas de rejet, le motif sera précisé et vous pourrez resoumettre.'] },
  { num:5, title:'Récupérez votre attestation',color:'#f87171', icon:'🏆', summary:'Après validation, téléchargez votre attestation de conformité.', details:['L\'attestation est disponible dans "Historique" une fois validée.','Elle est valable pour le cycle d\'audit en cours.','Conservez ce document — il peut être requis par des partenaires.'] },
];

const FAQS = [
  { q:'Que faire si mon rapport est rejeté ?',                         a:'Lisez le motif fourni par l\'auditeur, corrigez les sections concernées et soumettez une nouvelle version. Aucune limite au nombre de soumissions.' },
  { q:'Mon rapport est "en attente" depuis plus de 10 jours ?',        a:'Le délai standard est de 5 à 10 jours ouvrables. Au-delà, contactez l\'ANCS via la page "Contacter ANCS" en précisant votre numéro de rapport.' },
  { q:'Puis-je modifier un rapport déjà soumis ?',                     a:'Non. Si vous avez commis une erreur, contactez l\'ANCS pour annuler la soumission avant qu\'un auditeur ne la prenne en charge.' },
  { q:'Quels formats de fichiers sont acceptés ?',                     a:'PDF et Excel (.xlsx) uniquement, 20 Mo maximum. Les fichiers Word et images ne sont pas acceptés.' },
  { q:'L\'attestation de conformité est-elle définitive ?',            a:'Non, elle est valable pour le cycle d\'audit en cours (annuel). Un nouveau rapport est requis à chaque nouveau cycle.' },
];

const CHECKLIST = [
  { ok:true,  text:'Rapport signé par le responsable de l\'organisme' },
  { ok:true,  text:'Section gouvernance et politique SSI complète' },
  { ok:true,  text:'Inventaire des actifs informatiques inclus' },
  { ok:false, text:'Plan de continuité d\'activité (PCA) joint' },
  { ok:true,  text:'Résultats du dernier pentest (si disponible)' },
  { ok:false, text:'Politique de sauvegarde documentée' },
  { ok:true,  text:'Coordonnées du RSSI renseignées' },
];

const sectionCard = { background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.065)', borderRadius:22, backdropFilter:'blur(12px)' };

export default function GuidePage() {
  const [openStep, setOpenStep] = useState(null);
  const [openFaq,  setOpenFaq]  = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => { injectStyles(); return () => document.getElementById('guide-page-styles')?.remove(); }, []);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const initials = user ? (user.username || user.company_name || 'U').charAt(0).toUpperCase() : 'U';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('extractedData');
    navigate('/');
  };

  return (
    <div className="guide-root" style={{ minHeight:'100vh', background:'#07111e', color:'#e2f0ff' }}>

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
          <span style={{ fontSize:14 }}>📖</span>
          <span style={{ fontSize:11, fontWeight:700, color:'#63d2be', letterSpacing:'1.2px', fontFamily:"'Syne',sans-serif" }}>GUIDE DE DÉPÔT</span>
        </div>
        <div style={{ position:'absolute', bottom:36, left:28 }}>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color:'#e4f2ff' }}>Guide de <span style={{ color:'#63d2be' }}>Dépôt</span></h1>
          <p style={{ fontSize:13, color:'#3d607a', marginTop:4 }}>Suivez ces étapes pour soumettre correctement votre rapport d'audit SSI.</p>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'32px 28px 64px' }}>

        {/* Steps */}
        <div className="guide-a1" style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
          {STEPS.map((step, i) => (
            <div key={step.num}>
              <div className={`guide-step ${openStep===i?'open':''}`} onClick={() => setOpenStep(openStep===i?null:i)}>
                <div style={{ width:38, height:38, borderRadius:11, background:`${step.color}18`, border:`1px solid ${step.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:step.color, flexShrink:0 }}>{step.num}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:15 }}>{step.icon}</span>
                    <span style={{ fontSize:14, fontWeight:600, color:'#c8dff4', fontFamily:"'Syne',sans-serif" }}>{step.title}</span>
                  </div>
                  <p style={{ fontSize:12, color:'#3d607a' }}>{step.summary}</p>
                </div>
                <span style={{ color:'#1e3a52', fontSize:12, flexShrink:0 }}>{openStep===i?'▲':'▼'}</span>
              </div>
              {openStep===i && (
                <div style={{ margin:'4px 0 0 56px', padding:'14px 20px', background:'rgba(99,210,190,.03)', border:'1px solid rgba(99,210,190,.12)', borderRadius:14 }}>
                  <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:8 }}>
                    {step.details.map((d,j) => (
                      <li key={j} style={{ display:'flex', gap:10, fontSize:13, color:'#6a8fa8', lineHeight:1.6 }}>
                        <span style={{ color:'#63d2be', flexShrink:0 }}>›</span>{d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Checklist + Tips */}
        <div className="guide-a2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>
          <div style={{ ...sectionCard, overflow:'hidden' }}>
            <div style={{ padding:'16px 22px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:'rgba(99,210,190,.1)', border:'1px solid rgba(99,210,190,.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>✅</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:'#b0cce0', textTransform:'uppercase', letterSpacing:'.4px' }}>Checklist avant dépôt</h2>
            </div>
            <div style={{ padding:'16px 22px' }}>
              {CHECKLIST.map((item,i) => (
                <div key={i} className="guide-checklist-item">
                  <span style={{ fontSize:14, marginTop:1, flexShrink:0 }}>{item.ok?'✅':'⬜'}</span>
                  <span style={{ fontSize:13, color:item.ok?'#8ab0c8':'#3d607a', lineHeight:1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...sectionCard, overflow:'hidden' }}>
            <div style={{ padding:'16px 22px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:'rgba(251,191,36,.1)', border:'1px solid rgba(251,191,36,.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>💡</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:'#b0cce0', textTransform:'uppercase', letterSpacing:'.4px' }}>Conseils pratiques</h2>
            </div>
            <div style={{ padding:'16px 22px', display:'flex', flexDirection:'column', gap:14 }}>
              {[
                {icon:'⏰',tip:'Soumettez au moins 2 semaines avant la date limite pour éviter les retards.'},
                {icon:'📧',tip:'Vérifiez vos spams — les notifications peuvent y atterrir.'},
                {icon:'🔒',tip:'Ne partagez jamais vos identifiants avec un tiers.'},
                {icon:'📞',tip:'En cas de doute, contactez l\'ANCS avant de soumettre un rapport incomplet.'},
              ].map((t,i) => (
                <div key={i} style={{ display:'flex', gap:12, fontSize:13, color:'#6a8fa8', lineHeight:1.6 }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>{t.icon}</span>{t.tip}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="guide-a3">
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:'#b0cce0', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:14 }}>Questions fréquentes</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {FAQS.map((faq,i) => (
              <div key={i} className="guide-faq-item">
                <button className="guide-faq-q" onClick={() => setOpenFaq(openFaq===i?null:i)}>
                  <span style={{ fontSize:14, fontWeight:600, color:'#c8dff4', fontFamily:"'DM Sans',sans-serif" }}>{faq.q}</span>
                  <span style={{ color:'#1e3a52', fontSize:12, flexShrink:0 }}>{openFaq===i?'▲':'▼'}</span>
                </button>
                {openFaq===i && <div style={{ padding:'0 22px 18px', fontSize:13, color:'#3d607a', lineHeight:1.7 }}>{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop:40, textAlign:'center', fontSize:11, color:'#1e3a52', letterSpacing:'.3px' }}>
          ANCS Platform · Audit de Sécurité des Systèmes d'Information © 2026
        </div>
      </div>
    </div>
  );
}