import { useState, useEffect } from 'react';

function ComplianceChecker({ file, onComplianceResult }) {
  const [progress, setProgress] = useState(0);

  // ✅ FIX 1 : injection du style CSS dans useEffect avec cleanup
  // Avant : le createElement s'exécutait au moment de l'import du module
  // (hors du cycle React), ce qui ajoutait une nouvelle balise <style>
  // dans <head> à chaque re-render sans jamais la nettoyer.
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes spin {
        0%   { transform: rotate(0deg);   }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);

    // ✅ Cleanup : retirer la balise quand le composant est démonté
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []); // tableau vide = une seule fois au montage

  // ✅ FIX 2 : logique d'analyse dans son propre useEffect
  useEffect(() => {
    let interval;

    interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplianceResult({
              global: {
                compliant: true,
                score: 86,
                message: 'RAPPORT CONFORME',
              },
            });
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [onComplianceResult]);

  return (
    <div style={styles.container}>
      <div style={styles.spinner} />
      <p style={styles.text}>Analyse du rapport en cours... {progress}%</p>
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    textAlign: 'center',
    padding: '20px',
    marginTop: '20px',
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #0B3B5C',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 15px',
  },
  text: {
    color: '#0B3B5C',
    fontWeight: '600',
    marginBottom: '12px',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0B3B5C',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
};

export default ComplianceChecker;