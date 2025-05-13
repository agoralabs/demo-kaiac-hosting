// Fonction handleAddDomain modifiée pour recevoir les données du formulaire
const handleAddDomain = async (formData) => {
  try {
    setAddModal(prev => ({ ...prev, submitting: true, error: null }));
    
    const response = await api.post('/api/user/domains', {
      domain_name: formData.domain_name,
      expires_at: formData.expires_at,
      category: 'declared'
    });
    
    setDomains([...domains, response.data.data]);
    toast.success('Domaine ajouté avec succès');
    closeAddModal();
  } catch (err) {
    console.error('Erreur lors de l\'ajout du domaine', err);
    setAddModal(prev => ({ 
      ...prev, 
      submitting: false, 
      error: err.response?.data?.message || 'Erreur lors de l\'ajout du domaine' 
    }));
  }
};

// Utilisation correcte du composant modal
{addModal.open && (
  <DeclareNewDomainModal
    isOpen={addModal.open}
    onClose={closeAddModal}
    onSubmit={handleAddDomain}
    isSubmitting={addModal.submitting}
    error={addModal.error}
  />
)}
