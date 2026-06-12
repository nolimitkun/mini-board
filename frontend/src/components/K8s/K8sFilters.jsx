import React from 'react';
import { X } from 'lucide-react';
import { getProviders } from '../../data/k8sServices';

const allProviders = getProviders();

const K8sFilters = ({ filters, onFiltersChange, onReset }) => {
  const selectedProviders = filters.providers || [];
  const allSelected = selectedProviders.length === allProviders.length;
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
    selectedProviders.length < allProviders.length ||
    filters.min_vcpus || filters.max_vcpus ||
    filters.min_memory || filters.max_memory ||
    filters.max_price || filters.gpu_name ||
    filters.has_gpu || filters.region ||
    filters.eligible_only === false;

  const labelClass = 'block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1';
  const checkboxClass = 'rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4';

  return (
    <div className="card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-medium text-gray-800">Worker node filters</h2>
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
        {/* Providers */}
        <div>
          <label className={labelClass}>Cloud providers</label>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
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

        {/* Node-pool eligibility */}
        <div>
          <label className={labelClass}>Node pools</label>
          <label className="flex items-center text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filters.eligible_only !== false}
              onChange={(e) => handleInputChange('eligible_only', e.target.checked)}
              className={checkboxClass}
            />
            <span className="ml-2 text-gray-700">Eligible worker shapes only</span>
          </label>
          <p className="mt-1 text-[11px] leading-snug text-gray-400">
            Hides VM shapes each managed K8s service doesn't accept as nodes.
          </p>
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
              step="1"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.max_vcpus || ''}
              onChange={(e) => handleInputChange('max_vcpus', e.target.value)}
              className="input"
              min="0"
              step="1"
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
              step="1"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.max_memory || ''}
              onChange={(e) => handleInputChange('max_memory', e.target.value)}
              className="input"
              min="0"
              step="1"
            />
          </div>
        </div>

        {/* Max price */}
        <div>
          <label className={labelClass}>Max node price ($/hr)</label>
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
          <label className={labelClass}>GPU</label>
          <label className="flex items-center text-sm cursor-pointer mb-1.5">
            <input
              type="checkbox"
              checked={!!filters.has_gpu}
              onChange={(e) => handleInputChange('has_gpu', e.target.checked)}
              className={checkboxClass}
            />
            <span className="ml-2 text-gray-700">GPU nodes only</span>
          </label>
          <input
            type="text"
            placeholder="GPU name, e.g. H100"
            value={filters.gpu_name || ''}
            onChange={(e) => handleInputChange('gpu_name', e.target.value)}
            className="input"
          />
        </div>

        {/* Region */}
        <div>
          <label className={labelClass}>Region contains</label>
          <input
            type="text"
            placeholder="e.g. us-east, eu"
            value={filters.region || ''}
            onChange={(e) => handleInputChange('region', e.target.value)}
            className="input"
          />
        </div>
      </div>
    </div>
  );
};

export default K8sFilters;
