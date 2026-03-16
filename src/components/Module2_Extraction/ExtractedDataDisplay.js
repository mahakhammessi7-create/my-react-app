import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ExtractedDataDisplay() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const extracted = localStorage.getItem('extractedData');
    if (extracted) setData(JSON.parse(extracted));
    else {
      setData({
        organism_name: "Société de Démonstration", sector: "Finance",
        has_rssi: true, has_pssi: true, maturity_level: 4,
        compliance_score: 86, incidents_count: 5, server_count: 12, user_count: 150
      });
    }
  }, []);

  if (!data) return <div style={styles.empty}>Chargement...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📊 Données extraites</h2>
      <div style={styles.section}>
        <h3>🏢 Entreprise</h3>
        <p><strong>Nom:</strong> {data.organism_name}</p>
        <p><strong>Secteur:</strong> {data.sector}</p>
      </div>
      <div style={styles.section}>
        <h3>🔐 Sécurité</h3>
        <p><strong>RSSI:</strong> {data.has_rssi ? '✅ Présent' : '❌ Non'}</p>
        <p><strong>PSSI:</strong> {data.has_pssi ? '✅ Présent' : '❌ Non'}</p>
        <p><strong>Maturité:</strong> {data.maturity_level}/5</p>
      </div>
      <div style={styles.stats}>
        <div style={styles.statCard}><strong>Score</strong><p>{data.compliance_score}%</p></div>
        <div style={styles.statCard}><strong>Incidents</strong><p>{data.incidents_count}</p></div>
        <div style={styles.statCard}><strong>Serveurs</strong><p>{data.server_count}</p></div>
        <div style={styles.statCard}><strong>Utilisateurs</strong><p>{data.user_count}</p></div>
      </div>
      <div style={styles.buttonGroup}>
        <button onClick={() => navigate('/client/dashboard?tab=upload')} style={styles.uploadButton}>📤 Uploader un autre rapport</button>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  title: { color: '#0B3B5C', borderBottom: '2px solid #0B3B5C', paddingBottom: '10px', marginBottom: '20px' },
  section: { backgroundColor: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '20px' },
  statCard: { padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '5px', textAlign: 'center' },
  empty: { textAlign: 'center', padding: '50px' },
  buttonGroup: { display: 'flex', gap: '10px', justifyContent: 'center' },
  uploadButton: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '5px', cursor: 'pointer' }
};

export default ExtractedDataDisplay;