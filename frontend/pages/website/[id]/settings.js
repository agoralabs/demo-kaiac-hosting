import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import WebSitePage from '../../../components/WebSitePage';
import { toast } from 'react-hot-toast';
import api from '../../../lib/api';

export default function WebsiteParameters() {
  const router = useRouter();
  const { id } = router.query;
  const [parameters, setParameters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchParameters = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/website/${id}/generate-wp-report`, { timeout: 30000 });
        
        // Traitement des données pour gérer les chaînes avec guillemets échappés
        const data = response.data.data;
        
        // Fonction pour nettoyer les chaînes avec guillemets échappés
        const cleanStringValue = (value) => {
          if (typeof value === 'string') {
            // Si la chaîne commence et se termine par des guillemets
            if (value.startsWith('"') && value.endsWith('"')) {
              // Enlever les guillemets externes et désescaper les guillemets internes
              value = value.substring(1, value.length - 1);
            }
            
            // Désescaper les barres obliques (\/), les guillemets (\") et les doubles barres obliques (\\)
            return value.replace(/\\\//g, '/').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          }
          return value;
        };
        
        // Nettoyer les objets imbriqués
        const cleanObject = (obj) => {
          if (!obj || typeof obj !== 'object') return obj;
          
          const result = Array.isArray(obj) ? [...obj] : {...obj};
          
          Object.keys(result).forEach(key => {
            if (typeof result[key] === 'object' && result[key] !== null) {
              result[key] = cleanObject(result[key]);
            } else if (typeof result[key] === 'string') {
              result[key] = cleanStringValue(result[key]);
            }
          });
          
          return result;
        };
        
        // Appliquer le nettoyage à toutes les données
        const cleanedData = cleanObject(data);
        setParameters(cleanedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching website parameters:', err);
        toast.error('Impossible de récupérer les paramètres du site. Veuillez réessayer plus tard.');
        setError('Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchParameters();
  }, [id]);

  if (!id) {
    return <div>Chargement...</div>;
  }

  return (
    <Layout title="Settings">
      <WebSitePage>
      <Head>
        <title>Paramètres du site | KaiaC Hosting</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Paramètres du site</h1>

        {loading ? (
          <LoadingSpinner />
        ) : !parameters ? (
          <div className="text-center py-8 text-gray-500">Aucune donnée disponible</div>
        ) : (
          <div className="space-y-8">
            {/* Date du rapport */}
            <div className="text-sm text-gray-500 mb-4">
              Rapport généré le: {new Date(parameters.report_date).toLocaleString()}
            </div>

            {/* Chemin racine */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold mb-2">Chemin racine</h2>
              <p className="font-mono text-sm">{parameters.web_root}</p>
            </div>

            {/* Informations de base */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Informations de base</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">URL du site</p>
                  <p>{parameters.basic_info.site_url || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">URL d'accueil</p>
                  <p>{parameters.basic_info.home_url || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Version WordPress</p>
                  <p>{parameters.basic_info.wp_version}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Langue</p>
                  <p>{parameters.basic_info.language.length > 0 ? parameters.basic_info.language.join(', ') : 'Par défaut'}</p>
                </div>
              </div>
            </div>

            {/* Configuration générale */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Configuration générale</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nom du site</p>
                  <p>{parameters.general_config.blogname || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p>{parameters.general_config.blogdescription || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email administrateur</p>
                  <p>{parameters.general_config.admin_email || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fuseau horaire</p>
                  <p>{parameters.general_config.timezone_string || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Format de date</p>
                  <p>{parameters.general_config.date_format || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Format d'heure</p>
                  <p>{parameters.general_config.time_format || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Premier jour de la semaine</p>
                  <p>{['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][parameters.general_config.start_of_week]}</p>
                </div>
              </div>
            </div>

            {/* Paramètres de lecture */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Paramètres de lecture</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Afficher sur la page d'accueil</p>
                  <p>{parameters.reading_settings.show_on_front || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Page d'accueil</p>
                  <p>ID: {parameters.reading_settings.page_on_front}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Page des articles</p>
                  <p>ID: {parameters.reading_settings.page_for_posts}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Articles par page</p>
                  <p>{parameters.reading_settings.posts_per_page}</p>
                </div>
              </div>
            </div>

            {/* Paramètres de discussion */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Paramètres de discussion</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Statut des commentaires par défaut</p>
                  <p>{parameters.discussion_settings.default_comment_status || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Inscription requise pour commenter</p>
                  <p>{parameters.discussion_settings.comment_registration ? 'Oui' : 'Non'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Nom et email requis</p>
                  <p>{parameters.discussion_settings.require_name_email ? 'Oui' : 'Non'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fermer les commentaires pour les anciens articles</p>
                  <p>{parameters.discussion_settings.close_comments_for_old_posts ? 'Oui' : 'Non'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fermer les commentaires après (jours)</p>
                  <p>{parameters.discussion_settings.close_comments_days_old}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Commentaires imbriqués</p>
                  <p>{parameters.discussion_settings.thread_comments ? 'Oui' : 'Non'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Profondeur d'imbrication</p>
                  <p>{parameters.discussion_settings.thread_comments_depth}</p>
                </div>
              </div>
            </div>

            {/* Thème */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Thème</h2>
              {parameters.theme.length > 0 ? (
                <ul className="list-disc pl-5">
                  {parameters.theme.map((theme, index) => (
                    <li key={index}>
                      <strong>{theme.title || theme.name}</strong>
                      {theme.version && <span className="ml-2 text-sm text-gray-500">v{theme.version}</span>}
                      {theme.status === 'active' && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Actif</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Aucune information sur le thème disponible</p>
              )}
            </div>

            {/* Plugins */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Plugins</h2>
              
              <h3 className="text-lg font-medium mb-2">Plugins actifs</h3>
              {parameters.plugins.active.length > 0 ? (
                <ul className="list-disc pl-5 mb-4">
                  {parameters.plugins.active.map((plugin, index) => (
                    <li key={index}>
                      <strong>{plugin.title || plugin.name}</strong>
                      {plugin.version && <span className="ml-2 text-sm text-gray-500">v{plugin.version}</span>}
                      {plugin.status === 'active' && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Actif</span>}
                    </li>
                  ))}

                </ul>
              ) : (
                <p className="text-gray-500 mb-4">Aucun plugin actif</p>
              )}
              
              <h3 className="text-lg font-medium mb-2">Plugins obligatoires</h3>
              {parameters.plugins.must_use.length > 0 ? (
                <ul className="list-disc pl-5">
                  {parameters.plugins.must_use.map((plugin, index) => (
                    <li key={index}>{plugin}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Aucun plugin obligatoire</p>
              )}
            </div>

            {/* Configuration avancée */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Configuration avancée</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nom de la base de données</p>
                  <p className="font-mono">{parameters.advanced_config.db_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Utilisateur de la base de données</p>
                  <p className="font-mono">{parameters.advanced_config.db_user}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Hôte de la base de données</p>
                  <p className="font-mono">{parameters.advanced_config.db_host}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Préfixe des tables</p>
                  <p className="font-mono">{parameters.advanced_config.table_prefix}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">WP_DEBUG</p>
                  <p>{parameters.advanced_config.wp_debug ? 'Activé' : 'Désactivé'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">WP_DEBUG_LOG</p>
                  <p className="font-mono text-sm truncate" title={parameters.advanced_config.wp_debug_log}>
                    {parameters.advanced_config.wp_debug_log || 'Non défini'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">WP_DEBUG_DISPLAY</p>
                  <p>{parameters.advanced_config.wp_debug_display ? 'Activé' : 'Désactivé'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">SCRIPT_DEBUG</p>
                  <p>{parameters.advanced_config.script_debug ? 'Activé' : 'Désactivé'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">WP_CACHE</p>
                  <p>{parameters.advanced_config.wp_cache ? 'Activé' : 'Désactivé'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </WebSitePage>
    </Layout>
  );
}
