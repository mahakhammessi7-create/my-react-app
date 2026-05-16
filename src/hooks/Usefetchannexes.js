// hooks/useFetchAnnexes.js
// Fetche les annexes extraites via /api/reports/:id/full
// quand le report reçu n'a pas de extracted_data (null en base).

import { useState, useEffect } from 'react';

export function useFetchAnnexes(reportId, reportHasData) {
  const [annexesData,    setAnnexesData]    = useState(null);
  const [annexesLoading, setAnnexesLoading] = useState(false);

  useEffect(() => {
    // Si le report a déjà ses données, on ne fetche pas
    if (!reportId || reportHasData) return;

    setAnnexesLoading(true);

    fetch(`/api/reports/${reportId}/full`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        // L'endpoint peut retourner { annexes:{...} } ou { extracted_data:{...} }
        const annexes =
          data?.annexes ??
          data?.extracted_data ??
          data?.extractedData ??
          null;
        console.log('[useFetchAnnexes] Annexes chargées pour rapport', reportId, ':', annexes ? '✓' : '⚠ vides');
        setAnnexesData(annexes);
      })
      .catch(err => {
        console.warn('[useFetchAnnexes] Fetch échoué :', err.message);
      })
      .finally(() => setAnnexesLoading(false));

  }, [reportId, reportHasData]);

  return { annexesData, annexesLoading };
}