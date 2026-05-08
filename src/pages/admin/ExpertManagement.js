import { useState, useEffect, useCallback } from "react";
import API from "../../services/api";

const AVATAR_COLORS = ["#0e7490","#1d4ed8","#7c3aed","#be185d","#b45309","#0f766e","#9a3412"];
const avatarColor = name => AVATAR_COLORS[(name || "?").charCodeAt(0) % AVATAR_COLORS.length];

const normalize = u => ({
  id:       u.id,
  name:     u.full_name || u.username || u.email?.split("@")[0] || "—",
  email:    u.email        || "—",
  role:     "expert_auditeur",
  status:   u.status       || "active",
  organism: u.company_name || u.organism_name || "—",
  sector:   u.sector       || u.organism_sector || "—",
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
    organism: user.organism || "",
    sector:   user.sector   || "",
    phone:    user.phone    || "",
    status:   user.status   || "active",
     password: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSave = async () => { setSaving(true); await onSave(form); setSaving(false); };

  return (
    <div className="exp-overlay">
      <div className="exp-modal">
        <div className="modal-head">
          <span className="modal-title">{isNew ? "Nouvel expert auditeur" : "Modifier l'expert"}</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="form-grid">
          {[["Nom complet","name","text"],["Email","email","email"],["Organisme","organism","text"],["Secteur","sector","text"],["Téléphone","phone","text"]].map(([lbl,k,t])=>(
            <div className="form-group" key={k}>
              <label className="form-label">{lbl}</label>
              <input className="form-input" type={t} value={form[k]} placeholder={lbl} onChange={e=>set(k,e.target.value)} />
            </div>
          ))}{/* ← Nouveau : mot de passe uniquement à la création */}
          {isNew && (
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input className="form-input" type="password" value={form.password}
                placeholder="Mot de passe" onChange={e=>set("password",e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Statut</label>
            <select className="form-input" value={form.status} onChange={e=>set("status",e.target.value)}>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="suspended">Suspendu</option>
            </select>
          </div>
        </div>
        <p className="role-note">🔒 Rôle fixé : <strong>Expert auditeur</strong></p>
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
    <div className="exp-overlay">
      <div className="exp-modal" style={{maxWidth:"420px"}}>
        <div className="modal-head">
          <span className="modal-title">Supprimer l'expert</span>
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
export default function ExpertManagement() {
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSector, setFilterSector] = useState("all");
  const [editUser,     setEditUser]     = useState(null);
  const [deleteUser,   setDeleteUser]   = useState(null);
  const [toast,        setToast]        = useState(null);

  const showToast = (msg, type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await API.get("/users");
      const raw = res.data?.data || res.data || [];
      // Only expert_auditeur role
      const experts = raw.filter(u => u.role === "expert_auditeur");
      setUsers(experts.map(normalize));
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les experts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(()=>{ fetchUsers(); },[fetchUsers]);

  // Unique sectors derived from data (excluding "—")
  const sectors = [...new Set(users.map(u=>u.sector).filter(s=>s&&s!=="—"))].sort();

  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    return (
      (u.name.toLowerCase().includes(s)||u.email.toLowerCase().includes(s)||u.organism.toLowerCase().includes(s)) &&
      (filterStatus==="all"||u.status===filterStatus) &&
      (filterSector==="all"||u.sector===filterSector)
    );
  });

  const toggleStatus = async id => {
  const u = users.find(u=>u.id===id);
  const newStatus = u.status==="active"?"inactive":"active";
  await API.patch(`/users/${id}`, {status:newStatus});
  setUsers(p=>p.map(u=>u.id===id?{...u,status:newStatus}:u));
};

// Add better error logging to handleSave
const handleSave = async form => {
  try {
    const payload = {
      full_name:    form.name,
      email:        form.email,
      role:         "expert_auditeur",   // ← fixé, pas depuis form.role
      status:       form.status,
      company_name: form.organism,
      sector:       form.sector,
      phone:        form.phone,
    };
    if (form.password) payload.password = form.password;

    if (editUser.id) {
      await API.patch(`/users/${editUser.id}`, payload);
      setUsers(p=>p.map(u=>u.id===editUser.id?{...u,...form}:u));
      showToast("Expert modifié");
    } else {
      if (!form.password) {
        showToast("Le mot de passe est requis","danger");
        return;
      }
      const res = await API.post("/users", payload);
      setUsers(p=>[...p, normalize(res.data?.data||res.data)]);
      showToast("Expert créé");
    }
  } catch (err) {
    console.error(err);
    showToast("Erreur lors de la sauvegarde","danger");
  }
  setEditUser(null);
};

  const handleDelete = async () => {
    try {
      await API.delete(`/users/${deleteUser.id}`);
      setUsers(p=>p.filter(u=>u.id!==deleteUser.id));
      showToast("Expert supprimé","danger");
    } catch { showToast("Erreur","danger"); }
    setDeleteUser(null);
  };

  const stats = [
    {label:"TOTAL EXPERTS",    value:users.length,                                          accent:"#8b5cf6"},
    {label:"EXPERTS ACTIFS",   value:users.filter(u=>u.status==="active").length,           accent:"#4ade80"},
    {label:"EXPERTS INACTIFS", value:users.filter(u=>u.status==="inactive").length,         accent:"#f87171"},
    {label:"SECTEURS COUVERTS",value:sectors.length,                                        accent:"#22d3ee"},
  ];

  return (
    <div className="exp-page">
      <style>{CSS}</style>
      {toast && <div className={`exp-toast ${toast.type}`}>{toast.msg}</div>}
      {editUser   && <Modal user={editUser} onClose={()=>setEditUser(null)} onSave={handleSave}/>}
      {deleteUser && <DeleteConfirm user={deleteUser} onClose={()=>setDeleteUser(null)} onConfirm={handleDelete}/>}

      <div className="page-header">
        <div>
          <p className="page-breadcrumb">ADMINISTRATION · EXPERTS</p>
          <h1 className="page-title">Gestion des <span className="title-accent">Experts Auditeurs</span></h1>
          <p className="page-sub">Gérez les experts auditeurs habilités sur la plateforme ANCS.</p>
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
          <div className="section-icon">🎓</div>
          <span className="section-title">LISTE DES EXPERTS AUDITEURS</span>
          <div className="toolbar">
            <input className="search-input" placeholder="Rechercher nom, email, organisme…" value={search} onChange={e=>setSearch(e.target.value)}/>
            <select className="filter-select" value={filterSector} onChange={e=>setFilterSector(e.target.value)}>
              <option value="all">Tous les secteurs</option>
              {sectors.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <select className="filter-select" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="suspended">Suspendus</option>
            </select>
            <button className="btn-add" onClick={()=>setEditUser({})}>+ Nouvel expert</button>
          </div>
        </div>

        {loading ? (
          <div className="loading-row"><div className="spinner"/><span>Chargement…</span></div>
        ) : (
          <table className="exp-table">
            <thead>
              <tr>{["Expert auditeur","Organisme","Secteur","Statut","Dernière connexion","Actions"].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length===0 && <tr><td colSpan={6} className="empty-row">Aucun expert trouvé.</td></tr>}
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
                  <td className="cell-muted">{u.organism}</td>
                  <td className="cell-muted">{u.sector}</td>
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
          {loading?"Chargement…":<>{filtered.length} expert{filtered.length!==1?"s":""} affiché{filtered.length!==1?"s":""}{filtered.length!==users.length&&` sur ${users.length}`}</>}
        </div>
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;500;600&display=swap');
.exp-page{min-height:100vh;background:#0d1117;color:#c9d1d9;padding:36px 40px;font-family:'Inter',sans-serif;}
.page-header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px;}
.page-breadcrumb{font-size:11px;letter-spacing:.12em;color:#484f58;font-family:'Rajdhani',sans-serif;font-weight:600;margin:0 0 6px;text-transform:uppercase;}
.page-title{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:36px;margin:0;color:#e6edf3;}
.title-accent{color:#8b5cf6;}
.page-sub{margin:6px 0 0;font-size:13px;color:#484f58;}
.btn-refresh{background:transparent;border:1px solid #30363d;color:#8b949e;padding:9px 18px;border-radius:6px;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;}
.btn-refresh:hover{border-color:#8b5cf6;color:#8b5cf6;}
.error-banner{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:10px;padding:12px 20px;margin-bottom:20px;color:#f87171;font-size:13px;display:flex;align-items:center;gap:16px;}
.retry-btn{background:transparent;border:1px solid #f87171;color:#f87171;padding:5px 14px;border-radius:6px;font-size:12px;cursor:pointer;margin-left:auto;}
.loading-row{display:flex;align-items:center;justify-content:center;gap:14px;padding:60px;color:#484f58;}
.spinner{width:22px;height:22px;border:2px solid rgba(139,92,246,.2);border-top-color:#8b5cf6;border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
.btn-add{background:transparent;border:1px solid #8b5cf6;color:#8b5cf6;padding:10px 22px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s,color .15s;font-family:'Inter',sans-serif;white-space:nowrap;}
.btn-add:hover{background:#8b5cf6;color:#0d1117;}
.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;}
.kpi-card{background:#161b22;border:1px solid #21262d;border-radius:10px;padding:22px 24px 16px;}
.kpi-label{font-size:11px;letter-spacing:.1em;color:#8b949e;font-family:'Rajdhani',sans-serif;font-weight:600;margin:0 0 10px;text-transform:uppercase;}
.kpi-value{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:44px;margin:0 0 16px;line-height:1;}
.kpi-bar{height:3px;border-radius:2px;width:36px;}
.section-card{background:#161b22;border:1px solid #21262d;border-radius:10px;}
.section-head{display:flex;align-items:center;gap:12px;padding:18px 24px;border-bottom:1px solid #21262d;background:#161b22;border-radius:10px 10px 0 0;flex-wrap:wrap;}
.section-icon{width:30px;height:30px;background:#21262d;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}
.section-title{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:13px;letter-spacing:.1em;color:#8b949e;flex:1;}
.toolbar{display:flex;gap:10px;align-items:center;margin-left:auto;flex-wrap:wrap;}
.search-input{background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#c9d1d9;padding:8px 14px;font-size:13px;outline:none;width:220px;font-family:'Inter',sans-serif;}
.search-input:focus{border-color:#8b5cf6;}
.filter-select{background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#8b949e;padding:8px 12px;font-size:13px;cursor:pointer;outline:none;font-family:'Inter',sans-serif;}
.exp-table{width:100%;border-collapse:collapse;}
.exp-table thead tr{background:#0d1117;}
.exp-table th{padding:12px 20px;text-align:left;font-size:11px;font-weight:600;color:#484f58;letter-spacing:.09em;text-transform:uppercase;font-family:'Rajdhani',sans-serif;border-bottom:1px solid #21262d;}
.data-row{border-bottom:1px solid #1c2128;animation:rowIn .28s ease both;transition:background .12s;}
.data-row:hover{background:rgba(139,92,246,.03);}
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
.exp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;}
.exp-modal{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:28px;width:100%;max-width:520px;box-shadow:0 20px 60px rgba(0,0,0,.6);}
.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;}
.modal-title{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:18px;color:#e6edf3;}
.close-btn{background:none;border:none;color:#484f58;cursor:pointer;font-size:16px;padding:4px;}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 20px;margin-bottom:16px;}
.form-group{display:flex;flex-direction:column;gap:6px;}
.form-label{font-size:11px;font-weight:600;color:#8b949e;letter-spacing:.08em;text-transform:uppercase;font-family:'Rajdhani',sans-serif;}
.form-input{background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;padding:9px 12px;font-size:13px;outline:none;font-family:'Inter',sans-serif;transition:border-color .15s;}
.form-input:focus{border-color:#8b5cf6;}
.role-note{font-size:12px;color:#484f58;margin:0 0 20px;padding:8px 12px;background:rgba(139,92,246,.06);border:1px solid rgba(139,92,246,.15);border-radius:6px;}
.role-note strong{color:#a78bfa;}
.modal-foot{display:flex;justify-content:flex-end;gap:10px;}
.btn-cancel{background:transparent;border:1px solid #30363d;border-radius:6px;color:#8b949e;padding:9px 20px;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;}
.btn-confirm{background:transparent;border:1px solid #8b5cf6;color:#8b5cf6;border-radius:6px;padding:9px 24px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:background .15s,color .15s;}
.btn-confirm:hover{background:#8b5cf6;color:#0d1117;}
.btn-danger{background:transparent;border:1px solid #f87171;color:#f87171;border-radius:6px;padding:9px 24px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;}
.btn-danger:hover{background:#f87171;color:#0d1117;}
.confirm-text{color:#8b949e;line-height:1.6;margin:8px 0 24px;font-size:14px;}
.confirm-text strong{color:#e6edf3;}
.exp-toast{position:fixed;bottom:28px;right:28px;background:#8b5cf6;color:#fff;padding:11px 22px;border-radius:8px;font-size:13px;font-weight:600;z-index:2000;box-shadow:0 8px 28px rgba(0,0,0,.4);animation:fadeSlide .22s ease;font-family:'Rajdhani',sans-serif;}
.exp-toast.danger{background:#f87171;}
@keyframes fadeSlide{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
`;
