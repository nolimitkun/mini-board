import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { vmApi } from '../../services/api';

const VMFilters = ({ filters, onFiltersChange, onReset }) => {
  const [providers, setProviders] = useState([]);
  const [regions, setRegions] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    // Load providers
    vmApi.getProviders()
      .then(response => setProviders(response.data.providers))
      .catch(console.error);

    // Load regions
    vmApi.getRegions()
      .then(response => setRegions(response.data.regions))
      .catch(console.error);
  }, []);

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
    setShowAdvanced(false);
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== null && value !== undefined && value !== '' && 
    (Array.isArray(value) ? value.length > 0 : true)
  );

  return (
    <div className="card mb-6">
      <div className="card-body">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Providers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cloud Providers
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {providers.map(provider => (
                <label key={provider} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(filters.providers || []).includes(provider)}
                    onChange={() => handleProviderToggle(provider)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
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
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between border-t pt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Filters</span>
          </button>

          <div className="flex items-center space-x-2">
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

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            {/* GPU Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPU Requirements
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.has_gpu || false}
                    onChange={(e) => handleInputChange('has_gpu', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Has GPU
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="GPU name (e.g., V100, A100)"
                  value={filters.gpu_name || ''}
                  onChange={(e) => handleInputChange('gpu_name', e.target.value)}
                  className="input"
                  disabled={!filters.has_gpu}
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

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filters.sort_by || 'price'}
                  onChange={(e) => handleInputChange('sort_by', e.target.value)}
                  className="input"
                >
                  <option value="price">Price</option>
                  <option value="spot_price">Spot Price</option>
                  <option value="vcpus">vCPUs</option>
                  <option value="memory">Memory</option>
                  <option value="gpu_count">GPU Count</option>
                </select>
                <select
                  value={filters.sort_order || 'asc'}
                  onChange={(e) => handleInputChange('sort_order', e.target.value)}
                  className="input"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default VMFilters;
