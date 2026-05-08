import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

const AVATAR_COLORS = ["#0e7490","#1d4ed8","#7c3aed","#be185d","#b45309","#0f766e","#9a3412"];
const avatarColor = name => AVATAR_COLORS[(name || "?").charCodeAt(0) % AVATAR_COLORS.length];

// ── Role helpers ────────────────────────────────────────────────────────────
const ROLE_LABEL = {
  admin:          "Admin",
  administrateur: "Admin",
  charge_etude:   "Chargé d'étude",
  "charge-etude": "Chargé d'étude",
  responsable:    "Responsable",
  resp_suivi:     "Resp. suivi",
  decideur:       "Décideur",
 
};

const ROLE_CLASS = {
  admin:          "role-admin",
  administrateur: "role-admin",
  charge_etude:   "role-charge-etude",
  "charge-etude": "role-charge-etude",
  responsable:    "role-responsable",
  resp_suivi:     "role-responsable",
  decideur:       "role-decideur",
 
};

const normalize = u => ({
  id:       u.id,
  name:     u.full_name || u.username || u.email?.split("@")[0] || "—",
  email:    u.email        || "—",
  role:     u.role         || "_",
  status:   u.status       || "active",
   username: u.username || "—",
 
  phone:    u.phone        || "—",
  lastLogin: u.last_login
    ? new Date(u.last_login).toLocaleDateString("fr-FR")
    : "—",
});

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ user, onClose, onSave }) {
  const isNew = !user.id;
  const [form, setForm] = useState({
    name:     user.name     || "",
    email:    user.email    || "",
    role:     user.role     || "client",
    
    
    phone:    user.phone    || "",
    status:   user.status   || "active",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSave = async () => { setSaving(true); await onSave(form); setSaving(false); };

  return (
    <div className="ancs-overlay">
      <div className="ancs-modal">
        <div className="modal-head">
          <span className="modal-title">{isNew ? "Nouvel utilisateur" : "Modifier l'utilisateur"}</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="form-grid">
          {[["Nom complet","name","text"],["Email","email","email"],["Téléphone","phone","text"]].map(([lbl,k,t])=>(
            <div className="form-group" key={k}>
              <label className="form-label">{lbl}</label>
              <input className="form-input" type={t} value={form[k]} placeholder={lbl} onChange={e=>set(k,e.target.value)} />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Rôle</label>
            <select className="form-input" value={form.role} onChange={e=>set("role",e.target.value)}>
             
              <option value="decideur">Décideur</option>
              <option value="charge_etude">Chargé d'étude</option>
              <option value="resp_suivi">Responsable de suivi</option>
              
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Statut</label>
            <select className="form-input" value={form.status} onChange={e=>set("status",e.target.value)}>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="suspended">Suspendu</option>
            </select>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-cancel" onClick={onClose} disabled={saving}>Annuler</button>
          <button className="btn-confirm" onClick={handleSave} disabled={saving}>{saving?"…":isNew?"Créer":"Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ user, onClose, onConfirm }) {
  return (
    <div className="ancs-overlay">
      <div className="ancs-modal" style={{maxWidth:"420px"}}>
        <div className="modal-head">
          <span className="modal-title">Supprimer l'utilisateur</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <p className="confirm-text">Confirmer la suppression de <strong>{user.name}</strong> ({user.email}) ? Cette action est irréversible.</p>
        <div className="modal-foot">
          <button className="btn-cancel" onClick={onClose}>Annuler</button>
          <button className="btn-danger" onClick={onConfirm}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AdminUtilisateursPage() {
  const navigate = useNavigate();
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState("");
  const [filterRole,   setFilterRole]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editUser,     setEditUser]     = useState(null);
  const [deleteUser,   setDeleteUser]   = useState(null);
  const [toast,        setToast]        = useState(null);

  const showToast = (msg, type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),3000);
  };

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) { navigate('/secure-access'); return; }
    try {
      const u = JSON.parse(user);
      const isAdminUser = (role) => {
        const r = String(role || '').toLowerCase().trim();
        return r === 'admin' || r === 'administrateur';
      };
      if (!isAdminUser(u.role)) navigate('/');
    } catch { navigate('/secure-access'); }
  }, [navigate]);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await API.get("/users");
      const raw = res.data?.data || res.data || [];
      // Exclude expert_auditeur — they live on their own page
      const filtered = raw.filter(u => u.role !== "expert_auditeur");
      setUsers(filtered.map(normalize));
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(()=>{ fetchUsers(); },[fetchUsers]);

  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    return (
      (u.name.toLowerCase().includes(s)||u.email.toLowerCase().includes(s)||u.username.toLowerCase().includes(s)) &&
      (filterRole==="all"||u.role===filterRole) &&
      (filterStatus==="all"||u.status===filterStatus)
    );
  });

  const toggleStatus = async id => {
  const u = users.find(u=>u.id===id);
  const newStatus = u.status==="active"?"inactive":"active";
  await API.patch(`/users/${id}`, {status:newStatus});
  setUsers(p=>p.map(u=>u.id===id?{...u,status:newStatus}:u));
};

 const handleSave = async form => {
  // Builds payload with form data
  const payload = {
    full_name: form.name,
    username: form.username,
    email: form.email,
    role: form.role,
    status: form.status,
    sector: form.sector,
    phone: form.phone,
  };
  if (form.password) payload.password = form.password;

  if (editUser.id) {
    // UPDATE existing user
    await API.patch(`/users/${editUser.id}`, payload);
    setUsers(p=>p.map(u=>u.id===editUser.id?{...u,...form}:u));
  } else {
    // CREATE new user
    const res = await API.post("/users", payload);
    setUsers(p=>[...p, normalize(res.data?.data || res.data)]);
  }
  showToast("Operation successful");
  setEditUser(null);
};

  const handleDelete = async () => {
  try {
    await API.delete(`/users/${deleteUser.id}`);
    setUsers(p=>p.filter(u=>u.id!==deleteUser.id));
    showToast("Utilisateur supprimé","danger");
  } catch (err) { 
    showToast("Erreur lors de la suppression","danger"); 
  }
  setDeleteUser(null);
};

  const stats = [
    {label:"UTILISATEURS INSCRITS", value:users.length,                                           accent:"#22d3ee"},
    {label:"COMPTES ACTIFS",        value:users.filter(u=>u.status==="active").length,            accent:"#4ade80"},
    {label:"ADMINISTRATEURS",       value:users.filter(u=>["admin","administrateur"].includes(u.role)).length, accent:"#fbbf24"},
    {label:"RESPONSABLES",          value:users.filter(u=>["responsable","resp_suivi"].includes(u.role)).length, accent:"#10b981"},
    {label:"CHARGÉS D'ÉTUDE",       value:users.filter(u=>["charge-etude","charge_etude"].includes(u.role)).length, accent:"#8b5cf6"},
    {label:"COMPTES INACTIFS",      value:users.filter(u=>u.status==="inactive").length,          accent:"#f87171"},
  ];

  const handleLogout = () => { localStorage.clear(); navigate('/secure-access'); };

  return (
    <div className="ancs-page">
      <style>{CSS}</style>
      {toast && <div className={`ancs-toast ${toast.type}`}>{toast.msg}</div>}
      {editUser   && <Modal user={editUser} onClose={()=>setEditUser(null)} onSave={handleSave}/>}
      {deleteUser && <DeleteConfirm user={deleteUser} onClose={()=>setDeleteUser(null)} onConfirm={handleDelete}/>}

      {/* ── TOP NAV ── */}
      <nav style={{ height:70, borderBottom:'1px solid #21262d', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', background:'#0d1117', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, background:'linear-gradient(135deg,#22d3ee,#0891b2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, boxShadow:'0 8px 16px rgba(34,211,238,.2)' }}>👥</div>
          <div style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:800, fontSize:17, letterSpacing:'-.5px' }}>ANCS <span style={{ color:'#22d3ee' }}>Utilisateurs</span></div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ textAlign:'right', lineHeight:1.2 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#22d3ee' }}>Administrateur</div>
            <div style={{ fontSize:11, color:'#484f58' }}>Gestion des utilisateurs</div>
          </div>
          <button className="btn-refresh" onClick={handleLogout}>Déconnexion</button>
        </div>
      </nav>

      <div className="page-header">
        <div>
          <p className="page-breadcrumb">ADMINISTRATION · UTILISATEURS</p>
          <h1 className="page-title">Gestion <span className="title-accent">Utilisateurs</span></h1>
          <p className="page-sub">Gérez les comptes clients et administrateurs de la plateforme ANCS.</p>
        </div>
        <button className="btn-refresh" onClick={fetchUsers}>↻ Actualiser</button>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button className="retry-btn" onClick={fetchUsers}>Réessayer</button>
        </div>
      )}

      <div className="kpi-row">
        {stats.map(k=>(
          <div className="kpi-card" key={k.label}>
            <p className="kpi-label">{k.label}</p>
            <p className="kpi-value" style={{color:k.accent}}>{k.value}</p>
            <div className="kpi-bar" style={{background:k.accent}}/>
          </div>
        ))}
      </div>

      <div className="section-card">
        <div className="section-head">
          <div className="section-icon">👥</div>
          <span className="section-title">LISTE DES UTILISATEURS</span>
          <div className="toolbar">
            <input className="search-input" placeholder="Rechercher nom, email, role…" value={search} onChange={e=>setSearch(e.target.value)}/>
            <select className="filter-select" value={filterRole} onChange={e=>setFilterRole(e.target.value)}>
              <option value="all">Tous les rôles</option>
              <option value="administrateur">Admin</option>
              <option value="resp_suivi">Responsable</option>
              <option value="charge_etude">Chargé d'étude</option>
              <option value="decideur">Décideur</option>
              
            </select>
            <select className="filter-select" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="suspended">Suspendus</option>
            </select>
            <button className="btn-add" onClick={()=>setEditUser({})}>+ Nouvel utilisateur</button>
          </div>
        </div>

        {loading ? (
          <div className="loading-row"><div className="spinner"/><span>Chargement…</span></div>
        ) : (
          <table className="ancs-table">
            <thead>
              <tr>{["Utilisateur","Rôle","Statut","Dernière connexion","Actions"].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={7} className="empty-row">Aucun utilisateur trouvé.</td></tr>}
              {filtered.map((u,i)=>(
                <tr key={u.id} className="data-row" style={{animationDelay:`${i*35}ms`}}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar" style={{background:avatarColor(u.name)}}>
                        {u.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="user-name">{u.name}</div>
                        <div className="user-email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  
                  <td><span className={`badge ${ROLE_CLASS[u.role]||"role-client"}`}>{ROLE_LABEL[u.role]||u.role}</span></td>
                  <td><span className={`badge status-${u.status}`}><span className="dot"/>{u.status==="active"?"Actif":u.status==="inactive"?"Inactif":"Suspendu"}</span></td>
                  <td className="cell-date">{u.lastLogin}</td>
                  <td>
                    <div className="row-actions">
                      <button className="act-btn" title="Modifier" onClick={()=>setEditUser(u)}>✏️</button>
                      <button className={`act-btn toggle-${u.status}`} onClick={()=>toggleStatus(u.id)}>{u.status==="active"?"⏸":"▶"}</button>
                      <button className="act-btn act-del" onClick={()=>setDeleteUser(u)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="table-footer">
          {loading?"Chargement…":<>{filtered.length} utilisateur{filtered.length!==1?"s":""} affiché{filtered.length!==1?"s":""}{filtered.length!==users.length&&` sur ${users.length}`}</>}
        </div>
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;500;600&display=swap');
.ancs-page{min-height:100vh;background:#0d1117;color:#c9d1d9;padding:36px 40px;font-family:'Inter',sans-serif;}
.page-header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px;}
.page-breadcrumb{font-size:11px;letter-spacing:.12em;color:#484f58;font-family:'Rajdhani',sans-serif;font-weight:600;margin:0 0 6px;text-transform:uppercase;}
.page-title{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:36px;margin:0;color:#e6edf3;}
.title-accent{color:#22d3ee;}
.page-sub{margin:6px 0 0;font-size:13px;color:#484f58;}
.btn-refresh{background:transparent;border:1px solid #30363d;color:#8b949e;padding:9px 18px;border-radius:6px;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;}
.btn-refresh:hover{border-color:#22d3ee;color:#22d3ee;}
.error-banner{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:10px;padding:12px 20px;margin-bottom:20px;color:#f87171;font-size:13px;display:flex;align-items:center;gap:16px;}
.retry-btn{background:transparent;border:1px solid #f87171;color:#f87171;padding:5px 14px;border-radius:6px;font-size:12px;cursor:pointer;margin-left:auto;}
.loading-row{display:flex;align-items:center;justify-content:center;gap:14px;padding:60px;color:#484f58;}
.spinner{width:22px;height:22px;border:2px solid rgba(34,211,238,.2);border-top-color:#22d3ee;border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
.btn-add{background:transparent;border:1px solid #22d3ee;color:#22d3ee;padding:10px 22px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s,color .15s;font-family:'Inter',sans-serif;white-space:nowrap;}
.btn-add:hover{background:#22d3ee;color:#0d1117;}
.kpi-row{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;margin-bottom:28px;}
.kpi-card{background:#161b22;border:1px solid #21262d;border-radius:10px;padding:22px 24px 16px;}
.kpi-label{font-size:11px;letter-spacing:.1em;color:#8b949e;font-family:'Rajdhani',sans-serif;font-weight:600;margin:0 0 10px;text-transform:uppercase;}
.kpi-value{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:40px;margin:0 0 16px;line-height:1;}
.kpi-bar{height:3px;border-radius:2px;width:36px;}
.section-card{background:#161b22;border:1px solid #21262d;border-radius:10px;}
.section-head{display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid #21262d;background:#161b22;border-radius:10px 10px 0 0;flex-wrap:wrap;}
.section-icon{width:30px;height:30px;background:#21262d;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}
.section-title{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:13px;letter-spacing:.1em;color:#8b949e;flex:1;}
.toolbar{display:flex;gap:10px;align-items:center;margin-left:auto;flex-wrap:wrap;}
.search-input{background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#c9d1d9;padding:8px 14px;font-size:13px;outline:none;width:220px;font-family:'Inter',sans-serif;}
.search-input:focus{border-color:#22d3ee;}
.filter-select{background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#8b949e;padding:8px 12px;font-size:13px;cursor:pointer;outline:none;font-family:'Inter',sans-serif;}
.ancs-table{width:100%;border-collapse:collapse;}
.ancs-table thead tr{background:#0d1117;}
.ancs-table th{padding:12px 20px;text-align:left;font-size:11px;font-weight:600;color:#484f58;letter-spacing:.09em;text-transform:uppercase;font-family:'Rajdhani',sans-serif;border-bottom:1px solid #21262d;}
.data-row{border-bottom:1px solid #1c2128;animation:rowIn .28s ease both;transition:background .12s;}
.data-row:hover{background:rgba(34,211,238,.03);}
.data-row td{padding:14px 20px;font-size:13px;vertical-align:middle;}
.empty-row{text-align:center;color:#484f58;padding:48px !important;font-size:14px;}
@keyframes rowIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.user-cell{display:flex;align-items:center;gap:12px;}
.avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;font-family:'Rajdhani',sans-serif;}
.user-name{font-weight:600;color:#e6edf3;font-size:13px;}
.user-email{font-size:11px;color:#484f58;margin-top:2px;}
.cell-muted{color:#8b949e;font-size:13px;}
.cell-date{color:#484f58;font-family:monospace;font-size:12px;}
.badge{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.04em;font-family:'Rajdhani',sans-serif;}
.role-admin{background:rgba(251,191,36,.1);color:#fbbf24;border:1px solid rgba(251,191,36,.25);}
.role-responsable{background:rgba(16,185,129,.1);color:#10b981;border:1px solid rgba(16,185,129,.2);}
.role-charge-etude{background:rgba(139,92,246,.1);color:#a78bfa;border:1px solid rgba(139,92,246,.2);}
.role-decideur{background:rgba(249,115,22,.1);color:#fb923c;border:1px solid rgba(249,115,22,.2);}
.role-client{background:rgba(34,211,238,.08);color:#22d3ee;border:1px solid rgba(34,211,238,.2);}
.status-active{background:rgba(74,222,128,.08);color:#4ade80;border:1px solid rgba(74,222,128,.2);}
.status-inactive{background:rgba(139,148,158,.08);color:#8b949e;border:1px solid rgba(139,148,158,.2);}
.status-suspended{background:rgba(251,191,36,.08);color:#fbbf24;border:1px solid rgba(251,191,36,.2);}
.dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;background:currentColor;}
.row-actions{display:flex;gap:4px;}
.act-btn{background:transparent;border:none;cursor:pointer;padding:5px 7px;border-radius:5px;font-size:13px;transition:background .12s;color:#8b949e;}
.act-btn:hover{background:#21262d;}
.act-del:hover{background:rgba(248,113,113,.12)!important;}
.toggle-inactive{color:#4ade80!important;}
.toggle-active{color:#fbbf24!important;}
.table-footer{padding:14px 24px;font-size:12px;color:#484f58;border-top:1px solid #21262d;text-align:right;}
.ancs-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;}
.ancs-modal{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:28px;width:100%;max-width:520px;box-shadow:0 20px 60px rgba(0,0,0,.6);}
.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;}
.modal-title{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:18px;color:#e6edf3;}
.close-btn{background:none;border:none;color:#484f58;cursor:pointer;font-size:16px;padding:4px;}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 20px;margin-bottom:24px;}
.form-group{display:flex;flex-direction:column;gap:6px;}
.form-label{font-size:11px;font-weight:600;color:#8b949e;letter-spacing:.08em;text-transform:uppercase;font-family:'Rajdhani',sans-serif;}
.form-input{background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;padding:9px 12px;font-size:13px;outline:none;font-family:'Inter',sans-serif;transition:border-color .15s;}
.form-input:focus{border-color:#22d3ee;}
.modal-foot{display:flex;justify-content:flex-end;gap:10px;}
.btn-cancel{background:transparent;border:1px solid #30363d;border-radius:6px;color:#8b949e;padding:9px 20px;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;}
.btn-confirm{background:transparent;border:1px solid #22d3ee;color:#22d3ee;border-radius:6px;padding:9px 24px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:background .15s,color .15s;}
.btn-confirm:hover{background:#22d3ee;color:#0d1117;}
.btn-danger{background:transparent;border:1px solid #f87171;color:#f87171;border-radius:6px;padding:9px 24px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;}
.btn-danger:hover{background:#f87171;color:#0d1117;}
.confirm-text{color:#8b949e;line-height:1.6;margin:8px 0 24px;font-size:14px;}
.confirm-text strong{color:#e6edf3;}
.ancs-toast{position:fixed;bottom:28px;right:28px;background:#22d3ee;color:#0d1117;padding:11px 22px;border-radius:8px;font-size:13px;font-weight:600;z-index:2000;box-shadow:0 8px 28px rgba(0,0,0,.4);animation:fadeSlide .22s ease;font-family:'Rajdhani',sans-serif;}
.ancs-toast.danger{background:#f87171;}
@keyframes fadeSlide{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
`;
