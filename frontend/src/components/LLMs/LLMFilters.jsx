import React from 'react';
import { X } from 'lucide-react';

const LLMFilters = ({ filters, onFiltersChange, onReset, providers = [] }) => {
  const allProviders = providers;
  const selectedProviders = filters.providers || [];
  const allSelected = allProviders.length > 0 && selectedProviders.length === allProviders.length;
  const someSelected = selectedProviders.length > 0 && !allSelected;

  const handleInputChange = (field, value) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handleSelectAll = () => {
    handleInputChange('providers', allSelected ? [] : [...allProviders]);
  };

  const handleProviderToggle = (provider) => {
    const next = selectedProviders.includes(provider)
      ? selectedProviders.filter((p) => p !== provider)
      : [...selectedProviders, provider];
    handleInputChange('providers', next);
  };

  const hasActiveFilters =
    (allProviders.length > 0 && selectedProviders.length < allProviders.length) ||
    filters.search ||
    filters.min_context ||
    filters.max_input_price ||
    filters.vision_only;

  const labelClass = 'block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1';
  const checkboxClass = 'rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4';

  return (
    <div className="card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-800">Model filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center space-x-1 text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Search */}
        <div>
          <label className={labelClass}>Search</label>
          <input
            type="text"
            placeholder="Model or developer"
            value={filters.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
            className="input"
          />
        </div>

        {/* Providers */}
        <div>
          <label className={labelClass}>Cloud providers</label>
          <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
            <label className="flex items-center text-sm font-medium border-b border-gray-100 pb-1.5 mb-1">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onChange={handleSelectAll}
                className={checkboxClass}
              />
              <span className="ml-2 text-gray-900">Select all</span>
            </label>
            {allProviders.map((provider) => (
              <label key={provider} className="flex items-center text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedProviders.includes(provider)}
                  onChange={() => handleProviderToggle(provider)}
                  className={checkboxClass}
                />
                <span className="ml-2 text-gray-700 uppercase">{provider}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Min context window */}
        <div>
          <label className={labelClass}>Min context (K tokens)</label>
          <input
            type="number"
            placeholder="e.g. 200"
            value={filters.min_context || ''}
            onChange={(e) => handleInputChange('min_context', e.target.value)}
            className="input"
            min="0"
            step="1"
          />
        </div>

        {/* Max input price */}
        <div>
          <label className={labelClass}>Max input $/1M tokens</label>
          <input
            type="number"
            placeholder="e.g. 5.00"
            value={filters.max_input_price || ''}
            onChange={(e) => handleInputChange('max_input_price', e.target.value)}
            className="input"
            min="0"
            step="0.01"
          />
        </div>

        {/* Modality */}
        <div>
          <label className={labelClass}>Modality</label>
          <label className="flex items-center text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={!!filters.vision_only}
              onChange={(e) => handleInputChange('vision_only', e.target.checked)}
              className={checkboxClass}
            />
            <span className="ml-2 text-gray-700">Vision-capable only</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default LLMFilters;
