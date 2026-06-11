import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { vmApi } from '../../services/api';

const VMFilters = ({ filters, onFiltersChange, onReset }) => {
  const [providers, setProviders] = useState([]);
  const [regions, setRegions] = useState([]);
  const didDefaultProviders = useRef(false);

  useEffect(() => {
    // Load providers
    vmApi.getProviders()
      .then(response => {
        const list = [...response.data.providers].sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: 'base' })
        );
        setProviders(list);
        // Select all providers by default (once), unless the user already has a selection
        if (!didDefaultProviders.current && (filters.providers || []).length === 0) {
          didDefaultProviders.current = true;
          onFiltersChange({ ...filters, providers: list });
        }
      })
      .catch(console.error);

    // Load regions
    vmApi.getRegions()
      .then(response => setRegions(response.data.regions))
      .catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedProviders = filters.providers || [];
  const allProvidersSelected = providers.length > 0 && selectedProviders.length === providers.length;
  const someProvidersSelected = selectedProviders.length > 0 && !allProvidersSelected;

  const handleSelectAllProviders = () => {
    handleInputChange('providers', allProvidersSelected ? [] : [...providers]);
  };

  const handleInputChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const handleProviderToggle = (provider) => {
    const currentProviders = filters.providers || [];
    const newProviders = currentProviders.includes(provider)
      ? currentProviders.filter(p => p !== provider)
      : [...currentProviders, provider];

    handleInputChange('providers', newProviders);
  };

  const clearFilters = () => {
    onReset();
  };

  const hasActiveFilters = Object.values(filters).some(value =>
    value !== null && value !== undefined && value !== '' &&
    (Array.isArray(value) ? value.length > 0 : true)
  );

  const labelClass = "block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1";
  const checkboxClass = "rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4";

  return (
    <div className="card">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-800">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Providers */}
        <div>
          <label className={labelClass}>Cloud providers</label>
          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
            <label className="flex items-center text-sm font-medium border-b border-gray-100 pb-1.5 mb-1">
              <input
                type="checkbox"
                checked={allProvidersSelected}
                ref={el => { if (el) el.indeterminate = someProvidersSelected; }}
                onChange={handleSelectAllProviders}
                className={checkboxClass}
              />
              <span className="ml-2 text-gray-900">Select all</span>
            </label>
            {providers.map(provider => (
              <label key={provider} className="flex items-center text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedProviders.includes(provider)}
                  onChange={() => handleProviderToggle(provider)}
                  className={checkboxClass}
                />
                <span className="ml-2 text-gray-700 capitalize">{provider}</span>
              </label>
            ))}
          </div>
        </div>

        {/* vCPUs */}
        <div>
          <label className={labelClass}>vCPUs</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.min_vcpus || ''}
              onChange={(e) => handleInputChange('min_vcpus', e.target.value)}
              className="input"
              min="0"
              step="0.5"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.max_vcpus || ''}
              onChange={(e) => handleInputChange('max_vcpus', e.target.value)}
              className="input"
              min="0"
              step="0.5"
            />
          </div>
        </div>

        {/* Memory */}
        <div>
          <label className={labelClass}>Memory (GiB)</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.min_memory || ''}
              onChange={(e) => handleInputChange('min_memory', e.target.value)}
              className="input"
              min="0"
              step="0.5"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.max_memory || ''}
              onChange={(e) => handleInputChange('max_memory', e.target.value)}
              className="input"
              min="0"
              step="0.5"
            />
          </div>
        </div>

        {/* Max Price */}
        <div>
          <label className={labelClass}>Max price ($/hour)</label>
          <input
            type="number"
            placeholder="e.g., 2.50"
            value={filters.max_price || ''}
            onChange={(e) => handleInputChange('max_price', e.target.value)}
            className="input"
            min="0"
            step="0.01"
          />
        </div>

        {/* GPU */}
        <div>
          <label className={labelClass}>GPU name</label>
          <input
            type="text"
            placeholder="e.g., H100, A100"
            value={filters.gpu_name || ''}
            onChange={(e) => handleInputChange('gpu_name', e.target.value)}
            className="input"
          />
        </div>

        {/* Region */}
        <div>
          <label className={labelClass}>Region</label>
          <select
            value={filters.region || ''}
            onChange={(e) => handleInputChange('region', e.target.value)}
            className="input"
          >
            <option value="">All regions</option>
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        {/* Results Limit */}
        <div>
          <label className={labelClass}>Results limit</label>
          <select
            value={filters.limit || 100}
            onChange={(e) => handleInputChange('limit', parseInt(e.target.value))}
            className="input"
          >
            <option value={50}>50 results</option>
            <option value={100}>100 results</option>
            <option value={200}>200 results</option>
            <option value={500}>500 results</option>
            <option value={1000}>1000 results</option>
          </select>
        </div>

        {/* Data Quality */}
        <div className="pt-2 border-t border-gray-100">
          <label className="flex items-center text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filters.hide_incomplete !== false}
              onChange={(e) => handleInputChange('hide_incomplete', e.target.checked)}
              className={checkboxClass}
            />
            <span className="ml-2 text-gray-700">Hide unpriced entries</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default VMFilters;
