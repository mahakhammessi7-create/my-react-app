import { useState } from 'react';
import API from '../services/api';

function SimpleUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await API.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📤 Upload de rapport</h2>
      <input type="file" onChange={handleFileChange} accept=".pdf" />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Upload...' : 'Upload'}
      </button>
      
      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>📊 Données extraites automatiquement :</h3>
          <pre>{JSON.stringify(result.extractedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default SimpleUpload;