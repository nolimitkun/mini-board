import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { vmApi } from '../services/api';
import Layout from '../components/Layout/Layout';
import VMFilters from '../components/VMs/VMFilters';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import GpuCell from '../components/Common/GpuCell';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

const VMBrowser = () => {
  const [filters, setFilters] = useState({
    providers: [],
    limit: 100,
    gpu_name: 'H100',
    hide_incomplete: true
  });
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
      gpu_name: 'H100',
      hide_incomplete: true
    });
  };

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
    const sortableVMs = [...(vmData?.data?.vms || [])];
    if (sortConfig.key) {
      sortableVMs.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        const aNil = aValue === null || aValue === undefined;
        const bNil = bValue === null || bValue === undefined;

        // String columns (e.g. region, instance_type) may have null values on
        // some rows; coerce both sides consistently so one missing value never
        // ends up a number while the other is a string.
        if (typeof aValue === 'string' || typeof bValue === 'string') {
          aValue = aNil ? '' : String(aValue).toLowerCase();
          bValue = bNil ? '' : String(bValue).toLowerCase();
        } else {
          aValue = aNil ? 0 : aValue;
          bValue = bNil ? 0 : bValue;
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
  }, [vmData, sortConfig]);

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
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Filter sidebar */}
        <aside className="w-full lg:w-56 lg:flex-shrink-0 lg:sticky lg:top-20">
          <VMFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleFiltersReset}
          />
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0 space-y-4">
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
            <div className="card overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-3 items-center px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600 uppercase tracking-wide">
                <button onClick={() => handleSort('provider')} className="col-span-2 flex items-center space-x-1 hover:text-gray-900 transition-colors text-left">
                  <span>Provider</span>{getSortIcon('provider')}
                </button>
                <button onClick={() => handleSort('instance_type')} className="col-span-2 flex items-center space-x-1 hover:text-gray-900 transition-colors text-left">
                  <span>Instance Type</span>{getSortIcon('instance_type')}
                </button>
                <button onClick={() => handleSort('vcpus')} className="col-span-1 flex items-center space-x-1 hover:text-gray-900 transition-colors text-left">
                  <span>vCPUs</span>{getSortIcon('vcpus')}
                </button>
                <button onClick={() => handleSort('memory_gib')} className="col-span-1 flex items-center space-x-1 hover:text-gray-900 transition-colors text-left">
                  <span>Memory</span>{getSortIcon('memory_gib')}
                </button>
                <button onClick={() => handleSort('region')} className="col-span-2 flex items-center space-x-1 hover:text-gray-900 transition-colors text-left">
                  <span>Region</span>{getSortIcon('region')}
                </button>
                <button onClick={() => handleSort('price')} className="col-span-1 flex items-center space-x-1 hover:text-gray-900 transition-colors text-left">
                  <span>Price/hr</span>{getSortIcon('price')}
                </button>
                <button onClick={() => handleSort('spot_price')} className="col-span-1 flex items-center space-x-1 hover:text-gray-900 transition-colors text-left">
                  <span>Spot</span>{getSortIcon('spot_price')}
                </button>
                <button onClick={() => handleSort('accelerator_count')} className="col-span-2 flex items-center space-x-1 hover:text-gray-900 transition-colors text-left">
                  <span>GPU</span>{getSortIcon('accelerator_count')}
                </button>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-200">
                {vms.map((vm, index) => {
                  const formatPrice = (price) => {
                    if (price === null || price === undefined || price <= 0) return 'N/A';
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
                      className="grid grid-cols-12 gap-3 items-center px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                    >
                      {/* Provider */}
                      <div className="col-span-2 flex items-center gap-1 min-w-0">
                        <span className={`badge ${getProviderColor(vm.provider)}`}>
                          {vm.provider.toUpperCase()}
                        </span>
                        {vm.generation && (
                          <span className="text-xs text-gray-500 truncate">{vm.generation}</span>
                        )}
                      </div>

                      {/* Instance Type */}
                      <div className="col-span-2 font-medium text-gray-900 truncate">
                        {vm.instance_type
                          || (vm.accelerator_name ? `${vm.accelerator_name} (GPU)` : '—')}
                      </div>

                      {/* vCPUs */}
                      <div className="col-span-1 text-gray-700">
                        {vm.vcpus != null ? vm.vcpus : '—'}
                      </div>

                      {/* Memory */}
                      <div className="col-span-1 text-gray-700 truncate">
                        {vm.memory_gib != null ? `${vm.memory_gib} GiB` : '—'}
                      </div>

                      {/* Region */}
                      <div className="col-span-2 text-gray-700 truncate">
                        {vm.region || '—'}
                        {vm.availability_zone && (
                          <span className="text-gray-400"> · {vm.availability_zone}</span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="col-span-1 font-medium text-gray-900">
                        {formatPrice(vm.price)}
                      </div>

                      {/* Spot Price */}
                      <div className="col-span-1 whitespace-nowrap">
                        {vm.spot_price ? (
                          <span className="font-medium text-yellow-600">
                            {formatPrice(vm.spot_price)}
                            {vm.price && (
                              <span className="ml-1 text-xs text-green-600">
                                -{Math.round((1 - vm.spot_price / vm.price) * 100)}%
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </div>

                      {/* GPU */}
                      <div className="col-span-2 truncate">
                        <GpuCell
                          name={vm.accelerator_name}
                          count={vm.accelerator_count}
                          gpuInfo={vm.gpu_info}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VMBrowser;
