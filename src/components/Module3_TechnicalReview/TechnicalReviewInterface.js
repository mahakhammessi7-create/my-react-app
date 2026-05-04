import React, { useState, useMemo } from 'react';
import './TechnicalReviewInterface.css';

const TechnicalReviewInterface = () => {
  // Mock audit data
  const mockAuditData = {
    id: 'audit-001',
    name: 'Audit de Conformité - Société Finance',
    organization: 'Société de Démonstration',
    extractedAt: new Date('2026-05-03'),
    fields: [
      { id: 'f1', label: 'Nom de l\'organisme', value: 'Société de Démonstration', category: 'Général', confidence: 95, status: 'verified' },
      { id: 'f2', label: 'Secteur d\'activité', value: 'Finance', category: 'Général', confidence: 90, status: 'verified' },
      { id: 'f3', label: 'RSSI présent', value: true, category: 'Gouvernance', confidence: 85, status: 'needs-review' },
      { id: 'f4', label: 'PSSI documenté', value: true, category: 'Gouvernance', confidence: 78, status: 'needs-review' },
      { id: 'f5', label: 'Niveau de maturité', value: 4, category: 'Gouvernance', confidence: 72, status: 'needs-review' },
      { id: 'f6', label: 'Score de conformité', value: 86, category: 'Évaluation', confidence: 88, status: 'verified' },
      { id: 'f7', label: 'Nombre d\'incidents', value: 5, category: 'Incidents', confidence: 65, status: 'needs-review' },
      { id: 'f8', label: 'Nombre de serveurs', value: 12, category: 'Infrastructure', confidence: 92, status: 'verified' },
      { id: 'f9', label: 'Nombre d\'utilisateurs', value: 150, category: 'Infrastructure', confidence: 88, status: 'verified' },
      { id: 'f10', label: 'Contrôle d\'accès', value: 'AD, FortiGate, VLAN, Bastion SSH, MFR', category: 'Sécurité', confidence: 82, status: 'corrected' },
    ],
    annotations: [
      { id: 'a1', fieldId: 'f3', author: 'Jean Dupont', text: 'RSSI confirmé par entretien direct', timestamp: new Date('2026-05-03T10:30:00'), type: 'comment' },
      { id: 'a2', fieldId: 'f7', author: 'Marie Martin', text: 'À vérifier avec le registre des incidents de 2025', timestamp: new Date('2026-05-03T11:15:00'), type: 'flag' },
    ],
  };

  const [auditData, setAuditData] = useState(mockAuditData);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [annotationText, setAnnotationText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Group fields by category
  const groupedFields = useMemo(() => {
    const grouped = {};
    auditData.fields.forEach((field) => {
      if (!grouped[field.category]) {
        grouped[field.category] = [];
      }
      grouped[field.category].push(field);
    });
    return grouped;
  }, [auditData.fields]);

  // Filter fields based on status
  const filteredFields = useMemo(() => {
    const filtered = {};
    Object.entries(groupedFields).forEach(([category, fields]) => {
      const categoryFields = filterStatus === 'all' ? fields : fields.filter((f) => f.status === filterStatus);
      if (categoryFields.length > 0) {
        filtered[category] = categoryFields;
      }
    });
    return filtered;
  }, [groupedFields, filterStatus]);

  // Get annotations for a field
  const getFieldAnnotations = (fieldId) => auditData.annotations.filter((a) => a.fieldId === fieldId);

  // Handle field editing
  const startEdit = (field) => {
    setEditingFieldId(field.id);
    setEditValue(String(field.value));
  };

  const saveEdit = (fieldId) => {
    const field = auditData.fields.find((f) => f.id === fieldId);
    if (field) {
      const updatedFields = auditData.fields.map((f) =>
        f.id === fieldId ? { ...f, value: editValue, status: 'corrected' } : f
      );
      setAuditData({ ...auditData, fields: updatedFields });
      setEditingFieldId(null);
      alert('Champ mis à jour');
    }
  };

  const cancelEdit = () => {
    setEditingFieldId(null);
    setEditValue('');
  };

  // Handle status change
  const updateFieldStatus = (fieldId, newStatus) => {
    const updatedFields = auditData.fields.map((f) => (f.id === fieldId ? { ...f, status: newStatus } : f));
    setAuditData({ ...auditData, fields: updatedFields });
    alert(`Statut mis à jour: ${newStatus}`);
  };

  // Handle annotation
  const addAnnotation = (fieldId) => {
    if (!annotationText.trim()) return;
    const newAnnotation = {
      id: `a${Date.now()}`,
      fieldId,
      author: 'Chargé d\'étude',
      text: annotationText,
      timestamp: new Date(),
      type: 'comment',
    };
    setAuditData({
      ...auditData,
      annotations: [...auditData.annotations, newAnnotation],
    });
    setAnnotationText('');
    alert('Annotation ajoutée');
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = auditData.fields.length;
    const verified = auditData.fields.filter((f) => f.status === 'verified').length;
    const needsReview = auditData.fields.filter((f) => f.status === 'needs-review').length;
    const corrected = auditData.fields.filter((f) => f.status === 'corrected').length;
    const avgConfidence = Math.round(
      auditData.fields.reduce((sum, f) => sum + (f.confidence || 0), 0) / total
    );
    return { total, verified, needsReview, corrected, avgConfidence };
  }, [auditData.fields]);

  return (
    <div className="technical-review-container">
      {/* Header */}
      <div className="tri-header">
        <h1>Interface de Révision Technique</h1>
        <p>Vérifiez, corrigez et annotez les données extraites</p>
      </div>

      {/* Report Info */}
      <div className="tri-report-info">
        <div>
          <h2>{auditData.name}</h2>
          <p className="tri-organization">{auditData.organization}</p>
        </div>
        <span className="tri-date">{auditData.extractedAt.toLocaleDateString('fr-FR')}</span>
      </div>

      {/* Statistics */}
      <div className="tri-stats-grid">
        <div className="tri-stat-card">
          <p className="tri-stat-value">{stats.total}</p>
          <p className="tri-stat-label">Champs totaux</p>
        </div>
        <div className="tri-stat-card">
          <p className="tri-stat-value" style={{ color: '#4ade80' }}>{stats.verified}</p>
          <p className="tri-stat-label">Vérifiés</p>
        </div>
        <div className="tri-stat-card">
          <p className="tri-stat-value" style={{ color: '#fbbf24' }}>{stats.needsReview}</p>
          <p className="tri-stat-label">À réviser</p>
        </div>
        <div className="tri-stat-card">
          <p className="tri-stat-value" style={{ color: '#38bdf8' }}>{stats.corrected}</p>
          <p className="tri-stat-label">Corrigés</p>
        </div>
        <div className="tri-stat-card">
          <p className="tri-stat-value" style={{ color: '#63d2be' }}>{stats.avgConfidence}%</p>
          <p className="tri-stat-label">Confiance moy.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="tri-filters">
        {['all', 'verified', 'needs-review', 'corrected'].map((status) => (
          <button
            key={status}
            className={`tri-filter-btn ${filterStatus === status ? 'active' : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {status === 'all' ? 'Tous' : status === 'verified' ? 'Vérifiés' : status === 'needs-review' ? 'À réviser' : 'Corrigés'}
          </button>
        ))}
      </div>

      {/* Data Fields */}
      <div className="tri-fields-container">
        {Object.entries(filteredFields).map(([category, fields]) => (
          <div key={category} className="tri-category-section">
            <h3 className="tri-category-title">{category}</h3>
            <div className="tri-fields-list">
              {fields.map((field) => {
                const annotations = getFieldAnnotations(field.id);
                const isEditing = editingFieldId === field.id;
                const isSelected = selectedFieldId === field.id;

                return (
                  <div key={field.id} className="tri-field-wrapper">
                    <div
                      className={`tri-field-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedFieldId(isSelected ? null : field.id)}
                    >
                      <div className="tri-field-content">
                        <div className="tri-field-header">
                          <label className="tri-field-label">{field.label}</label>
                          <span className={`tri-status-badge status-${field.status}`}>
                            {field.status === 'verified' ? '✓ Vérifié' : field.status === 'needs-review' ? '⚠ À réviser' : '✎ Corrigé'}
                          </span>
                          {field.confidence && (
                            <span className="tri-confidence">Confiance: {field.confidence}%</span>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="tri-edit-group">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="tri-edit-input"
                              autoFocus
                            />
                            <button onClick={() => saveEdit(field.id)} className="tri-btn-save">
                              💾 Enregistrer
                            </button>
                            <button onClick={cancelEdit} className="tri-btn-cancel">
                              ✕ Annuler
                            </button>
                          </div>
                        ) : (
                          <div className="tri-field-value-group">
                            <span className="tri-field-value">
                              {typeof field.value === 'boolean' ? (field.value ? '✓ Oui' : '✗ Non') : field.value}
                            </span>
                            <button onClick={() => startEdit(field)} className="tri-btn-edit" title="Modifier">
                              ✎
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="tri-field-actions">
                        {field.status !== 'verified' && (
                          <button
                            onClick={() => updateFieldStatus(field.id, 'verified')}
                            className="tri-btn-action tri-btn-verify"
                            title="Marquer comme vérifié"
                          >
                            ✓
                          </button>
                        )}
                        {field.status !== 'needs-review' && (
                          <button
                            onClick={() => updateFieldStatus(field.id, 'needs-review')}
                            className="tri-btn-action tri-btn-review"
                            title="Marquer pour révision"
                          >
                            ⚠
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Annotations Section */}
                    {isSelected && (
                      <div className="tri-annotations-panel">
                        {annotations.length > 0 && (
                          <div className="tri-existing-annotations">
                            <h4>📝 Annotations</h4>
                            {annotations.map((ann) => (
                              <div key={ann.id} className="tri-annotation-item">
                                <div className="tri-annotation-header">
                                  <span className="tri-annotation-author">{ann.author}</span>
                                  <span className="tri-annotation-time">
                                    {ann.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="tri-annotation-text">{ann.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Annotation */}
                        <div className="tri-add-annotation">
                          <label>💬 Ajouter une annotation</label>
                          <textarea
                            placeholder="Entrez votre commentaire, correction ou observation..."
                            value={annotationText}
                            onChange={(e) => setAnnotationText(e.target.value)}
                            className="tri-annotation-textarea"
                            rows="3"
                          />
                          <button
                            onClick={() => addAnnotation(field.id)}
                            disabled={!annotationText.trim()}
                            className="tri-btn-add-annotation"
                          >
                            Ajouter
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="tri-actions">
        <button className="tri-btn-secondary">📄 Exporter en PDF</button>
        <button className="tri-btn-primary">✓ Valider et soumettre</button>
      </div>
    </div>
  );
};

export default TechnicalReviewInterface;
