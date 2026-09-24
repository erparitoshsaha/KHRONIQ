import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { ALL_COUNTRIES, getCountryDialCode } from '../constants/countries';

export default function PhoneInput({
  value = '',
  onChange,
  country = 'India',
  placeholder = '98765 43210',
  required = false,
  disabled = false,
  id = 'phone-input',
  name = 'phone',
  theme = 'light', // 'light' | 'dark'
  className = ''
}) {
  // Extract initial dialing code and national number from value
  const parseValue = (rawVal, defaultCountry) => {
    const defaultCode = getCountryDialCode(defaultCountry, '+91');
    if (!rawVal || typeof rawVal !== 'string') {
      return { code: defaultCode, number: '' };
    }
    const trimmed = rawVal.trim();
    if (trimmed.startsWith('+')) {
      // Find matching country code sorted by length descending so longer codes match first (+1-869 before +1)
      const sorted = [...ALL_COUNTRIES].sort((a, b) => b.code.length - a.code.length);
      const matched = sorted.find(c => trimmed.startsWith(c.code));
      if (matched) {
        const rest = trimmed.slice(matched.code.length).trim();
        return { code: matched.code, number: rest };
      }
    }
    // Clean digits if no leading +
    const cleanNumber = trimmed.replace(/^[+]?\d{1,4}\s*/, '').replace(/\D/g, '') || trimmed.replace(/\D/g, '');
    return { code: defaultCode, number: cleanNumber };
  };

  const initial = useMemo(() => parseValue(value, country), []);
  const [dialCode, setDialCode] = useState(initial.code);
  const [phoneNumber, setPhoneNumber] = useState(initial.number);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sync dial code if external `country` prop changes
  useEffect(() => {
    if (country) {
      const code = getCountryDialCode(country);
      if (code) {
        setDialCode(code);
        // If there is an existing phone number, re-emit combined value with new code
        if (phoneNumber) {
          onChange(`${code} ${phoneNumber}`.trim());
        }
      }
    }
  }, [country]);

  // Sync if external `value` changes from outside (e.g. form reset or user load)
  useEffect(() => {
    const parsed = parseValue(value, country);
    if (parsed.code && parsed.code !== dialCode) {
      setDialCode(parsed.code);
    }
    if (parsed.number !== phoneNumber) {
      setPhoneNumber(parsed.number);
    }
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries for the code dropdown
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // Put India and US/UK at top, then rest
      const priority = ['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Canada', 'Australia'];
      const topItems = priority.map(name => ALL_COUNTRIES.find(c => c.name === name)).filter(Boolean);
      const rest = ALL_COUNTRIES.filter(c => !priority.includes(c.name));
      return [...topItems, ...rest];
    }
    return ALL_COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleNumberChange = (e) => {
    const raw = e.target.value;
    // Check if user pasted full international number like +1 234 567 8900
    if (raw.trim().startsWith('+')) {
      const parsed = parseValue(raw, country);
      setDialCode(parsed.code);
      setPhoneNumber(parsed.number);
      onChange(`${parsed.code} ${parsed.number}`.trim());
      return;
    }

    const clean = raw.replace(/[^\d\s-]/g, '');
    setPhoneNumber(clean);
    if (clean.trim()) {
      onChange(`${dialCode} ${clean}`.trim());
    } else {
      onChange('');
    }
  };

  const handleSelectCode = (code) => {
    setDialCode(code);
    setIsDropdownOpen(false);
    setSearchQuery('');
    if (phoneNumber.trim()) {
      onChange(`${code} ${phoneNumber}`.trim());
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`relative flex items-center w-full ${className}`} ref={dropdownRef}>
      {/* Country Code Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setIsDropdownOpen(!isDropdownOpen);
          if (!isDropdownOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }
        }}
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-l-md font-mono text-xs sm:text-sm border transition shrink-0 cursor-pointer select-none ${
          isDark
            ? 'bg-luxury-dark border-white/10 text-white hover:border-luxury-gold/50 focus:border-luxury-gold'
            : 'bg-neutral-50 border-neutral-300 text-neutral-800 hover:bg-neutral-100 border-r-0 focus:border-black'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isDropdownOpen}
      >
        <span className="font-semibold">{dialCode}</span>
        <ChevronDown size={13} className={`text-neutral-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Number Input Field */}
      <input
        id={id}
        name={name}
        type="tel"
        required={required}
        disabled={disabled}
        value={phoneNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        className={`flex-1 min-w-0 rounded-r-md px-3.5 py-2.5 text-xs sm:text-sm transition focus:outline-none ${
          isDark
            ? 'bg-luxury-dark border border-white/10 text-white placeholder-gray-500 focus:border-luxury-gold'
            : 'bg-white border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-black shipping-input'
        }`}
      />

      {/* Searchable Country Code Dropdown */}
      {isDropdownOpen && (
        <div
          className={`absolute left-0 top-full mt-1 w-72 sm:w-80 rounded-md shadow-2xl border z-50 overflow-hidden ${
            isDark
              ? 'bg-neutral-950 border-white/15 text-white'
              : 'bg-white border-neutral-200 text-neutral-900'
          }`}
        >
          {/* Search box inside dropdown */}
          <div className={`p-2 border-b flex items-center gap-2 ${isDark ? 'border-white/10 bg-neutral-900' : 'border-neutral-100 bg-neutral-50'}`}>
            <Search size={14} className="text-neutral-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country or code..."
              className={`w-full text-xs bg-transparent focus:outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-neutral-900 placeholder-neutral-400'}`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-neutral-400 hover:text-neutral-600 p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* List of Countries with Dial Codes */}
          <ul className="max-h-56 overflow-y-auto py-1 text-xs divide-y divide-neutral-100 dark:divide-white/5" role="listbox">
            {filteredCountries.length === 0 ? (
              <li className="px-3.5 py-3 text-center text-neutral-400 text-xs">
                No matching country found
              </li>
            ) : (
              filteredCountries.map((c, i) => {
                const isSelected = c.code === dialCode;
                return (
                  <li
                    key={`${c.name}-${c.code}-${i}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectCode(c.code)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                      isDark
                        ? isSelected
                          ? 'bg-luxury-gold/20 text-luxury-gold font-bold'
                          : 'hover:bg-white/10 text-neutral-200'
                        : isSelected
                        ? 'bg-neutral-100 text-black font-semibold'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <span className="truncate pr-2">{c.name}</span>
                    <span className="font-mono text-[11px] text-neutral-400 shrink-0 flex items-center gap-1.5">
                      <span>{c.code}</span>
                      {isSelected && <Check size={13} className={isDark ? 'text-luxury-gold' : 'text-black'} />}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
