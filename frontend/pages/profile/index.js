import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import { UserCircleIcon, KeyIcon, CreditCardIcon, ShieldCheckIcon, MapPinIcon } from '@heroicons/react/24/outline';

// Components
import ProfilePage from '../../components/ProfilePage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Custom hooks and API
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function Profile() {
  const router = useRouter();
  const { user, isLoading, isLoggedIn } = useAuth();
  
  const [profileData, setProfileData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    company: '',
    phone_number: '',
    address: {
      country: '',
      region: '',
      city: '',
      street: '',
      zipcode: ''
    }
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=/profile');
    }
    
    if (user) {
      setProfileData({
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || '',
        company: user.company || '',
        phone_number: user.phone_number || '',
        address: {
          country: user.address?.country || '',
          region: user.address?.region || '',
          city: user.address?.city || '',
          street: user.address?.street || '',
          zipcode: user.address?.zipcode || ''
        }
      });
    }
  }, [isLoading, isLoggedIn, user, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await api.put('/api/user/profile', profileData);
      toast.success('Profil mis à jour avec succès');
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error(error.response?.data?.message || 'Échec de la mise à jour du profil');
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    
    setIsSaving(true);
    
    try {
      await api.put('/api/user/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success('Mot de passe modifié avec succès');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      toast.error(error.response?.data?.message || 'Échec du changement de mot de passe');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ProfilePage>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </ProfilePage>
    );
  }

  return (
    <ProfilePage title="Informations du compte">
      <div className="max-w-4xl mx-auto py-8 px-4">
        
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <UserCircleIcon className="h-8 w-8 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Données personnelles</h2>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="ml-auto text-blue-600 hover:text-blue-800"
                >
                  Modifier
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {isEditing ? (
              <form onSubmit={saveProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom
                    </label>
                    <input
                      type="text"
                      name="firstname"
                      value={profileData.firstname}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      name="lastname"
                      value={profileData.lastname}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse e-mail
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Numéro de téléphone
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={profileData.phone_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entreprise (Optionnel)
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={profileData.company}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <MapPinIcon className="h-5 w-5 text-blue-500 mr-2" />
                    Adresse
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pays
                      </label>
                      <select
                        name="address.country"
                        value={profileData.address.country}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionnez un pays</option>
                        <option value="AF">Afghanistan</option>
                        <option value="ZA">Afrique du Sud</option>
                        <option value="AL">Albanie</option>
                        <option value="DZ">Algérie</option>
                        <option value="DE">Allemagne</option>
                        <option value="AD">Andorre</option>
                        <option value="AO">Angola</option>
                        <option value="AI">Anguilla</option>
                        <option value="AQ">Antarctique</option>
                        <option value="AG">Antigua-et-Barbuda</option>
                        <option value="SA">Arabie saoudite</option>
                        <option value="AR">Argentine</option>
                        <option value="AM">Arménie</option>
                        <option value="AW">Aruba</option>
                        <option value="AU">Australie</option>
                        <option value="AT">Autriche</option>
                        <option value="AZ">Azerbaïdjan</option>
                        <option value="BS">Bahamas</option>
                        <option value="BH">Bahreïn</option>
                        <option value="BD">Bangladesh</option>
                        <option value="BB">Barbade</option>
                        <option value="BE">Belgique</option>
                        <option value="BZ">Belize</option>
                        <option value="BJ">Bénin</option>
                        <option value="BM">Bermudes</option>
                        <option value="BT">Bhoutan</option>
                        <option value="BY">Biélorussie</option>
                        <option value="BO">Bolivie</option>
                        <option value="BA">Bosnie-Herzégovine</option>
                        <option value="BW">Botswana</option>
                        <option value="BR">Brésil</option>
                        <option value="BN">Brunéi Darussalam</option>
                        <option value="BG">Bulgarie</option>
                        <option value="BF">Burkina Faso</option>
                        <option value="BI">Burundi</option>
                        <option value="KH">Cambodge</option>
                        <option value="CM">Cameroun</option>
                        <option value="CA">Canada</option>
                        <option value="CV">Cap-Vert</option>
                        <option value="CL">Chili</option>
                        <option value="CN">Chine</option>
                        <option value="CY">Chypre</option>
                        <option value="CO">Colombie</option>
                        <option value="KM">Comores</option>
                        <option value="CG">Congo</option>
                        <option value="CD">Congo (RDC)</option>
                        <option value="KR">Corée du Sud</option>
                        <option value="KP">Corée du Nord</option>
                        <option value="CR">Costa Rica</option>
                        <option value="CI">Côte d'Ivoire</option>
                        <option value="HR">Croatie</option>
                        <option value="CU">Cuba</option>
                        <option value="DK">Danemark</option>
                        <option value="DJ">Djibouti</option>
                        <option value="DM">Dominique</option>
                        <option value="EG">Égypte</option>
                        <option value="AE">Émirats arabes unis</option>
                        <option value="EC">Équateur</option>
                        <option value="ER">Érythrée</option>
                        <option value="ES">Espagne</option>
                        <option value="EE">Estonie</option>
                        <option value="US">États-Unis</option>
                        <option value="ET">Éthiopie</option>
                        <option value="FJ">Fidji</option>
                        <option value="FI">Finlande</option>
                        <option value="FR">France</option>
                        <option value="GA">Gabon</option>
                        <option value="GM">Gambie</option>
                        <option value="GE">Géorgie</option>
                        <option value="GS">Géorgie du Sud et les îles Sandwich du Sud</option>
                        <option value="GH">Ghana</option>
                        <option value="GI">Gibraltar</option>
                        <option value="GR">Grèce</option>
                        <option value="GD">Grenade</option>
                        <option value="GL">Groenland</option>
                        <option value="GP">Guadeloupe</option>
                        <option value="GU">Guam</option>
                        <option value="GT">Guatemala</option>
                        <option value="GN">Guinée</option>
                        <option value="GQ">Guinée équatoriale</option>
                        <option value="GW">Guinée-Bissau</option>
                        <option value="GY">Guyana</option>
                        <option value="GF">Guyane française</option>
                        <option value="HT">Haïti</option>
                        <option value="HN">Honduras</option>
                        <option value="HK">Hong Kong</option>
                        <option value="HU">Hongrie</option>
                        <option value="BV">Île Bouvet</option>
                        <option value="CX">Île Christmas</option>
                        <option value="NF">Île Norfolk</option>
                        <option value="IM">Île de Man</option>
                        <option value="KY">Îles Caïmans</option>
                        <option value="CC">Îles Cocos (Keeling)</option>
                        <option value="CK">Îles Cook</option>
                        <option value="FO">Îles Féroé</option>
                        <option value="HM">Îles Heard et McDonald</option>
                        <option value="FK">Îles Malouines</option>
                        <option value="MP">Îles Mariannes du Nord</option>
                        <option value="MH">Îles Marshall</option>
                        <option value="UM">Îles mineures éloignées des États-Unis</option>
                        <option value="SB">Îles Salomon</option>
                        <option value="TC">Îles Turks et Caïques</option>
                        <option value="VG">Îles Vierges britanniques</option>
                        <option value="VI">Îles Vierges des États-Unis</option>
                        <option value="IN">Inde</option>
                        <option value="ID">Indonésie</option>
                        <option value="IQ">Irak</option>
                        <option value="IR">Iran</option>
                        <option value="IE">Irlande</option>
                        <option value="IS">Islande</option>
                        <option value="IL">Israël</option>
                        <option value="IT">Italie</option>
                        <option value="JM">Jamaïque</option>
                        <option value="JP">Japon</option>
                        <option value="JO">Jordanie</option>
                        <option value="KZ">Kazakhstan</option>
                        <option value="KE">Kenya</option>
                        <option value="KG">Kirghizistan</option>
                        <option value="KI">Kiribati</option>
                        <option value="KW">Koweït</option>
                        <option value="LA">Laos</option>
                        <option value="LS">Lesotho</option>
                        <option value="LV">Lettonie</option>
                        <option value="LB">Liban</option>
                        <option value="LR">Libéria</option>
                        <option value="LY">Libye</option>
                        <option value="LI">Liechtenstein</option>
                        <option value="LT">Lituanie</option>
                        <option value="LU">Luxembourg</option>
                        <option value="MO">Macao</option>
                        <option value="MK">Macédoine du Nord</option>
                        <option value="MG">Madagascar</option>
                        <option value="MY">Malaisie</option>
                        <option value="MW">Malawi</option>
                        <option value="MV">Maldives</option>
                        <option value="ML">Mali</option>
                        <option value="MT">Malte</option>
                        <option value="MA">Maroc</option>
                        <option value="MQ">Martinique</option>
                        <option value="MU">Maurice</option>
                        <option value="MR">Mauritanie</option>
                        <option value="YT">Mayotte</option>
                        <option value="MX">Mexique</option>
                        <option value="FM">Micronésie</option>
                        <option value="MD">Moldavie</option>
                        <option value="MC">Monaco</option>
                        <option value="MN">Mongolie</option>
                        <option value="ME">Monténégro</option>
                        <option value="MS">Montserrat</option>
                        <option value="MZ">Mozambique</option>
                        <option value="MM">Myanmar</option>
                        <option value="NA">Namibie</option>
                        <option value="NR">Nauru</option>
                        <option value="NP">Népal</option>
                        <option value="NI">Nicaragua</option>
                        <option value="NE">Niger</option>
                        <option value="NG">Nigéria</option>
                        <option value="NU">Niue</option>
                        <option value="NO">Norvège</option>
                        <option value="NC">Nouvelle-Calédonie</option>
                        <option value="NZ">Nouvelle-Zélande</option>
                        <option value="OM">Oman</option>
                        <option value="UG">Ouganda</option>
                        <option value="UZ">Ouzbékistan</option>
                        <option value="PK">Pakistan</option>
                        <option value="PW">Palaos</option>
                        <option value="PS">Palestine</option>
                        <option value="PA">Panama</option>
                        <option value="PG">Papouasie-Nouvelle-Guinée</option>
                        <option value="PY">Paraguay</option>
                        <option value="NL">Pays-Bas</option>
                        <option value="PE">Pérou</option>
                        <option value="PH">Philippines</option>
                        <option value="PN">Pitcairn</option>
                        <option value="PL">Pologne</option>
                        <option value="PF">Polynésie française</option>
                        <option value="PR">Porto Rico</option>
                        <option value="PT">Portugal</option>
                        <option value="QA">Qatar</option>
                        <option value="RE">Réunion</option>
                        <option value="RO">Roumanie</option>
                        <option value="GB">Royaume-Uni</option>
                        <option value="RU">Russie</option>
                        <option value="RW">Rwanda</option>
                        <option value="EH">Sahara occidental</option>
                        <option value="BL">Saint-Barthélemy</option>
                        <option value="KN">Saint-Kitts-et-Nevis</option>
                        <option value="SM">Saint-Marin</option>
                        <option value="MF">Saint-Martin</option>
                        <option value="PM">Saint-Pierre-et-Miquelon</option>
                        <option value="VA">Saint-Siège (Vatican)</option>
                        <option value="VC">Saint-Vincent-et-les Grenadines</option>
                        <option value="SH">Sainte-Hélène</option>
                        <option value="LC">Sainte-Lucie</option>
                        <option value="SV">Salvador</option>
                        <option value="WS">Samoa</option>
                        <option value="AS">Samoa américaines</option>
                        <option value="ST">Sao Tomé-et-Principe</option>
                        <option value="SN">Sénégal</option>
                        <option value="RS">Serbie</option>
                        <option value="SC">Seychelles</option>
                        <option value="SL">Sierra Leone</option>
                        <option value="SG">Singapour</option>
                        <option value="SK">Slovaquie</option>
                        <option value="SI">Slovénie</option>
                        <option value="SO">Somalie</option>
                        <option value="SD">Soudan</option>
                        <option value="SS">Soudan du Sud</option>
                        <option value="LK">Sri Lanka</option>
                        <option value="SE">Suède</option>
                        <option value="CH">Suisse</option>
                        <option value="SR">Suriname</option>
                        <option value="SJ">Svalbard et Jan Mayen</option>
                        <option value="SZ">Swaziland</option>
                        <option value="SY">Syrie</option>
                        <option value="TJ">Tadjikistan</option>
                        <option value="TW">Taïwan</option>
                        <option value="TZ">Tanzanie</option>
                        <option value="TD">Tchad</option>
                        <option value="CZ">Tchéquie</option>
                        <option value="TF">Terres australes et antarctiques françaises</option>
                        <option value="IO">Territoire britannique de l'océan Indien</option>
                        <option value="TH">Thaïlande</option>
                        <option value="TL">Timor oriental</option>
                        <option value="TG">Togo</option>
                        <option value="TK">Tokelau</option>
                        <option value="TO">Tonga</option>
                        <option value="TT">Trinité-et-Tobago</option>
                        <option value="TN">Tunisie</option>
                        <option value="TM">Turkménistan</option>
                        <option value="TR">Turquie</option>
                        <option value="TV">Tuvalu</option>
                        <option value="UA">Ukraine</option>
                        <option value="UY">Uruguay</option>
                        <option value="VU">Vanuatu</option>
                        <option value="VE">Venezuela</option>
                        <option value="VN">Viêt Nam</option>
                        <option value="WF">Wallis-et-Futuna</option>
                        <option value="YE">Yémen</option>
                        <option value="ZM">Zambie</option>
                        <option value="ZW">Zimbabwe</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                      État/Région/Province (Optionnel)
                      </label>
                      <input
                        type="text"
                        name="address.region"
                        value={profileData.address.region}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ville
                      </label>
                      <input
                        type="text"
                        name="address.city"
                        value={profileData.address.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code postal
                      </label>
                      <input
                        type="text"
                        name="address.zipcode"
                        value={profileData.address.zipcode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rue
                      </label>
                      <input
                        type="text"
                        name="address.street"
                        value={profileData.address.street}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="ml-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Prénom</p>
                    <p className="mt-1">{profileData.firstname}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nom</p>
                    <p className="mt-1">{profileData.lastname}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Adresse e-mail</p>
                    <p className="mt-1">{profileData.email}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Numéro de téléphone</p>
                    <p className="mt-1">{profileData.phone_number || 'Non renseigné'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Entreprise</p>
                    <p className="mt-1">{profileData.company || 'Non renseigné'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <MapPinIcon className="h-5 w-5 text-blue-500 mr-2" />
                    Adresse
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pays</p>
                      <p className="mt-1">
                        {(() => {
                          const countries = {
                            "AF": "Afghanistan", "ZA": "Afrique du Sud", "AL": "Albanie", "DZ": "Algérie", 
                            "DE": "Allemagne", "AD": "Andorre", "AO": "Angola", "AI": "Anguilla", 
                            "AQ": "Antarctique", "AG": "Antigua-et-Barbuda", "SA": "Arabie saoudite", 
                            "AR": "Argentine", "AM": "Arménie", "AW": "Aruba", "AU": "Australie", 
                            "AT": "Autriche", "AZ": "Azerbaïdjan", "BS": "Bahamas", "BH": "Bahreïn", 
                            "BD": "Bangladesh", "BB": "Barbade", "BE": "Belgique", "BZ": "Belize", 
                            "BJ": "Bénin", "BM": "Bermudes", "BT": "Bhoutan", "BY": "Biélorussie", 
                            "BO": "Bolivie", "BA": "Bosnie-Herzégovine", "BW": "Botswana", "BR": "Brésil", 
                            "BN": "Brunéi Darussalam", "BG": "Bulgarie", "BF": "Burkina Faso", "BI": "Burundi", 
                            "KH": "Cambodge", "CM": "Cameroun", "CA": "Canada", "CV": "Cap-Vert", 
                            "CL": "Chili", "CN": "Chine", "CY": "Chypre", "CO": "Colombie", 
                            "KM": "Comores", "CG": "Congo", "CD": "Congo (RDC)", "KR": "Corée du Sud", 
                            "KP": "Corée du Nord", "CR": "Costa Rica", "CI": "Côte d'Ivoire", "HR": "Croatie", 
                            "CU": "Cuba", "DK": "Danemark", "DJ": "Djibouti", "DM": "Dominique", 
                            "EG": "Égypte", "AE": "Émirats arabes unis", "EC": "Équateur", "ER": "Érythrée", 
                            "ES": "Espagne", "EE": "Estonie", "US": "États-Unis", "ET": "Éthiopie", 
                            "FJ": "Fidji", "FI": "Finlande", "FR": "France", "GA": "Gabon", 
                            "GM": "Gambie", "GE": "Géorgie", "GS": "Géorgie du Sud et les îles Sandwich du Sud", 
                            "GH": "Ghana", "GI": "Gibraltar", "GR": "Grèce", "GD": "Grenade", 
                            "GL": "Groenland", "GP": "Guadeloupe", "GU": "Guam", "GT": "Guatemala", 
                            "GN": "Guinée", "GQ": "Guinée équatoriale", "GW": "Guinée-Bissau", "GY": "Guyana", 
                            "GF": "Guyane française", "HT": "Haïti", "HN": "Honduras", "HK": "Hong Kong", 
                            "HU": "Hongrie", "BV": "Île Bouvet", "CX": "Île Christmas", "NF": "Île Norfolk", 
                            "IM": "Île de Man", "KY": "Îles Caïmans", "CC": "Îles Cocos (Keeling)", 
                            "CK": "Îles Cook", "FO": "Îles Féroé", "HM": "Îles Heard et McDonald", 
                            "FK": "Îles Malouines", "MP": "Îles Mariannes du Nord", "MH": "Îles Marshall", 
                            "UM": "Îles mineures éloignées des États-Unis", "SB": "Îles Salomon", 
                            "TC": "Îles Turks et Caïques", "VG": "Îles Vierges britanniques", 
                            "VI": "Îles Vierges des États-Unis", "IN": "Inde", "ID": "Indonésie", 
                            "IQ": "Irak", "IR": "Iran", "IE": "Irlande", "IS": "Islande", 
                            "IL": "Israël", "IT": "Italie", "JM": "Jamaïque", "JP": "Japon", 
                            "JO": "Jordanie", "KZ": "Kazakhstan", "KE": "Kenya", "KG": "Kirghizistan", 
                            "KI": "Kiribati", "KW": "Koweït", "LA": "Laos", "LS": "Lesotho", 
                            "LV": "Lettonie", "LB": "Liban", "LR": "Libéria", "LY": "Libye", 
                            "LI": "Liechtenstein", "LT": "Lituanie", "LU": "Luxembourg", "MO": "Macao", 
                            "MK": "Macédoine du Nord", "MG": "Madagascar", "MY": "Malaisie", "MW": "Malawi", 
                            "MV": "Maldives", "ML": "Mali", "MT": "Malte", "MA": "Maroc", 
                            "MQ": "Martinique", "MU": "Maurice", "MR": "Mauritanie", "YT": "Mayotte", 
                            "MX": "Mexique", "FM": "Micronésie", "MD": "Moldavie", "MC": "Monaco", 
                            "MN": "Mongolie", "ME": "Monténégro", "MS": "Montserrat", "MZ": "Mozambique", 
                            "MM": "Myanmar", "NA": "Namibie", "NR": "Nauru", "NP": "Népal", 
                            "NI": "Nicaragua", "NE": "Niger", "NG": "Nigéria", "NU": "Niue", 
                            "NO": "Norvège", "NC": "Nouvelle-Calédonie", "NZ": "Nouvelle-Zélande", 
                            "OM": "Oman", "UG": "Ouganda", "UZ": "Ouzbékistan", "PK": "Pakistan", 
                            "PW": "Palaos", "PS": "Palestine", "PA": "Panama", "PG": "Papouasie-Nouvelle-Guinée", 
                            "PY": "Paraguay", "NL": "Pays-Bas", "PE": "Pérou", "PH": "Philippines", 
                            "PN": "Pitcairn", "PL": "Pologne", "PF": "Polynésie française", "PR": "Porto Rico", 
                            "PT": "Portugal", "QA": "Qatar", "RE": "Réunion", "RO": "Roumanie", 
                            "GB": "Royaume-Uni", "RU": "Russie", "RW": "Rwanda", "EH": "Sahara occidental", 
                            "BL": "Saint-Barthélemy", "KN": "Saint-Kitts-et-Nevis", "SM": "Saint-Marin", 
                            "MF": "Saint-Martin", "PM": "Saint-Pierre-et-Miquelon", "VA": "Saint-Siège (Vatican)", 
                            "VC": "Saint-Vincent-et-les Grenadines", "SH": "Sainte-Hélène", "LC": "Sainte-Lucie", 
                            "SV": "Salvador", "WS": "Samoa", "AS": "Samoa américaines", "ST": "Sao Tomé-et-Principe", 
                            "SN": "Sénégal", "RS": "Serbie", "SC": "Seychelles", "SL": "Sierra Leone", 
                            "SG": "Singapour", "SK": "Slovaquie", "SI": "Slovénie", "SO": "Somalie", 
                            "SD": "Soudan", "SS": "Soudan du Sud", "LK": "Sri Lanka", "SE": "Suède", 
                            "CH": "Suisse", "SR": "Suriname", "SJ": "Svalbard et Jan Mayen", "SZ": "Swaziland", 
                            "SY": "Syrie", "TJ": "Tadjikistan", "TW": "Taïwan", "TZ": "Tanzanie", 
                            "TD": "Tchad", "CZ": "Tchéquie", "TF": "Terres australes et antarctiques françaises", 
                            "IO": "Territoire britannique de l'océan Indien", "TH": "Thaïlande", "TL": "Timor oriental", 
                            "TG": "Togo", "TK": "Tokelau", "TO": "Tonga", "TT": "Trinité-et-Tobago", 
                            "TN": "Tunisie", "TM": "Turkménistan", "TR": "Turquie", "TV": "Tuvalu", 
                            "UA": "Ukraine", "UY": "Uruguay", "VU": "Vanuatu", "VE": "Venezuela", 
                            "VN": "Viêt Nam", "WF": "Wallis-et-Futuna", "YE": "Yémen", "ZM": "Zambie", 
                            "ZW": "Zimbabwe"
                          };
                          return countries[profileData.address.country] || 'Non renseigné';
                        })()}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">État/Région/Province</p>
                      <p className="mt-1">{profileData.address.region || 'Non renseigné'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ville</p>
                      <p className="mt-1">{profileData.address.city || 'Non renseigné'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500">Code postal</p>
                      <p className="mt-1">{profileData.address.zipcode || 'Non renseigné'}</p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500">Rue</p>
                      <p className="mt-1">{profileData.address.street || 'Non renseigné'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Modifier mes informations
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Section Sécurité */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Sécurité</h2>
            </div>
          </div>
          
          <div className="p-6">
            {isChangingPassword ? (
              <form onSubmit={changePassword}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      minLength={8}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex items-center">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {isSaving ? 'Modification...' : 'Modifier le mot de passe'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="ml-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Mot de passe</h3>
                    <p className="text-sm text-gray-500">
                      Modifier votre mot de passe
                    </p>
                  </div>
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Modifier le mot de passe
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Section Facturation */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <CreditCardIcon className="h-8 w-8 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">Informations de facturation</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Moyens de paiement</h3>
                <p className="text-sm text-gray-500">
                  Gérer vos moyens de paiement et informations de facturation
                </p>
              </div>
              <button
                onClick={() => router.push('/profile/billing')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Gérer la facturation
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProfilePage>
  );
}
