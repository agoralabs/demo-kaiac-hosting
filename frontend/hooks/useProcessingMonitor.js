import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function useProcessingMonitor(websiteId, initialProcessingState) {
  const [isProcessing, setIsProcessing] = useState(initialProcessingState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let intervalId = null;
    let isMounted = true; // Pour éviter les mises à jour d'état après démontage

    const checkProcessingStatus = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      try {
        const response = await api.get(`/api/website/monitor-processing/${websiteId}`);
        const is_processing_site = response.data.data;   
        if (isMounted) {
          setIsProcessing(is_processing_site);
          setError(null);
        }
        return is_processing_site;
      } catch (err) {
        if (isMounted) {
          setError(err);
          console.error("Erreur de monitoring:", err);
        }
        return false;
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    // Démarrer le monitoring seulement si initialProcessingState est true
    if (initialProcessingState) {
      // Première vérification immédiate
      checkProcessingStatus().then((stillProcessing) => {
        if (!stillProcessing) return;
        
        // Configurer l'intervalle pour les vérifications suivantes
        intervalId = setInterval(async () => {
          const stillProcessing = await checkProcessingStatus();
          if (!stillProcessing && intervalId) {
            clearInterval(intervalId);
          }
        }, 5000); // Intervalle de 5 secondes
      });
    }

    // Nettoyage
    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [websiteId, initialProcessingState]);

  return {
    isProcessing,
    isLoading,
    error,
    // Optionnel: fonction pour forcer une vérification manuelle
    manualCheck: async () => {
      const status = await checkProcessingStatus();
      return status;
    }
  };
}