// src/components/FileUpload.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setStatus('❌ Veuillez sélectionner un fichier PDF');
        return;
      }
      setFile(selectedFile);
      setStatus(`📄 Fichier sélectionné: ${selectedFile.name}`);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus('❌ Veuillez sélectionner un fichier PDF');
      return;
    }

    setUploading(true);
    setStatus('📤 Envoi vers le serveur...');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      console.log('📤 Envoi du fichier:', file.name);
      
      const response = await fetch('http://localhost:8000/api/ancs/parse', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      console.log('📥 Réponse reçue:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erreur serveur (${response.status})`);
      }

      const result = await response.json();
      console.log('✅ Résultat:', result);
      
      setStatus(`✅ Analyse terminée ! Score: ${result.compliance_score}%`);
      
      // Sauvegarder les données
      localStorage.setItem('extractedData', JSON.stringify(result.data));
      localStorage.setItem('auditId', result.audit_id);
      localStorage.setItem('complianceScore', result.compliance_score);
      
      // Redirection après 2 secondes
      setTimeout(() => {
        navigate('/client/extracted-data', {
          state: { 
            score: result.compliance_score,
            orgName: result.summary?.organization || 'Tunisie Telecom',
            auditId: result.audit_id
          }
        });
      }, 2000);

    } catch (err) {
      console.error('❌ Erreur upload:', err);
      setStatus(`❌ ${err.message}. Vérifiez que le serveur backend est démarré sur http://localhost:8000`);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📋 Upload de rapport d'audit</h2>
        <p style={styles.subtitle}>Déposez votre rapport ANCS au format PDF</p>
      </div>
      
      <div style={styles.uploadZone}>
        <input 
          type="file" 
          accept=".pdf"
          onChange={handleFileChange}
          disabled={uploading}
          style={styles.fileInput}
          id="file-upload"
        />
        <label htmlFor="file-upload" style={styles.fileLabel}>
          <div style={styles.folderIcon}>📁</div>
          <p style={styles.fileLabelText}>
            {file ? file.name : 'Glissez votre rapport ici'}
          </p>
          <p style={styles.fileSubtext}>ou cliquez pour sélectionner</p>
          <div style={styles.formatBadges}>
            <span style={styles.badge}>PDF</span>
            <span style={styles.badgeDisabled}>DOCX</span>
          </div>
        </label>
      </div>

      {progress > 0 && (
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div style={{...styles.progressFill, width: `${progress}%`}} />
          </div>
          <p style={styles.progressText}>{progress}%</p>
        </div>
      )}
      
      <button 
        onClick={handleUpload}
        disabled={!file || uploading}
        style={{
          ...styles.uploadButton,
          opacity: (!file || uploading) ? 0.5 : 1,
          cursor: (!file || uploading) ? 'not-allowed' : 'pointer'
        }}
      >
        {uploading ? (
          <>
            <span style={styles.spinner}>⏳</span>
            Analyse en cours...
          </>
        ) : (
          <>
            <span>🔍</span>
            Vérifier la conformité
          </>
        )}
      </button>
      
      {status && (
        <div style={{
          ...styles.status,
          backgroundColor: status.includes('✅') ? 'rgba(40, 167, 69, 0.1)' : 
                          status.includes('❌') ? 'rgba(220, 53, 69, 0.1)' : 
                          'rgba(11, 59, 92, 0.1)',
          color: status.includes('✅') ? '#28a745' : 
                 status.includes('❌') ? '#dc3545' : '#0B3B5C'
        }}>
          {status}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '30px',
    maxWidth: '700px',
    margin: '0 auto'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    color: '#fff',
    fontSize: '24px',
    marginBottom: '8px'
  },
  subtitle: {
    color: '#8892b0',
    fontSize: '14px'
  },
  uploadZone: {
    border: '2px dashed #233554',
    borderRadius: '12px',
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: 'rgba(35, 53, 84, 0.3)',
    marginBottom: '20px',
    transition: 'border-color 0.3s'
  },
  fileInput: {
    display: 'none'
  },
  fileLabel: {
    cursor: 'pointer',
    display: 'block'
  },
  folderIcon: {
    fontSize: '48px',
    marginBottom: '15px'
  },
  fileLabelText: {
    color: '#ccd6f6',
    fontSize: '16px',
    marginBottom: '5px'
  },
  fileSubtext: {
    color: '#8892b0',
    fontSize: '13px',
    marginBottom: '15px'
  },
  formatBadges: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center'
  },
  badge: {
    padding: '5px 15px',
    backgroundColor: '#0B3B5C',
    color: '#fff',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  badgeDisabled: {
    padding: '5px 15px',
    backgroundColor: '#233554',
    color: '#8892b0',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  progressContainer: {
    marginBottom: '20px'
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#233554',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0B3B5C',
    transition: 'width 0.3s ease'
  },
  progressText: {
    textAlign: 'center',
    color: '#8892b0',
    fontSize: '12px',
    marginTop: '5px'
  },
  uploadButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#0B3B5C',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px'
  },
  spinner: {
    animation: 'spin 1s linear infinite'
  },
  status: {
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: '14px'
  }
};

export default FileUpload;