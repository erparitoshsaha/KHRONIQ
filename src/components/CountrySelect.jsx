import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { ALL_COUNTRY_NAMES } from '../constants/countries';

export default function CountrySelect({
  value = 'India',
  onChange,
  className = '',
  id = 'country-select',
  name = 'country',
  required = true,
  placeholder = 'Search country...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || 'India');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync internal search query when external value changes
  useEffect(() => {
    if (value) {
      setSearchQuery(value);
    }
  }, [value]);

  // Filter and prioritize countries: exact/prefix match first, then substring
  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // Show India first, then the rest
      return ['India', ...ALL_COUNTRY_NAMES.filter(c => c !== 'India')];
    }
    return ALL_COUNTRY_NAMES.filter(c => c.toLowerCase().includes(q))
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const aStarts = aLower.startsWith(q);
        const bStarts = bLower.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.localeCompare(b);
      });
  }, [searchQuery]);

  // Scroll active item into view when highlightedIndex changes
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-country-item]');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        // If query matches a country exactly or case-insensitively, select it
        const match = ALL_COUNTRY_NAMES.find(
          c => c.toLowerCase() === searchQuery.trim().toLowerCase()
        );
        if (match) {
          onChange(match);
          setSearchQuery(match);
        } else {
          // Revert to valid value
          setSearchQuery(value || 'India');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery, value, onChange]);

  const handleSelect = (country) => {
    onChange(country);
    setSearchQuery(country);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredCountries.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredCountries.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredCountries.length) {
        handleSelect(filteredCountries[highlightedIndex]);
      } else if (filteredCountries.length > 0) {
        handleSelect(filteredCountries[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery(value || 'India');
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchQuery('');
    setIsOpen(true);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          autoComplete="off"
          required={required}
          value={searchQuery}
          placeholder={placeholder}
          onClick={() => {
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className={`${className} pr-14`}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
          {searchQuery && isOpen && (
            <button
              type="button"
              onClick={handleClear}
              className="pointer-events-auto p-1 text-neutral-400 hover:text-neutral-700 transition"
              aria-label="Clear country selection"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={`text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-md shadow-2xl z-50 overflow-hidden">
          <ul
            ref={listRef}
            className="max-h-56 overflow-y-auto py-1 text-xs sm:text-sm divide-y divide-neutral-50"
            role="listbox"
          >
            {filteredCountries.length === 0 ? (
              <li className="px-3.5 py-4 text-center text-xs text-neutral-500 flex flex-col items-center gap-1">
                <Search size={16} className="text-neutral-400" />
                <span>No countries matching "{searchQuery}"</span>
              </li>
            ) : (
              filteredCountries.map((country, idx) => {
                const isSelected = String(value || '').toLowerCase() === country.toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={`${country}-${idx}`}
                    data-country-item
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(country);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                      isHighlighted
                        ? 'bg-neutral-100 text-neutral-900 font-medium'
                        : isSelected
                        ? 'bg-neutral-50 text-neutral-900 font-medium'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <span className="truncate">{country}</span>
                    {isSelected && (
                      <Check size={14} className="text-black shrink-0 ml-2" />
                    )}
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
