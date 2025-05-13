// components/BillingAddressModal.js
import { useState } from 'react';

export default function BillingAddressModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  initialAddress = {
    country: 'France',
    region: '',
    street: '',
    postalCode: '',
    city: ''
  }
}) {
  const [billingAddress, setBillingAddress] = useState(initialAddress);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBillingAddress(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Adresse de facturation</h3>
        
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pays*</label>
            <select
              name="country"
              value={billingAddress.country}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
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

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
            État/Région/Province (Optionnel)
            </label>
            <input
              type="text"
              name="region"
              value={billingAddress.region}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rue*</label>
            <input
              type="text"
              name="street"
              value={billingAddress.street}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code postal*</label>
              <input
                type="text"
                name="postalCode"
                value={billingAddress.postalCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville*</label>
              <input
                type="text"
                name="city"
                value={billingAddress.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(billingAddress)}
            disabled={!billingAddress.street || !billingAddress.postalCode || !billingAddress.city}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}