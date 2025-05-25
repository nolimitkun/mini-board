import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { vmApi } from '../services/api';
import Layout from '../components/Layout/Layout';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { Settings, Database, RefreshCw, Activity, AlertCircle, CheckCircle, Eye } from 'lucide-react';

const Admin = () => {
  const [previewRows, setPreviewRows] = useState(5);
  const queryClient = useQueryClient();

  // Health check query
  const {
    data: healthData,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth
  } = useQuery('health', vmApi.healthCheck, {
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  });

  // Preview data query
  const {
    data: previewData,
    isLoading: previewLoading,
    error: previewError,
    refetch: refetchPreview
  } = useQuery(
    ['preview', previewRows],
    () => vmApi.previewData(previewRows),
    {
      staleTime: 60000,
    }
  );

  // API info query
  const {
    data: apiInfoData,
    isLoading: apiInfoLoading,
    error: apiInfoError
  } = useQuery('apiInfo', vmApi.getApiInfo, {
    staleTime: 300000, // 5 minutes
  });

  // Reload data mutation
  const reloadMutation = useMutation(vmApi.reloadData, {
    onSuccess: () => {
      queryClient.invalidateQueries();
      alert('Data reloaded successfully!');
    },
    onError: (error) => {
      alert(`Failed to reload data: ${error.response?.data?.detail || error.message}`);
    },
  });

  const handleReloadData = () => {
    if (window.confirm('Are you sure you want to reload all VM data? This may take several minutes.')) {
      reloadMutation.mutate();
    }
  };

  const handlePreviewRowsChange = (newRows) => {
    setPreviewRows(newRows);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const health = healthData?.data;
  const preview = previewData?.data;
  const apiInfo = apiInfoData?.data;

  return (
    <Layout>
      <div className="space-y-6">

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* API Health */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  healthLoading ? 'bg-gray-100' : 
                  healthError ? 'bg-red-100' : 
                  health?.status === 'healthy' ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  {healthLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : healthError ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : health?.status === 'healthy' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Activity className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">API Status</p>
                  <p className="text-lg font-bold text-gray-900">
                    {healthLoading ? 'Checking...' : 
                     healthError ? 'Error' : 
                     health?.status === 'healthy' ? 'Healthy' : 'Unknown'}
                  </p>
                </div>
              </div>
              {health && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500">
                    Providers loaded: {health.providers_loaded}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* API Version */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">API Version</p>
                  <p className="text-lg font-bold text-gray-900">
                    {apiInfoLoading ? 'Loading...' : 
                     apiInfoError ? 'Error' : 
                     apiInfo?.version || 'Unknown'}
                  </p>
                </div>
              </div>
              {apiInfo && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500">
                    {apiInfo.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Last Update */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatTimestamp(new Date())}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-medium text-gray-900">Data Management</h2>
              </div>
              <button
                onClick={handleReloadData}
                disabled={reloadMutation.isLoading}
                className="btn-primary flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${reloadMutation.isLoading ? 'animate-spin' : ''}`} />
                <span>{reloadMutation.isLoading ? 'Reloading...' : 'Reload Data'}</span>
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Data Reload Warning
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Reloading data will fetch the latest VM information from all cloud providers. 
                        This process may take several minutes and will temporarily impact API performance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">What gets updated:</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• VM specifications</li>
                    <li>• Pricing information</li>
                    <li>• Regional availability</li>
                    <li>• New instance types</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Data sources:</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• SkyPilot GitHub repository</li>
                    <li>• Cloud provider catalogs</li>
                    <li>• Real-time pricing APIs</li>
                    <li>• Regional service data</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Frequency:</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Manual reload (this button)</li>
                    <li>• Automatic daily updates</li>
                    <li>• On-demand via API</li>
                    <li>• System startup</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Database Preview */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-medium text-gray-900">Database Preview</h2>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Rows:</label>
                <select
                  value={previewRows}
                  onChange={(e) => handlePreviewRowsChange(parseInt(e.target.value))}
                  className="input w-20"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
                <button
                  onClick={refetchPreview}
                  className="btn-secondary"
                  disabled={previewLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${previewLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
          <div className="card-body">
            {previewError ? (
              <ErrorMessage
                title="Failed to load preview"
                message={previewError.response?.data?.detail || previewError.message}
                onRetry={refetchPreview}
              />
            ) : previewLoading ? (
              <LoadingSpinner text="Loading database preview..." />
            ) : preview ? (
              <div className="space-y-6">
                <div className="text-sm text-gray-600">
                  <p>Showing {preview.max_rows_shown} sample rows from the database</p>
                </div>

                {Object.entries(preview.providers || {}).map(([provider, data]) => (
                  <div key={provider} className="space-y-3">
                    <h3 className="text-lg font-medium text-gray-900 capitalize">
                      {provider} ({data.sample_data?.length || 0} samples)
                    </h3>
                    
                    {data.sample_data && data.sample_data.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="table text-xs">
                          <thead>
                            <tr>
                              <th>Instance Type</th>
                              <th>vCPUs</th>
                              <th>Memory (GiB)</th>
                              <th>GPU</th>
                              <th>Price ($/hr)</th>
                              <th>Spot Price</th>
                              <th>Region</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.sample_data.slice(0, 3).map((vm, index) => (
                              <tr key={index}>
                                <td className="font-medium">{vm.instance_type}</td>
                                <td>{vm.vcpus}</td>
                                <td>{vm.memory_gib}</td>
                                <td>
                                  {vm.accelerator_name ? (
                                    <span className="badge-success">
                                      {vm.accelerator_count}x {vm.accelerator_name}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">None</span>
                                  )}
                                </td>
                                <td>${vm.price?.toFixed(4) || 'N/A'}</td>
                                <td>
                                  {vm.spot_price ? `$${vm.spot_price.toFixed(4)}` : (
                                    <span className="text-gray-400">N/A</span>
                                  )}
                                </td>
                                <td>{vm.region}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No sample data available</p>
                    )}

                    {data.total_count && (
                      <p className="text-xs text-gray-500">
                        Total {provider} VMs: {data.total_count.toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No preview data available</p>
            )}
          </div>
        </div>

        {/* System Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">System Information</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">API Endpoints</h3>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Health Check:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">/health</code>
                  </div>
                  <div className="flex justify-between">
                    <span>VM Search:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">/vms</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Compare:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">/vms/compare</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Recommendations:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">/vms/recommendations</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Statistics:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">/stats</code>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Database Information</h3>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Database Type:</span>
                    <span>DuckDB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File Location:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">vm_catalog.duckdb</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Source:</span>
                    <span>SkyPilot Catalog</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Update Method:</span>
                    <span>GitHub Repository</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Indexing:</span>
                    <span>Optimized for queries</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
