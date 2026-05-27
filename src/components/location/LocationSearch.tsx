"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, X } from "lucide-react";

interface LocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function LocationSearch({ value, onChange, placeholder = "Konum ara..." }: LocationSearchProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/location/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Location search error:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    searchLocations(newValue);
  };

  const handleSelectLocation = (location: any) => {
    const addr = location.address || {};
    const parts = location.display_name.split(',').map((p: string) => p.trim());
    
    const district = addr.town || addr.suburb || addr.city_district || addr.district || addr.subdistrict || parts[0];
    const city = addr.province || addr.city || addr.state || "";
    
    let locationName = district;
    if (city && city.toLowerCase() !== district.toLowerCase()) {
      locationName = `${city}, ${district}`;
    }
    
    setQuery(locationName);
    onChange(locationName);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    setQuery("");
    onChange("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-[#f58220] dark:focus:border-[#f58220] focus:ring-1 focus:ring-[#f58220] bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-center text-xs text-slate-400 dark:text-slate-500">Aranıyor...</div>
          ) : (
            suggestions.map((location, index) => {
              const addr = location.address || {};
              const parts = location.display_name.split(',').map((p: string) => p.trim());
              const district = addr.town || addr.suburb || addr.city_district || addr.district || addr.subdistrict || parts[0];
              const city = addr.province || addr.city || addr.state || "";
              
              let suggestionTitle = district;
              if (city && city.toLowerCase() !== district.toLowerCase()) {
                suggestionTitle = `${city}, ${district}`;
              }
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectLocation(location)}
                  className="w-full px-4 py-2.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors border-b border-slate-100 dark:border-slate-800/60 last:border-b-0"
                >
                  <div className="font-semibold text-slate-700 dark:text-slate-200">{suggestionTitle}</div>
                  <div className="text-slate-400 dark:text-slate-555 truncate mt-0.5">{location.display_name}</div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
