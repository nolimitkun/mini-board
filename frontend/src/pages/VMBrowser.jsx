import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { vmApi } from '../services/api';
import Layout from '../components/Layout/Layout';
import VMFilters from '../components/VMs/VMFilters';
import VMCard from '../components/VMs/VMCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { Search, Grid, List } from 'lucide-react';

const VMBrowser = () => {
  const [filters, setFilters] = useState({
    providers: [],
    sort_by: 'price',
    sort_order: 'asc',
    limit: 100
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedVMs, setSelectedVMs] = useState([]);

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
      sort_by: 'price',
      sort_order: 'asc',
      limit: 100
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

  const vms = vmData?.data?.vms || [];
  const totalCount = vmData?.data?.total_count || 0;
  const filteredCount = vmData?.data?.filtered_count || 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Virtual Machines</h1>
            <p className="text-gray-600 mt-1">
              Compare VMs across {totalCount.toLocaleString()} instances from multiple cloud providers
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${
                viewMode === 'grid' 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${
                viewMode === 'list' 
                  ? 'bg-primary-100 text-primary-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
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
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }>
              {vms.map((vm, index) => (
                <VMCard
                  key={`${vm.provider}-${vm.instance_type}-${vm.region}-${index}`}
                  vm={vm}
                  onSelect={handleVMSelect}
                  isSelected={isVMSelected(vm)}
                  showCompareButton={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default VMBrowser;
