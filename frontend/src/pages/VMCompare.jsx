import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { vmApi } from '../services/api';
import Layout from '../components/Layout/Layout';
import VMCard from '../components/VMs/VMCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { Plus, X, GitCompare, TrendingUp, TrendingDown, Award } from 'lucide-react';

const VMCompare = () => {
  const [compareVMs, setCompareVMs] = useState([]);
  const [newVM, setNewVM] = useState({
    provider: '',
    instance_type: '',
    region: ''
  });

  // Load VMs from localStorage on mount
  useEffect(() => {
    const savedVMs = localStorage.getItem('compareVMs');
    if (savedVMs) {
      try {
        const parsed = JSON.parse(savedVMs);
        setCompareVMs(parsed);
        localStorage.removeItem('compareVMs'); // Clear after loading
      } catch (error) {
        console.error('Failed to parse saved VMs:', error);
      }
    }
  }, []);

  const {
    data: comparisonData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['compare', compareVMs],
    () => vmApi.compareVMs(compareVMs),
    {
      enabled: compareVMs.length >= 2,
      staleTime: 30000,
    }
  );

  const addVM = () => {
    if (newVM.provider && newVM.instance_type && newVM.region) {
      setCompareVMs(prev => [...prev, { ...newVM }]);
      setNewVM({ provider: '', instance_type: '', region: '' });
    }
  };

  const removeVM = (index) => {
    setCompareVMs(prev => prev.filter((_, i) => i !== index));
  };

  const comparison = comparisonData?.data?.comparison || [];
  const summary = comparisonData?.data?.summary;

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return `$${price.toFixed(4)}/hr`;
  };

  const formatPercentage = (value) => {
    return `${Math.round(value * 100)}%`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Add VM Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">Add VM to Comparison</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider
                </label>
                <input
                  type="text"
                  placeholder="e.g., aws, azure, gcp"
                  value={newVM.provider}
                  onChange={(e) => setNewVM(prev => ({ ...prev, provider: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instance Type
                </label>
                <input
                  type="text"
                  placeholder="e.g., m5.large, Standard_D2s_v3"
                  value={newVM.instance_type}
                  onChange={(e) => setNewVM(prev => ({ ...prev, instance_type: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <input
                  type="text"
                  placeholder="e.g., us-east-1, eastus"
                  value={newVM.region}
                  onChange={(e) => setNewVM(prev => ({ ...prev, region: e.target.value }))}
                  className="input"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={addVM}
                  disabled={!newVM.provider || !newVM.instance_type || !newVM.region}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add VM</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Current VMs to Compare */}
        {compareVMs.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium text-gray-900">
                VMs to Compare ({compareVMs.length})
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-2">
                {compareVMs.map((vm, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <span className="font-medium">{vm.provider}</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span>{vm.instance_type}</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-gray-600">{vm.region}</span>
                    </div>
                    <button
                      onClick={() => removeVM(index)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Comparison Results */}
        {compareVMs.length >= 2 && (
          <div className="space-y-6">
            {error ? (
              <ErrorMessage
                title="Failed to load comparison"
                message={error.response?.data?.detail || error.message}
                onRetry={refetch}
              />
            ) : isLoading ? (
              <LoadingSpinner text="Comparing virtual machines..." />
            ) : comparison.length === 0 ? (
              <div className="card">
                <div className="card-body text-center py-8">
                  <GitCompare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No VMs Found</h3>
                  <p className="text-gray-600">
                    The specified VMs could not be found. Please check the provider, instance type, and region.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                {summary && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card">
                      <div className="card-body">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingDown className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Cheapest Option</p>
                            <p className="text-lg font-bold text-gray-900">
                              {summary.cheapest.provider} {summary.cheapest.instance_type}
                            </p>
                            <p className="text-sm text-green-600">
                              {formatPrice(summary.cheapest.price)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-body">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Most Powerful</p>
                            <p className="text-lg font-bold text-gray-900">
                              {summary.most_powerful.provider} {summary.most_powerful.instance_type}
                            </p>
                            <p className="text-sm text-blue-600">
                              {summary.most_powerful.vcpus} vCPUs, {summary.most_powerful.memory_gib} GiB
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-body">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Award className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Best Value</p>
                            <p className="text-lg font-bold text-gray-900">
                              {summary.best_value.provider} {summary.best_value.instance_type}
                            </p>
                            <p className="text-sm text-yellow-600">
                              {formatPrice(summary.best_value.price)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed Comparison */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-lg font-medium text-gray-900">Detailed Comparison</h2>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {comparison.map((vm, index) => (
                        <VMCard
                          key={`${vm.provider}-${vm.instance_type}-${vm.region}-${index}`}
                          vm={vm}
                          showCompareButton={false}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comparison Table */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="text-lg font-medium text-gray-900">Specifications Table</h2>
                  </div>
                  <div className="card-body overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Specification</th>
                          {comparison.map((vm, index) => (
                            <th key={index} className="text-center">
                              <div>
                                <div className="font-medium">{vm.provider}</div>
                                <div className="text-xs text-gray-500">{vm.instance_type}</div>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="font-medium">vCPUs</td>
                          {comparison.map((vm, index) => (
                            <td key={index} className="text-center">{vm.vcpus}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="font-medium">Memory (GiB)</td>
                          {comparison.map((vm, index) => (
                            <td key={index} className="text-center">{vm.memory_gib}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="font-medium">GPU</td>
                          {comparison.map((vm, index) => (
                            <td key={index} className="text-center">
                              {vm.accelerator_name ? (
                                <div>
                                  <div>{vm.accelerator_count}x {vm.accelerator_name}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="font-medium">Region</td>
                          {comparison.map((vm, index) => (
                            <td key={index} className="text-center">{vm.region}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="font-medium">On-demand Price</td>
                          {comparison.map((vm, index) => (
                            <td key={index} className="text-center font-medium">
                              {formatPrice(vm.price)}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="font-medium">Spot Price</td>
                          {comparison.map((vm, index) => (
                            <td key={index} className="text-center">
                              {vm.spot_price ? formatPrice(vm.spot_price) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Empty State */}
        {compareVMs.length === 0 && (
          <div className="card">
            <div className="card-body text-center py-12">
              <GitCompare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Start Comparing VMs</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Add at least 2 virtual machines to see a detailed side-by-side comparison of their specifications and pricing.
              </p>
              <p className="text-sm text-gray-500">
                You can also select VMs from the Browse page and they'll appear here automatically.
              </p>
            </div>
          </div>
        )}

        {compareVMs.length === 1 && (
          <div className="card">
            <div className="card-body text-center py-8">
              <GitCompare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Add One More VM</h3>
              <p className="text-gray-600">
                You need at least 2 VMs to start comparing. Add another VM above.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VMCompare;
