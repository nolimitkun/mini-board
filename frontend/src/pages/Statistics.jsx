import React from 'react';
import { useQuery } from 'react-query';
import { vmApi } from '../services/api';
import Layout from '../components/Layout/Layout';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { Server, DollarSign, Globe, Monitor, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Statistics = () => {
  const {
    data: statsData,
    isLoading,
    error,
    refetch
  } = useQuery('stats', vmApi.getStats, {
    staleTime: 60000, // 1 minute
  });

  const stats = statsData?.data;

  // Mock data for charts (in a real app, this would come from the API)
  const providerData = [
    { name: 'AWS', count: 4500, color: '#FF9900' },
    { name: 'Azure', count: 3200, color: '#0078D4' },
    { name: 'GCP', count: 2800, color: '#4285F4' },
    { name: 'IBM', count: 1200, color: '#1261FE' },
    { name: 'Others', count: 3720, color: '#6B7280' },
  ];

  const priceRangeData = [
    { range: '$0-0.1', count: 2500 },
    { range: '$0.1-0.5', count: 4200 },
    { range: '$0.5-1.0', count: 3800 },
    { range: '$1.0-2.0', count: 2900 },
    { range: '$2.0-5.0', count: 1500 },
    { range: '$5.0+', count: 520 },
  ];

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return `$${price.toFixed(4)}`;
  };

  const formatNumber = (num) => {
    return num?.toLocaleString() || '0';
  };

  if (error) {
    return (
      <Layout>
        <ErrorMessage
          title="Failed to load statistics"
          message={error.response?.data?.detail || error.message}
          onRetry={refetch}
        />
      </Layout>
    );
  }

  if (isLoading || !stats) {
    return (
      <Layout>
        <LoadingSpinner text="Loading statistics..." />
      </Layout>
    );
  }

  return (
    <Layout
      title="Statistics"
      subtitle="Catalog insights across cloud providers"
    >
      <div className="space-y-6">

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                  <Server className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total VMs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.total_vms)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Cloud Providers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.providers_count)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">GPU Instances</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.gpu_instances_count)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Regions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.regions_count)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Statistics */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-medium text-gray-900">Pricing Overview</h2>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-1">Minimum Price</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(stats.price_range?.min)}/hr
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-1">Average Price</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatPrice(stats.price_range?.avg)}/hr
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-1">Maximum Price</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatPrice(stats.price_range?.max)}/hr
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Provider Distribution */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium text-gray-900">VMs by Cloud Provider</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={providerData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {providerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatNumber(value), 'VMs']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Price Distribution */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-medium text-gray-900">Price Distribution</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priceRangeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatNumber(value), 'VMs']} />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GPU Statistics */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-medium text-gray-900">GPU Acceleration</h2>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">GPU-enabled VMs</span>
                  <span className="font-medium">
                    {formatNumber(stats.gpu_instances_count)} 
                    <span className="text-xs text-gray-500 ml-1">
                      ({((stats.gpu_instances_count / stats.total_vms) * 100).toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${(stats.gpu_instances_count / stats.total_vms) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  GPU instances are available for machine learning, AI, and high-performance computing workloads
                </p>
              </div>
            </div>
          </div>

          {/* Regional Coverage */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-medium text-gray-900">Global Coverage</h2>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Available Regions</span>
                  <span className="font-medium">{formatNumber(stats.regions_count)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average VMs per Region</span>
                  <span className="font-medium">
                    {formatNumber(Math.round(stats.total_vms / stats.regions_count))}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Wide geographic coverage ensures low latency and compliance with data residency requirements
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Freshness */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Data Freshness</h3>
                  <p className="text-sm text-gray-600">
                    VM catalog data is automatically updated from cloud provider APIs
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-medium text-gray-900">
                  {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Statistics;
