import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import { vmApi } from '../services/api';
import Layout from '../components/Layout/Layout';
import VMFilters from '../components/VMs/VMFilters';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

const VMBrowser = () => {
  const [filters, setFilters] = useState({
    providers: [],
    limit: 100,
    gpu_name: 'H100'
  });
  const [selectedVMs, setSelectedVMs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'price', direction: 'asc' });

  const {
    data: vmData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['vms', filters],
    () => vmApi.getVMs(filters),
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
    }
  );

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleFiltersReset = () => {
    setFilters({
      providers: [],
      limit: 100,
      gpu_name: 'H100'
    });
  };

  const handleVMSelect = (vm) => {
    const vmKey = `${vm.provider}-${vm.instance_type}-${vm.region}`;
    setSelectedVMs(prev => {
      const isSelected = prev.some(selected => 
        `${selected.provider}-${selected.instance_type}-${selected.region}` === vmKey
      );
      
      if (isSelected) {
        return prev.filter(selected => 
          `${selected.provider}-${selected.instance_type}-${selected.region}` !== vmKey
        );
      } else {
        return [...prev, vm];
      }
    });
  };

  const isVMSelected = (vm) => {
    const vmKey = `${vm.provider}-${vm.instance_type}-${vm.region}`;
    return selectedVMs.some(selected => 
      `${selected.provider}-${selected.instance_type}-${selected.region}` === vmKey
    );
  };

  const rawVms = vmData?.data?.vms || [];
  const totalCount = vmData?.data?.total_count || 0;
  const filteredCount = vmData?.data?.filtered_count || 0;

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort VMs based on current sort configuration
  const vms = useMemo(() => {
    const sortableVMs = [...rawVms];
    if (sortConfig.key) {
      sortableVMs.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle null/undefined values
        if (aValue === null || aValue === undefined) aValue = 0;
        if (bValue === null || bValue === undefined) bValue = 0;

        // Handle string comparisons
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableVMs;
  }, [rawVms, sortConfig]);

  // Get sort icon for column headers
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUp className="w-3 h-3 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="w-3 h-3 text-gray-600" /> : 
      <ChevronDown className="w-3 h-3 text-gray-600" />;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Virtual Machines</h1>
          <p className="text-gray-600 mt-1">
            Compare VMs across {totalCount.toLocaleString()} instances from multiple cloud providers
          </p>
        </div>

        {/* Filters */}
        <VMFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleFiltersReset}
        />

        {/* Selected VMs Bar */}
        {selectedVMs.length > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-900">
                  {selectedVMs.length} VM{selectedVMs.length !== 1 ? 's' : ''} selected for comparison
                </p>
                <p className="text-xs text-primary-700">
                  {selectedVMs.map(vm => `${vm.provider} ${vm.instance_type}`).join(', ')}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // Navigate to compare page with selected VMs
                    const compareData = selectedVMs.map(vm => ({
                      provider: vm.provider,
                      instance_type: vm.instance_type,
                      region: vm.region
                    }));
                    localStorage.setItem('compareVMs', JSON.stringify(compareData));
                    window.location.href = '/compare';
                  }}
                  className="btn-primary"
                  disabled={selectedVMs.length < 2}
                >
                  Compare Selected
                </button>
                <button
                  onClick={() => setSelectedVMs([])}
                  className="btn-secondary"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="space-y-4">
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} VMs
            </p>
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            )}
          </div>

          {/* Content */}
          {error ? (
            <ErrorMessage
              title="Failed to load VMs"
              message={error.response?.data?.detail || error.message}
              onRetry={refetch}
            />
          ) : isLoading && !vmData ? (
            <LoadingSpinner text="Loading virtual machines..." />
          ) : vms.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No VMs found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters to see more results.
              </p>
              <button
                onClick={handleFiltersReset}
                className="btn-primary"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* List Header */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium text-gray-700">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">Select</div>
                  <button
                    onClick={() => handleSort('provider')}
                    className="col-span-2 flex items-center space-x-1 hover:text-gray-900 transition-colors text-left"
                  >
                    <span>Provider</span>
                    {getSortIcon('provider')}
                  </button>
                  <button
                    onClick={() => handleSort('instance_type')}
                    className="col-span-2 flex items-center space-x-1 hover:text-gray-900 transition-colors text-left"
                  >
                    <span>Instance Type</span>
                    {getSortIcon('instance_type')}
                  </button>
                  <button
                    onClick={() => handleSort('vcpus')}
                    className="col-span-1 flex items-center space-x-1 hover:text-gray-900 transition-colors text-left"
                  >
                    <span>vCPUs</span>
                    {getSortIcon('vcpus')}
                  </button>
                  <button
                    onClick={() => handleSort('memory_gib')}
                    className="col-span-1 flex items-center space-x-1 hover:text-gray-900 transition-colors text-left"
                  >
                    <span>Memory</span>
                    {getSortIcon('memory_gib')}
                  </button>
                  <button
                    onClick={() => handleSort('region')}
                    className="col-span-2 flex items-center space-x-1 hover:text-gray-900 transition-colors text-left"
                  >
                    <span>Region</span>
                    {getSortIcon('region')}
                  </button>
                  <button
                    onClick={() => handleSort('price')}
                    className="col-span-1 flex items-center space-x-1 hover:text-gray-900 transition-colors text-left"
                  >
                    <span>Price/hr</span>
                    {getSortIcon('price')}
                  </button>
                  <button
                    onClick={() => handleSort('spot_price')}
                    className="col-span-1 flex items-center space-x-1 hover:text-gray-900 transition-colors text-left"
                  >
                    <span>Spot Price</span>
                    {getSortIcon('spot_price')}
                  </button>
                  <button
                    onClick={() => handleSort('accelerator_count')}
                    className="col-span-1 flex items-center space-x-1 hover:text-gray-900 transition-colors text-left"
                  >
                    <span>GPU</span>
                    {getSortIcon('accelerator_count')}
                  </button>
                </div>
              </div>
              
              {/* List Items */}
              {vms.map((vm, index) => {
                const formatPrice = (price) => {
                  if (price === null || price === undefined) return 'N/A';
                  return `$${price.toFixed(4)}`;
                };
                
                const getProviderColor = (provider) => {
                  const colors = {
                    aws: 'bg-orange-100 text-orange-800',
                    azure: 'bg-blue-100 text-blue-800',
                    gcp: 'bg-green-100 text-green-800',
                    ibm: 'bg-purple-100 text-purple-800',
                    oci: 'bg-red-100 text-red-800',
                    default: 'bg-gray-100 text-gray-800',
                  };
                  return colors[provider.toLowerCase()] || colors.default;
                };
                
                return (
                  <div
                    key={`${vm.provider}-${vm.instance_type}-${vm.region}-${index}`}
                    className={`border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors ${
                      isVMSelected(vm) ? 'ring-2 ring-primary-500 bg-primary-50' : 'bg-white'
                    }`}
                  >
                    <div className="grid grid-cols-12 gap-4 items-center text-sm">
                      {/* Select Button */}
                      <div className="col-span-1">
                        <button
                          onClick={() => handleVMSelect(vm)}
                          className={`btn text-xs ${
                            isVMSelected(vm) ? 'btn-primary' : 'btn-secondary'
                          }`}
                        >
                          {isVMSelected(vm) ? '✓' : '+'}
                        </button>
                      </div>
                      
                      {/* Provider */}
                      <div className="col-span-2">
                        <span className={`badge ${getProviderColor(vm.provider)}`}>
                          {vm.provider.toUpperCase()}
                        </span>
                        {vm.generation && (
                          <span className="badge-gray ml-1 text-xs">
                            {vm.generation}
                          </span>
                        )}
                      </div>
                      
                      {/* Instance Type */}
                      <div className="col-span-2 font-medium text-gray-900">
                        {vm.instance_type}
                      </div>
                      
                      {/* vCPUs */}
                      <div className="col-span-1 text-gray-700">
                        {vm.vcpus}
                      </div>
                      
                      {/* Memory */}
                      <div className="col-span-1 text-gray-700">
                        {vm.memory_gib} GiB
                      </div>
                      
                      {/* Region */}
                      <div className="col-span-2 text-gray-700">
                        <div>{vm.region}</div>
                        {vm.availability_zone && (
                          <div className="text-xs text-gray-500">{vm.availability_zone}</div>
                        )}
                      </div>
                      
                      {/* Price */}
                      <div className="col-span-1 font-medium text-gray-900">
                        {formatPrice(vm.price)}
                      </div>
                      
                      {/* Spot Price */}
                      <div className="col-span-1">
                        {vm.spot_price ? (
                          <div>
                            <div className="font-medium text-yellow-600">
                              {formatPrice(vm.spot_price)}
                            </div>
                            {vm.price && (
                              <div className="text-xs text-green-600">
                                -{Math.round((1 - vm.spot_price / vm.price) * 100)}%
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </div>
                      
                      {/* GPU */}
                      <div className="col-span-1">
                        {vm.accelerator_name ? (
                          <div className="text-green-700">
                            <div className="font-medium text-xs">
                              {vm.accelerator_count}x
                            </div>
                            <div className="text-xs">
                              {vm.accelerator_name}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VMBrowser;
