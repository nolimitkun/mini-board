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
        const list = response.data.providers;
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

  return (
    <div className="card mb-4">
      <div className="card-body py-3">
        {/* All Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mb-3">
          {/* Providers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cloud Providers
            </label>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              <label className="flex items-center text-xs font-medium border-b border-gray-100 pb-1 mb-1">
                <input
                  type="checkbox"
                  checked={allProvidersSelected}
                  ref={el => { if (el) el.indeterminate = someProvidersSelected; }}
                  onChange={handleSelectAllProviders}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3 h-3"
                />
                <span className="ml-1 text-gray-900">
                  Select All
                </span>
              </label>
              {providers.map(provider => (
                <label key={provider} className="flex items-center text-xs">
                  <input
                    type="checkbox"
                    checked={selectedProviders.includes(provider)}
                    onChange={() => handleProviderToggle(provider)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3 h-3"
                  />
                  <span className="ml-1 text-gray-700 capitalize">
                    {provider}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* vCPUs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              vCPUs
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Memory (GiB)
            </label>
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

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Price ($/hour)
            </label>
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

          {/* GPU Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GPU Requirements
            </label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="GPU name (e.g., H100, A100)"
                value={filters.gpu_name || ''}
                onChange={(e) => handleInputChange('gpu_name', e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Region
            </label>
            <select
              value={filters.region || ''}
              onChange={(e) => handleInputChange('region', e.target.value)}
              className="input"
            >
              <option value="">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>


          {/* Data Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Quality
            </label>
            <label className="flex items-center text-xs mt-2">
              <input
                type="checkbox"
                checked={filters.hide_incomplete !== false}
                onChange={(e) => handleInputChange('hide_incomplete', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3 h-3"
              />
              <span className="ml-1 text-gray-700">
                Hide unpriced entries
              </span>
            </label>
          </div>

          {/* Results Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Results Limit
            </label>
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
          {/* Clear Filters Button */}
          <div className="flex justify-end">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn-secondary flex items-center space-x-2 text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>


      </div>
    </div>
  );
};

export default VMFilters;
