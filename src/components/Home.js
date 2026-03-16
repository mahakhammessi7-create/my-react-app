function Home() {
  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: '#0B3B5C', textAlign: 'center' }}>
        Analyse Intelligente des Rapports d'Audit
      </h1>
      <p style={{ textAlign: 'center', fontSize: '18px', color: '#666', marginBottom: '40px' }}>
        Projet de Fin d'Études - ANCS
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        <ModuleCard 
          number="1"
          title="Vérification de Conformité"
          description="Vérifie que les rapports respectent le modèle ANCS"
          color="#0B3B5C"
        />
        <ModuleCard 
          number="2"
          title="Extraction de Données"
          description="Extrait automatiquement les informations"
          color="#28a745"
        />
        <ModuleCard 
          number="3"
          title="Analyse et Tableaux de Bord"
          description="Génère des statistiques et graphiques"
          color="#dc3545"
        />
      </div>
    </div>
  );
}

function ModuleCard({ number, title, description, color }) {
  return (
    <div style={{
      padding: '20px',
      border: `1px solid ${color}`,
      borderRadius: '10px',
      textAlign: 'center'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        backgroundColor: color,
        color: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        margin: '0 auto 15px'
      }}>
        {number}
      </div>
      <h3 style={{ color }}>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default Home;