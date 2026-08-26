import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { X, ShieldCheck, User, Mail, Search, CheckCircle, Lock } from 'lucide-react';

// Same header-building logic used by watchSlice.js thunks (getHeaders is not exported from there,
// so it's kept in sync here rather than importing internals across files).
const getAuthHeaders = () => {
  const token = localStorage.getItem('khroniq_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const ALL_COUNTRIES = [
  { name: 'Afghanistan', code: '+93' }, { name: 'Albania', code: '+355' }, { name: 'Algeria', code: '+213' },
  { name: 'Andorra', code: '+376' }, { name: 'Angola', code: '+244' }, { name: 'Antigua and Barbuda', code: '+1-268' },
  { name: 'Argentina', code: '+54' }, { name: 'Armenia', code: '+374' }, { name: 'Australia', code: '+61' },
  { name: 'Austria', code: '+43' }, { name: 'Azerbaijan', code: '+994' }, { name: 'Bahamas', code: '+1-242' },
  { name: 'Bahrain', code: '+973' }, { name: 'Bangladesh', code: '+880' }, { name: 'Barbados', code: '+1-246' },
  { name: 'Belarus', code: '+375' }, { name: 'Belgium', code: '+32' }, { name: 'Belize', code: '+501' },
  { name: 'Benin', code: '+229' }, { name: 'Bhutan', code: '+975' }, { name: 'Bolivia', code: '+591' },
  { name: 'Bosnia and Herzegovina', code: '+387' }, { name: 'Botswana', code: '+267' }, { name: 'Brazil', code: '+55' },
  { name: 'Brunei', code: '+673' }, { name: 'Bulgaria', code: '+359' }, { name: 'Burkina Faso', code: '+226' },
  { name: 'Burundi', code: '+257' }, { name: 'Cabo Verde', code: '+238' }, { name: 'Cambodia', code: '+855' },
  { name: 'Cameroon', code: '+237' }, { name: 'Canada', code: '+1' }, { name: 'Central African Republic', code: '+236' },
  { name: 'Chad', code: '+235' }, { name: 'Chile', code: '+56' }, { name: 'China', code: '+86' },
  { name: 'Colombia', code: '+57' }, { name: 'Comoros', code: '+269' }, { name: 'Congo, Democratic Republic of the', code: '+243' },
  { name: 'Congo, Republic of the', code: '+242' }, { name: 'Costa Rica', code: '+506' }, { name: 'Croatia', code: '+385' },
  { name: 'Cuba', code: '+53' }, { name: 'Cyprus', code: '+357' }, { name: 'Czechia', code: '+420' },
  { name: 'Denmark', code: '+45' }, { name: 'Djibouti', code: '+253' }, { name: 'Dominica', code: '+1-767' },
  { name: 'Dominican Republic', code: '+1-809' }, { name: 'Ecuador', code: '+593' }, { name: 'Egypt', code: '+20' },
  { name: 'El Salvador', code: '+503' }, { name: 'Equatorial Guinea', code: '+240' }, { name: 'Eritrea', code: '+291' },
  { name: 'Estonia', code: '+372' }, { name: 'Eswatini', code: '+268' }, { name: 'Ethiopia', code: '+251' },
  { name: 'Fiji', code: '+679' }, { name: 'Finland', code: '+358' }, { name: 'France', code: '+33' },
  { name: 'Gabon', code: '+241' }, { name: 'Gambia', code: '+220' }, { name: 'Georgia', code: '+995' },
  { name: 'Germany', code: '+49' }, { name: 'Ghana', code: '+233' }, { name: 'Greece', code: '+30' },
  { name: 'Grenada', code: '+1-473' }, { name: 'Guatemala', code: '+502' }, { name: 'Guinea', code: '+224' },
  { name: 'Guinea-Bissau', code: '+245' }, { name: 'Guyana', code: '+592' }, { name: 'Haiti', code: '+509' },
  { name: 'Honduras', code: '+504' }, { name: 'Hungary', code: '+36' }, { name: 'Iceland', code: '+354' },
  { name: 'India', code: '+91' }, { name: 'Indonesia', code: '+62' }, { name: 'Iran', code: '+98' },
  { name: 'Iraq', code: '+964' }, { name: 'Ireland', code: '+353' }, { name: 'Israel', code: '+972' },
  { name: 'Italy', code: '+39' }, { name: 'Jamaica', code: '+1-876' }, { name: 'Japan', code: '+81' },
  { name: 'Jordan', code: '+962' }, { name: 'Kazakhstan', code: '+7' }, { name: 'Kenya', code: '+254' },
  { name: 'Kiribati', code: '+686' }, { name: 'Korea, North', code: '+850' }, { name: 'Korea, South', code: '+82' },
  { name: 'Kosovo', code: '+383' }, { name: 'Kuwait', code: '+965' }, { name: 'Kyrgyzstan', code: '+996' },
  { name: 'Laos', code: '+856' }, { name: 'Latvia', code: '+371' }, { name: 'Lebanon', code: '+961' },
  { name: 'Lesotho', code: '+266' }, { name: 'Liberia', code: '+231' }, { name: 'Libya', code: '+218' },
  { name: 'Liechtenstein', code: '+423' }, { name: 'Lithuania', code: '+370' }, { name: 'Luxembourg', code: '+352' },
  { name: 'Madagascar', code: '+261' }, { name: 'Malawi', code: '+265' }, { name: 'Malaysia', code: '+60' },
  { name: 'Maldives', code: '+960' }, { name: 'Mali', code: '+223' }, { name: 'Malta', code: '+356' },
  { name: 'Marshall Islands', code: '+692' }, { name: 'Mauritania', code: '+222' }, { name: 'Mauritius', code: '+230' },
  { name: 'Mexico', code: '+52' }, { name: 'Micronesia', code: '+691' }, { name: 'Moldova', code: '+373' },
  { name: 'Monaco', code: '+377' }, { name: 'Mongolia', code: '+976' }, { name: 'Montenegro', code: '+382' },
  { name: 'Morocco', code: '+212' }, { name: 'Mozambique', code: '+258' }, { name: 'Myanmar', code: '+95' },
  { name: 'Namibia', code: '+264' }, { name: 'Nauru', code: '+674' }, { name: 'Nepal', code: '+977' },
  { name: 'Netherlands', code: '+31' }, { name: 'New Zealand', code: '+64' }, { name: 'Nicaragua', code: '+505' },
  { name: 'Niger', code: '+227' }, { name: 'Nigeria', code: '+234' }, { name: 'North Macedonia', code: '+389' },
  { name: 'Norway', code: '+47' }, { name: 'Oman', code: '+968' }, { name: 'Pakistan', code: '+92' },
  { name: 'Palau', code: '+680' }, { name: 'Palestine', code: '+970' }, { name: 'Panama', code: '+507' },
  { name: 'Papua New Guinea', code: '+675' }, { name: 'Paraguay', code: '+595' }, { name: 'Peru', code: '+51' },
  { name: 'Philippines', code: '+63' }, { name: 'Poland', code: '+48' }, { name: 'Portugal', code: '+351' },
  { name: 'Qatar', code: '+974' }, { name: 'Romania', code: '+40' }, { name: 'Russia', code: '+7' },
  { name: 'Rwanda', code: '+250' }, { name: 'Saint Kitts and Nevis', code: '+1-869' }, { name: 'Saint Lucia', code: '+1-758' },
  { name: 'Saint Vincent and the Grenadines', code: '+1-784' }, { name: 'Samoa', code: '+685' }, { name: 'San Marino', code: '+378' },
  { name: 'Sao Tome and Principe', code: '+239' }, { name: 'Saudi Arabia', code: '+966' }, { name: 'Senegal', code: '+221' },
  { name: 'Serbia', code: '+381' }, { name: 'Seychelles', code: '+248' }, { name: 'Sierra Leone', code: '+232' },
  { name: 'Singapore', code: '+65' }, { name: 'Slovakia', code: '+421' }, { name: 'Slovenia', code: '+386' },
  { name: 'Solomon Islands', code: '+677' }, { name: 'Somalia', code: '+252' }, { name: 'South Africa', code: '+27' },
  { name: 'South Sudan', code: '+211' }, { name: 'Spain', code: '+34' }, { name: 'Sri Lanka', code: '+94' },
  { name: 'Sudan', code: '+249' }, { name: 'Suriname', code: '+597' }, { name: 'Sweden', code: '+46' },
  { name: 'Switzerland', code: '+41' }, { name: 'Syria', code: '+963' }, { name: 'Taiwan', code: '+886' },
  { name: 'Tajikistan', code: '+992' }, { name: 'Tanzania', code: '+255' }, { name: 'Thailand', code: '+66' },
  { name: 'Timor-Leste', code: '+670' }, { name: 'Togo', code: '+228' }, { name: 'Tonga', code: '+676' },
  { name: 'Trinidad and Tobago', code: '+1-868' }, { name: 'Tunisia', code: '+216' }, { name: 'Turkey', code: '+90' },
  { name: 'Turkmenistan', code: '+993' }, { name: 'Tuvalu', code: '+688' }, { name: 'Uganda', code: '+256' },
  { name: 'Ukraine', code: '+380' }, { name: 'United Arab Emirates', code: '+971' }, { name: 'United Kingdom', code: '+44' },
  { name: 'United States', code: '+1' }, { name: 'Uruguay', code: '+598' }, { name: 'Uzbekistan', code: '+998' },
  { name: 'Vanuatu', code: '+678' }, { name: 'Vatican City', code: '+39' }, { name: 'Venezuela', code: '+58' },
  { name: 'Vietnam', code: '+84' }, { name: 'Yemen', code: '+967' }, { name: 'Zambia', code: '+260' },
  { name: 'Zimbabwe', code: '+263' }
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export default function WarrantyDrawer({ isOpen, onClose }) {
  const currentUser = useSelector(state => state.watch.currentUser);

  // Step tracker: 'details' -> 'watch-select' -> 'verified'
  const [step, setStep] = useState('details');
  const [ownerName, setOwnerName] = useState(currentUser?.name || '');
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Admins can look up warranty records for a specific customer by typing their email.
  // Regular customers stay locked to their own account email (never editable, never sent —
  // the backend always derives it from the JWT for them, as a security guarantee).
  const isAdmin = currentUser?.role === 'admin';
  const [lookupEmail, setLookupEmail] = useState(isAdmin ? '' : (currentUser?.email || ''));

  // Country / State / City / Phone — sent only on final claim, saved as extra info on the claim record
  const [country, setCountry] = useState('India');
  const [stateName, setStateName] = useState('Maharashtra');
  const [city, setCity] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countrySearch, setCountrySearch] = useState('India');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Watch selection variables
  const [watchSearchText, setWatchSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Custom inputs for codes
  const [serialCode, setSerialCode] = useState('');
  const [specialClaimCode, setSpecialClaimCode] = useState('');

  const [verificationResult, setVerificationResult] = useState(null);

  // Retrieve purchases via API — for regular customers, email comes from the JWT
  // server-side and this field is ignored entirely (locked, can't be spoofed).
  // For admins, the typed lookupEmail is sent and used to find that customer's purchases.
  const handleRetrievePurchases = async (e) => {
    e.preventDefault();
    if (!ownerName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg('Phone number is required.');
      return;
    }
    if (isAdmin && !lookupEmail.trim()) {
      setErrorMsg('Please enter the customer\'s email to look up their warranty.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/warranty/lookup', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(isAdmin ? { email: lookupEmail.trim() } : {})
      });
      const data = await response.json();

      if (response.status === 401) {
        setErrorMsg('Your session has expired. Please log in again.');
        return;
      }

      if (data.success) {
        setPurchases(data.purchases || []);
        setStep('watch-select');
      } else {
        setErrorMsg(data.message || 'Could not retrieve purchases.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter purchases by text typed
  const suggestions = watchSearchText.trim().length >= 1
    ? purchases.filter(p => p.name.toLowerCase().includes(watchSearchText.toLowerCase()))
    : purchases; // Show all if empty but focused

  // Handle selecting a watch from dropdown
  const handleSelectWatch = (purchase) => {
    setWatchSearchText(purchase.name);
    setSelectedPurchase(purchase);
    setSerialCode(purchase.serialNumber); // real serial from DB — safe to prefill
    setSpecialClaimCode(''); // the claim code is a secret only the customer has — never prefilled
    setShowDropdown(false);
    setErrorMsg(purchase.claimed ? 'This watch has already had its warranty claimed.' : '');
  };

  // Submit claim warranty
  const handleClaimWarranty = async (e) => {
    e.preventDefault();
    if (!selectedPurchase || !serialCode.trim() || !specialClaimCode.trim()) {
      setErrorMsg('Please select a watch and enter the claim code from your invoice.');
      return;
    }
    if (selectedPurchase.claimed) {
      setErrorMsg('This watch has already had its warranty claimed.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/warranty/claim', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userName: ownerName,
          serialNumber: serialCode,
          specialCode: specialClaimCode,
          country,
          stateName,
          city,
          phoneNumber,
          ...(isAdmin ? { email: lookupEmail.trim() } : {})
        })
      });
      const data = await response.json();

      if (response.status === 401) {
        setErrorMsg('Your session has expired. Please log in again.');
        return;
      }

      if (data.success) {
        setVerificationResult(data.details);
        setStep('verified');
      } else {
        setErrorMsg(data.message || 'Warranty verification failed.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const resetDrawer = () => {
    setStep('details');
    setOwnerName(currentUser?.name || '');
    setLookupEmail(isAdmin ? '' : (currentUser?.email || ''));
    setPurchases([]);
    setWatchSearchText('');
    setSelectedPurchase(null);
    setSerialCode('');
    setSpecialClaimCode('');
    setCountry('India');
    setStateName('Maharashtra');
    setCity('');
    setPhoneNumber('');
    setCountrySearch('India');
    setShowCountryDropdown(false);
    setVerificationResult(null);
    setErrorMsg('');
  };

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        />
      )}

      {/* Sliding Drawer Panel */}
      <div className={`fixed right-0 top-0 h-full w-80 sm:w-96 bg-neutral-950 border-l border-white/10 z-50 shadow-2xl p-6 transition-transform duration-300 ease-in-out transform flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
        {/* Drawer Header */}
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="!text-luxury-gold w-5 h-5" />
            <h3 className="text-base font-bold uppercase tracking-widest !text-luxury-gold warranty-portal-title">Warranty Portal</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1 hover:bg-white/5 rounded-full cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-thin">

          {errorMsg && (
            <div className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 rounded text-[10px] uppercase font-bold tracking-wider">
              {errorMsg}
            </div>
          )}

          {/* Not logged in — warranty portal requires an account */}
          {!currentUser && (
            <div className="p-4 bg-neutral-900 border border-white/10 rounded text-center space-y-2">
              <Lock className="mx-auto text-gray-500" size={20} />
              <p className="text-[10px] !text-white warranty-portal-text uppercase tracking-wider !font-bold leading-relaxed">
                Please log in to look up and register your watch warranty.
              </p>
            </div>
          )}

          {/* STEP 1: Confirm Name, Email is locked to logged-in account */}
          {currentUser && step === 'details' && (
            <form onSubmit={handleRetrievePurchases} className="space-y-4 text-xs">
              <p className="text-[10px] !text-white warranty-portal-text leading-relaxed !font-bold uppercase tracking-wider">
                We'll retrieve watch purchases linked to your account.
              </p>

              {/* Owner Name */}
              <div className="space-y-1.5">
                <label className="text-[8px] warranty-portal-label !font-bold uppercase tracking-widest block">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <User size={12} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter owner name..."
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/15 rounded text-white placeholder-gray-400 p-2.5 pl-8 focus:outline-none focus:border-luxury-gold transition"
                  />
                </div>
              </div>

              {/* Owner Email — locked to the logged-in account for customers; admins can type any customer's email to look up their warranty */}
              <div className="space-y-1.5">
                <label className="text-[8px] warranty-portal-label !font-bold uppercase tracking-widest block">
                  Email Address{isAdmin ? ' (Customer)' : ''}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <Mail size={12} />
                  </span>
                  {isAdmin ? (
                    <input
                      type="email"
                      required
                      placeholder="Enter customer's email..."
                      value={lookupEmail}
                      onChange={(e) => setLookupEmail(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/15 rounded text-white placeholder-gray-400 p-2.5 pl-8 focus:outline-none focus:border-luxury-gold transition"
                    />
                  ) : (
                    <>
                      <input
                        type="email"
                        disabled
                        value={currentUser.email}
                        className="w-full bg-neutral-900/60 border border-white/15 rounded text-gray-200 p-2.5 pl-8 pr-8 cursor-not-allowed"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600" title="Locked to your account">
                        <Lock size={12} />
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Country & State side by side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Country Search Select */}
                <div className="space-y-1.5 relative">
                  <label className="text-[8px] warranty-portal-label !font-bold uppercase tracking-widest block">Country</label>
                  <input
                    type="text"
                    required
                    value={countrySearch}
                    placeholder="Search country..."
                    onFocus={() => setShowCountryDropdown(true)}
                    onChange={(e) => {
                      setCountrySearch(e.target.value);
                      setShowCountryDropdown(true);
                      const matchingCountry = ALL_COUNTRIES.find(c => c.name.toLowerCase() === e.target.value.toLowerCase());
                      if (matchingCountry) {
                        setCountry(matchingCountry.name);
                        setStateName(matchingCountry.name === 'India' ? 'Maharashtra' : '');
                      }
                    }}
                    className="w-full bg-neutral-900 border border-white/15 rounded text-white placeholder-gray-400 p-2.5 focus:outline-none focus:border-luxury-gold transition"
                  />
                  {showCountryDropdown && (
                    <div className="absolute left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-md shadow-2xl max-h-40 overflow-y-auto z-[60] scrollbar-thin">
                      {(countrySearch.trim() === ''
                        ? ALL_COUNTRIES
                        : ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
                      ).map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => {
                            setCountry(c.name);
                            setCountrySearch(c.name);
                            setShowCountryDropdown(false);
                            setStateName(c.name === 'India' ? 'Maharashtra' : '');
                          }}
                          className="w-full text-left px-3 py-2 text-[10px] text-gray-300 hover:bg-luxury-gold/10 hover:text-luxury-gold transition border-b border-white/5 last:border-0 cursor-pointer"
                        >
                          {c.name} ({c.code})
                        </button>
                      ))}
                      {ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-[10px] text-gray-500">No countries found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* State Select / Text input */}
                <div className="space-y-1.5">
                  <label className="text-[8px] warranty-portal-label !font-bold uppercase tracking-widest block">State</label>
                  {country === 'India' ? (
                    <select
                      required
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/15 rounded text-white p-2.5 focus:outline-none focus:border-luxury-gold transition max-h-40 overflow-y-auto scrollbar-thin"
                      style={{ colorScheme: 'dark' }}
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s} style={{ background: '#171717', color: '#fff' }}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Enter state..."
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/15 rounded text-white placeholder-gray-400 p-2.5 focus:outline-none focus:border-luxury-gold transition"
                    />
                  )}
                </div>
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className="text-[8px] warranty-portal-label !font-bold uppercase tracking-widest block">City</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your city..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/15 rounded text-white placeholder-gray-400 p-2.5 focus:outline-none focus:border-luxury-gold transition"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-[8px] warranty-portal-label !font-bold uppercase tracking-widest block">Phone Number</label>
                <div className="flex space-x-2">
                  <div className="bg-neutral-900 border border-white/15 text-gray-100 font-mono text-xs px-3 py-2.5 rounded flex items-center justify-center min-w-[55px]">
                    {ALL_COUNTRIES.find(c => c.name === country)?.code || '+91'}
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="Enter phone number..."
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 bg-neutral-900 border border-white/15 rounded text-white placeholder-gray-400 p-2.5 focus:outline-none focus:border-luxury-gold transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-luxury-gold hover:bg-luxury-gold-dark disabled:bg-gray-700 disabled:text-gray-400 text-neutral-950 hover:text-white font-bold text-xs uppercase tracking-widest rounded transition cursor-pointer"
              >
                {loading ? 'Retrieving Records...' : 'Retrieve Purchased Watches'}
              </button>
            </form>
          )}

          {/* STEP 2: Select Watch & Verify Codes */}
          {currentUser && step === 'watch-select' && (
            <form onSubmit={handleClaimWarranty} className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <p className="text-[9px] !text-white warranty-portal-text uppercase tracking-widest !font-bold">Purchases Found: {purchases.length}</p>
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="!text-white hover:underline text-[9px] uppercase !font-bold"
                >
                  Back
                </button>
              </div>

              {/* Watch Name Dropdown Input */}
              <div className="space-y-1.5 relative">
                <label className="text-[8px] warranty-portal-label !font-bold uppercase tracking-widest block">Name of Watch</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Start typing to select watch..."
                    value={watchSearchText}
                    onFocus={() => setShowDropdown(true)}
                    onChange={(e) => {
                      setWatchSearchText(e.target.value);
                      setShowDropdown(true);
                      setSelectedPurchase(null);
                    }}
                    className="w-full bg-neutral-900 border border-white/15 rounded text-white placeholder-gray-400 p-2.5 focus:outline-none focus:border-luxury-gold transition"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                    <Search size={14} />
                  </span>
                </div>

                {/* Suggestions Dropdown */}
                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-neutral-900 border border-white/10 rounded-md shadow-2xl max-h-40 overflow-y-auto z-[60] scrollbar-thin">
                    {suggestions.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectWatch(p)}
                        className="w-full text-left px-3 py-2.5 text-[10px] !text-white hover:bg-luxury-gold/10 hover:!text-luxury-gold transition border-b border-white/5 last:border-0 cursor-pointer flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5 font-semibold !text-white">
                          {p.name}
                          {p.claimed && <span className="text-[7px] text-emerald-500 border border-emerald-500/40 rounded px-1">CLAIMED</span>}
                        </span>
                        <span className="text-[8px] !text-gray-400 font-mono">{p.orderId}</span>
                      </button>
                    ))}
                  </div>
                )}

                {suggestions.length === 0 && purchases.length === 0 && (
                  <p className="text-[9px] !text-white warranty-portal-text uppercase tracking-wider pt-1">
                    No eligible watch purchases found on your account.
                  </p>
                )}
              </div>

              {/* Watch Image Display Area */}
              {selectedPurchase && (
                <div className="bg-neutral-900/80 border border-luxury-gold/20 rounded p-3 flex items-center space-x-3 animate-scale-in">
                  <img
                    src={selectedPurchase.image}
                    alt={selectedPurchase.name}
                    className="w-14 h-14 object-cover rounded bg-black/40 border border-white/5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] !text-white warranty-portal-text !font-bold uppercase tracking-wider">Purchase Match</p>
                    <p className="text-white font-bold truncate text-[11px]">{selectedPurchase.name}</p>
                    <p className="!text-white warranty-portal-muted text-[9px]">Purchased on {selectedPurchase.date}</p>
                    <p className="!text-white warranty-portal-muted text-[9px]">Warranty: <span className="!text-white !font-bold">{selectedPurchase.warrantyMonths} Months</span></p>
                    {selectedPurchase.claimed && (
                      <p className="text-emerald-500 text-[9px] font-bold uppercase mt-0.5">Already Claimed</p>
                    )}
                  </div>
                </div>
              )}

              {/* Serial Code — read-only, pulled from real order data */}
              <div className="space-y-1.5">
                <label className="text-[8px] warranty-portal-label !font-bold uppercase tracking-widest block">Serial Number</label>
                <input
                  type="text"
                  required
                  readOnly
                  value={serialCode}
                  placeholder="Select a watch above"
                  className="w-full bg-neutral-900/60 border border-white/10 rounded text-black p-2.5 cursor-not-allowed font-mono uppercase"
                />
              </div>

              {/* Special Code to Claim Warranty — the only thing the customer must supply */}
              <div className="space-y-1.5">
                <label className="text-[8px] warranty-portal-label !font-bold uppercase tracking-widest block">Claim Code (from your order invoice)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CLM-XXXXXXXXXX"
                  value={specialClaimCode}
                  onChange={(e) => setSpecialClaimCode(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded text-white p-2.5 focus:outline-none focus:border-luxury-gold transition font-mono uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !selectedPurchase || selectedPurchase.claimed}
                className="w-full py-2.5 bg-luxury-gold hover:bg-luxury-gold-dark disabled:bg-gray-700 disabled:text-gray-400 text-neutral-950 font-bold text-xs uppercase tracking-widest rounded transition cursor-pointer"
              >
                {loading ? 'Verifying Codes...' : 'Claim & Activate Warranty'}
              </button>
            </form>
          )}

          {/* STEP 3: Verification Result Card */}
          {currentUser && step === 'verified' && verificationResult && (
            <div className="space-y-5 animate-scale-in text-center">
              <div className="flex flex-col items-center justify-center space-y-2">
                <CheckCircle className="text-emerald-400 w-12 h-12" />
                <h4 className="text-sm font-bold uppercase tracking-widest text-white">Warranty Claimed</h4>
                <p className="text-[9px] text-emerald-400 font-mono tracking-widest uppercase bg-emerald-500/10 px-3 py-1 rounded-full">
                  Status: {verificationResult.status}
                </p>
              </div>

              <div className="bg-neutral-900 border border-white/10 rounded p-4 text-left space-y-2.5 text-[11px] leading-relaxed">
                <div>
                  <span className="!text-white warranty-portal-muted block text-[8px] uppercase tracking-wider !font-bold">Watch Owner</span>
                  <span className="text-white font-medium">{verificationResult.registeredTo}</span>
                </div>
                <div>
                  <span className="!text-white warranty-portal-muted block text-[8px] uppercase tracking-wider !font-bold">Registered Email</span>
                  <span className="text-white font-medium">{verificationResult.registeredEmail}</span>
                </div>
                <div>
                  <span className="!text-white warranty-portal-muted block text-[8px] uppercase tracking-wider !font-bold">Model</span>
                  <span className="text-white font-medium">{verificationResult.watchModel}</span>
                </div>
                <div>
                  <span className="!text-white warranty-portal-muted block text-[8px] uppercase tracking-wider !font-bold">Serial Number</span>
                  <span className="text-white font-mono">{verificationResult.serialNumber}</span>
                </div>
                <div>
                  <span className="!text-white warranty-portal-muted block text-[8px] uppercase tracking-wider !font-bold">Warranty Claim Code</span>
                  <span className="text-white font-mono">{verificationResult.claimCode}</span>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <span className="!text-white warranty-portal-muted block text-[8px] uppercase tracking-wider !font-bold">Expiration Date</span>
                  <span className="!text-white !font-bold">{verificationResult.expiryDate}</span>
                </div>
              </div>

              <button
                onClick={resetDrawer}
                className="w-full py-2 bg-neutral-900 border border-white/15 hover:border-white/35 text-white font-bold text-xs uppercase tracking-widest rounded transition cursor-pointer"
              >
                Register Another Watch
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}