import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, ChevronDown, Check, Globe, Search } from 'lucide-react';
import { ALL_COUNTRY_NAMES } from '../constants/countries';
import { setCurrencyAction, selectCurrentCurrency } from '../store/slices/watchSlice';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'ar', name: 'Arabic (العربية)' }
];

export default function CountryLocationModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const currentCurrency = useSelector(selectCurrentCurrency);

  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);

  const countryDropdownRef = useRef(null);
  const languageDropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Initialize from localStorage or defaults
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCountry = localStorage.getItem('khroniq_shipping_country');
      const savedLang = localStorage.getItem('khroniq_shipping_language');
      if (savedCountry) setSelectedCountry(savedCountry);
      if (savedLang) setSelectedLanguage(savedLang);
    }
  }, [isOpen]);

  // Focus search input when country dropdown opens
  useEffect(() => {
    if (countryDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [countryDropdownOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setCountryDropdownOpen(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(e.target)) {
        setLanguageDropdownOpen(false);
      }
    }
    if (countryDropdownOpen || languageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [countryDropdownOpen, languageDropdownOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (countryDropdownOpen) {
          setCountryDropdownOpen(false);
        } else if (languageDropdownOpen) {
          setLanguageDropdownOpen(false);
        } else if (isOpen) {
          handleDismiss();
        }
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, countryDropdownOpen, languageDropdownOpen]);

  // Filter countries for search
  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) {
      return ['India', ...ALL_COUNTRY_NAMES.filter(c => c !== 'India')];
    }
    return ALL_COUNTRY_NAMES.filter(c => c.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(q);
        const bStarts = b.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.localeCompare(b);
      });
  }, [countrySearch]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('khroniq_country_modal_seen', 'true');
    }
    onClose();
  };

  const handleSaveAndShop = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('khroniq_country_modal_seen', 'true');
      localStorage.setItem('khroniq_shipping_country', selectedCountry);
      localStorage.setItem('khroniq_shipping_language', selectedLanguage);
    }

    // Auto-map appropriate currency if available
    if (selectedCountry === 'India') {
      dispatch(setCurrencyAction('INR'));
    } else if (
      ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Austria', 'Ireland', 'Portugal', 'Greece', 'Finland'].includes(selectedCountry)
    ) {
      dispatch(setCurrencyAction('EUR'));
    } else {
      dispatch(setCurrencyAction('USD'));
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 sm:p-8 relative border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="country-modal-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition cursor-pointer"
          aria-label="Close country selector"
        >
          <X size={18} />
        </button>

        {/* Header content */}
        <div className="pr-8">
          <h2
            id="country-modal-title"
            className="font-serif text-xl sm:text-2xl font-bold text-gray-900 tracking-tight"
          >
            Where are you shopping from?
          </h2>

          <h3 className="text-xs sm:text-sm font-bold text-gray-900 mt-2.5 tracking-normal">
            Please select your shipping country.
          </h3>

          <p className="text-[11px] sm:text-xs text-gray-500 mt-2 leading-relaxed">
            Buy from the country of your choice. Remember that we can only ship your order to addresses located in the chosen country.
          </p>
        </div>

        {/* Dropdown selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {/* Country Selection */}
          <div className="space-y-1.5 relative" ref={countryDropdownRef}>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">
              Country
            </label>
            <button
              type="button"
              onClick={() => {
                setCountryDropdownOpen(!countryDropdownOpen);
                setLanguageDropdownOpen(false);
              }}
              className="w-full h-11 px-3 bg-white border border-gray-300 hover:border-gray-500 rounded text-left flex items-center justify-between text-xs text-gray-900 font-medium transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-black"
            >
              <span className="truncate pr-2">{selectedCountry}</span>
              <ChevronDown size={15} className={`text-gray-500 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Country Dropdown Menu */}
            {countryDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl z-50 overflow-hidden">
                <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center space-x-1.5">
                  <Search size={13} className="text-gray-400 flex-shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search country..."
                    className="w-full bg-transparent text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                  {countrySearch && (
                    <button
                      type="button"
                      onClick={() => setCountrySearch('')}
                      className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto divide-y divide-gray-50 py-1">
                  {filteredCountries.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-gray-400 italic">
                      No matching country found
                    </div>
                  ) : (
                    filteredCountries.map((c) => {
                      const isSelected = selectedCountry === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c);
                            setCountryDropdownOpen(false);
                            setCountrySearch('');
                          }}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-gray-100 transition cursor-pointer ${
                            isSelected ? 'bg-gray-50 text-black font-bold' : 'text-gray-700'
                          }`}
                        >
                          <span className="truncate">{c}</span>
                          {isSelected && <Check size={14} className="text-emerald-600 flex-shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Language Selection */}
          <div className="space-y-1.5 relative" ref={languageDropdownRef}>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">
              Language
            </label>
            <button
              type="button"
              onClick={() => {
                setLanguageDropdownOpen(!languageDropdownOpen);
                setCountryDropdownOpen(false);
              }}
              className="w-full h-11 px-3 bg-white border border-gray-300 hover:border-gray-500 rounded text-left flex items-center justify-between text-xs text-gray-900 font-medium transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-black"
            >
              <span className="truncate pr-2">{selectedLanguage}</span>
              <ChevronDown size={15} className={`text-gray-500 transition-transform ${languageDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Language Dropdown Menu */}
            {languageDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl z-50 overflow-hidden py-1 max-h-48 overflow-y-auto divide-y divide-gray-50">
                {LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguage === lang.name;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSelectedLanguage(lang.name);
                        setLanguageDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-gray-100 transition cursor-pointer ${
                        isSelected ? 'bg-gray-50 text-black font-bold' : 'text-gray-700'
                      }`}
                    >
                      <span className="truncate">{lang.name}</span>
                      {isSelected && <Check size={14} className="text-emerald-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleSaveAndShop}
            className="w-full sm:w-auto px-8 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all duration-200 cursor-pointer shadow-md rounded-none"
            style={{ backgroundColor: '#111111', color: '#ffffff' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#047857')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#111111')}
          >
            Shop now
          </button>
        </div>
      </div>
    </div>
  );
}
