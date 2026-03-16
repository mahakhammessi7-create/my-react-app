import { useState } from 'react';
import ComplianceChecker from './ComplianceChecker';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showChecker, setShowChecker] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [validationDone, setValidationDone] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setShowChecker(false);
    setValidationDone(false);
    setUploadStatus('');
  };

  const handleUpload = () => {
    if (!file) {
      setUploadStatus('Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);
    setUploadStatus('Upload en cours...');

    // Simuler un upload
    setTimeout(() => {
      const testData = {
        company: {
          name: user?.company_name || "Société Nationale de Développement Financier",
          sector: user?.sector || "Bancaire",
        },
        kpis: {
          conformes: 28,
          total: 45,
          risquesCritiques: 2,
          serveursAudites: 4,
          serveursTotal: 5,
        },
        scoresParDomaine: [
          { domaine: "Organisation", score: 80 },
          { domaine: "Continuité", score: 67 },
          { domaine: "Sauvegardes", score: 50 },
          { domaine: "Contrôle accès", score: 86 },
        ]
      };
      
      localStorage.setItem('extractedData', JSON.stringify(testData));
      setUploadStatus('✅ Analyse terminée!');
      setValidationResults({ global: { compliant: true, score: 86 } });
      setValidationDone(true);
      setUploading(false);
    }, 2000);
  };

  const handleComplianceResult = (results) => {
    setValidationResults(results);
    setValidationDone(true);
    localStorage.setItem('validationResults', JSON.stringify(results));
  };

  // 🔴 VOICI LA FONCTION À AJOUTER SI ELLE N'EXISTE PAS
  const goToAnalysis = () => {
    console.log('🔄 Redirection vers analyse');
    window.location.href = '/client/dashboard?tab=analyse';
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Module 1: Vérification de Conformité</h2>
      
      <div style={styles.uploadZone}>
        <input 
          type="file" 
          onChange={handleFileChange} 
          accept=".pdf,.docx" 
          style={styles.fileInput} 
          disabled={validationDone || uploading}
        />
        <br />
        
        <button 
          onClick={handleUpload}
          disabled={!file || uploading}
          style={uploadButtonStyle(!file || uploading)}
        >
          {uploading ? 'Upload en cours...' : '📤 Upload et analyser'}
        </button>

        <button 
          onClick={() => setShowChecker(true)}
          disabled={!file || uploading}
          style={checkButtonStyle(!file || uploading)}
        >
          Vérifier la conformité
        </button>
        
        {uploadStatus && (
          <p style={uploadStatus.includes('✅') ? styles.success : styles.error}>
            {uploadStatus}
          </p>
        )}
      </div>

      {showChecker && file && !validationDone && (
        <ComplianceChecker 
          file={file} 
          onComplianceResult={handleComplianceResult}
        />
      )}

      {validationDone && (
        <div style={styles.resultBox}>
          <h3 style={{ color: '#155724' }}>✅ Rapport CONFORME</h3>
          <p style={styles.scoreText}>Score: 86%</p>
          <button 
            onClick={goToAnalysis}  // 🔴 LE BOUTON UTILISE LA FONCTION
            style={styles.analysisButton}
          >
            📊 Voir les données extraites
          </button>
        </div>
      )}
    </div>
  );
}

const uploadButtonStyle = (disabled) => ({
  backgroundColor: disabled ? '#ccc' : '#28a745',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '5px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: '16px',
  fontWeight: 'bold',
  marginRight: '10px'
});

const checkButtonStyle = (disabled) => ({
  backgroundColor: disabled ? '#ccc' : '#0B3B5C',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '5px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: '16px',
  fontWeight: 'bold'
});

const styles = {
  container: { 
    padding: '20px', 
    maxWidth: '800px', 
    margin: '0 auto' 
  },
  title: { 
    color: '#0B3B5C', 
    borderBottom: '2px solid #0B3B5C', 
    paddingBottom: '10px' 
  },
  uploadZone: {
    border: '2px dashed #0B3B5C',
    padding: '30px',
    textAlign: 'center',
    borderRadius: '10px',
    backgroundColor: '#f8f9fa',
    margin: '20px 0'
  },
  fileInput: { 
    marginBottom: '20px' 
  },
  success: { 
    color: '#28a745', 
    marginTop: '10px',
    fontWeight: 'bold'
  },
  error: { 
    color: '#dc3545', 
    marginTop: '10px' 
  },
  resultBox: {
    padding: '20px',
    backgroundColor: '#d4edda',
    borderRadius: '10px',
    textAlign: 'center',
    marginTop: '20px',
    border: '1px solid #c3e6cb'
  },
  scoreText: {
    fontSize: '18px',
    color: '#155724',
    marginBottom: '15px'
  },
  analysisButton: {
    backgroundColor: '#0B3B5C',
    color: 'white',
    border: 'none',
    padding: '12px 25px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  }
};

export default FileUpload;