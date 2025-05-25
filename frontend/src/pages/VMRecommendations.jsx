import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { vmApi } from '../services/api';
import Layout from '../components/Layout/Layout';
import VMCard from '../components/VMs/VMCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { Lightbulb, Cpu, HardDrive, Monitor, DollarSign, MapPin } from 'lucide-react';

const VMRecommendations = () => {
  const [requirements, setRequirements] = useState({
    min_vcpus: '',
    min_memory: '',
    gpu_required: false,
    max_budget: '',
    preferred_regions: [],
    workload_type: 'balanced'
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const {
    data: recommendationsData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['recommendations', requirements],
    () => vmApi.getRecommendations(requirements),
    {
      enabled: hasSubmitted,
      staleTime: 30000,
    }
  );

  const handleInputChange = (field, value) => {
    setRequirements(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegionToggle = (region) => {
    const currentRegions = requirements.preferred_regions || [];
    const newRegions = currentRegions.includes(region)
      ? currentRegions.filter(r => r !== region)
      : [...currentRegions, region];
    
    handleInputChange('preferred_regions', newRegions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setHasSubmitted(true);
    refetch();
  };

  const resetForm = () => {
    setRequirements({
      min_vcpus: '',
      min_memory: '',
      gpu_required: false,
      max_budget: '',
      preferred_regions: [],
      workload_type: 'balanced'
    });
    setHasSubmitted(false);
  };

  const recommendations = recommendationsData?.data?.recommendations || [];

  const workloadTypes = [
    { value: 'balanced', label: 'Balanced', description: 'Good balance of CPU, memory, and cost' },
    { value: 'compute', label: 'Compute Optimized', description: 'High CPU performance for compute-intensive tasks' },
    { value: 'memory', label: 'Memory Optimized', description: 'High memory for memory-intensive applications' },
    { value: 'gpu', label: 'GPU Optimized', description: 'GPU acceleration for ML/AI workloads' },
  ];

  const popularRegions = [
    'us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 
    'ap-southeast-1', 'ap-northeast-1', 'eastus', 'westus2', 
    'northeurope', 'westeurope'
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Lightbulb className="w-8 h-8 text-primary-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">VM Recommendations</h1>
            <p className="text-gray-600 mt-1">
              Get personalized VM recommendations based on your workload requirements
            </p>
          </div>
        </div>

        {/* Requirements Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-medium text-gray-900">Tell us about your workload</h2>
            <p className="text-sm text-gray-600 mt-1">
              Provide your requirements and we'll recommend the best VMs for your needs
            </p>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* CPU Requirements */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Cpu className="w-4 h-4" />
                    <span>Minimum vCPUs</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 2"
                    value={requirements.min_vcpus}
                    onChange={(e) => handleInputChange('min_vcpus', e.target.value)}
                    className="input"
                    min="0"
                    step="0.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of virtual CPU cores needed
                  </p>
                </div>

                {/* Memory Requirements */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <HardDrive className="w-4 h-4" />
                    <span>Minimum Memory (GiB)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 8"
                    value={requirements.min_memory}
                    onChange={(e) => handleInputChange('min_memory', e.target.value)}
                    className="input"
                    min="0"
                    step="0.5"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Amount of RAM required in GiB
                  </p>
                </div>

                {/* Budget */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Maximum Budget ($/hour)</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 2.50"
                    value={requirements.max_budget}
                    onChange={(e) => handleInputChange('max_budget', e.target.value)}
                    className="input"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum hourly cost you're willing to pay
                  </p>
                </div>
              </div>

              {/* GPU Requirements */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                  <Monitor className="w-4 h-4" />
                  <span>GPU Requirements</span>
                </label>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={requirements.gpu_required}
                      onChange={(e) => handleInputChange('gpu_required', e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      GPU acceleration required
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Check if your workload requires GPU acceleration (ML/AI, rendering, etc.)
                </p>
              </div>

              {/* Workload Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Workload Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {workloadTypes.map(type => (
                    <label
                      key={type.value}
                      className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                        requirements.workload_type === type.value
                          ? 'border-primary-600 ring-2 ring-primary-600 bg-primary-50'
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="workload_type"
                        value={type.value}
                        checked={requirements.workload_type === type.value}
                        onChange={(e) => handleInputChange('workload_type', e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">
                          {type.label}
                        </span>
                        <span className="block text-xs text-gray-500 mt-1">
                          {type.description}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Preferred Regions */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>Preferred Regions (Optional)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {popularRegions.map(region => (
                    <label key={region} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(requirements.preferred_regions || []).includes(region)}
                        onChange={() => handleRegionToggle(region)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {region}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Leave empty to consider all regions
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex items-center space-x-4 pt-4 border-t">
                <button
                  type="submit"
                  className="btn-primary flex items-center space-x-2"
                  disabled={isLoading}
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>{isLoading ? 'Getting Recommendations...' : 'Get Recommendations'}</span>
                </button>
                
                {hasSubmitted && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary"
                  >
                    Reset Form
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Recommendations Results */}
        {hasSubmitted && (
          <div className="space-y-6">
            {error ? (
              <ErrorMessage
                title="Failed to get recommendations"
                message={error.response?.data?.detail || error.message}
                onRetry={refetch}
              />
            ) : isLoading ? (
              <LoadingSpinner text="Analyzing your requirements and finding the best VMs..." />
            ) : recommendations.length === 0 ? (
              <div className="card">
                <div className="card-body text-center py-8">
                  <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Found</h3>
                  <p className="text-gray-600 mb-4">
                    We couldn't find any VMs that match your requirements. Try adjusting your criteria:
                  </p>
                  <ul className="text-sm text-gray-600 text-left max-w-md mx-auto space-y-1">
                    <li>• Increase your budget limit</li>
                    <li>• Reduce minimum CPU or memory requirements</li>
                    <li>• Consider more regions</li>
                    <li>• Try a different workload type</li>
                  </ul>
                </div>
              </div>
            ) : (
              <>
                {/* Recommendations Header */}
                <div className="card">
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Found {recommendations.length} Recommended VM{recommendations.length !== 1 ? 's' : ''}
                        </h2>
                        <p className="text-gray-600 mt-1">
                          Sorted by recommendation score (best match first)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Workload Type</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {requirements.workload_type}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations List */}
                <div className="space-y-6">
                  {recommendations.map((recommendation, index) => (
                    <div key={`${recommendation.provider}-${recommendation.instance_type}-${index}`} className="card">
                      <div className="card-body">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-primary-600">
                                #{index + 1}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Recommendation Score: {recommendation.score.toFixed(1)}/100
                              </h3>
                              <p className="text-sm text-gray-600">
                                {recommendation.reasoning}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-lg">
                                {Math.round(recommendation.score)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <VMCard
                          vm={recommendation}
                          showCompareButton={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tips */}
                <div className="card">
                  <div className="card-body">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">💡 Tips for choosing the right VM</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Consider spot pricing</h4>
                        <p>Spot instances can save up to 90% but may be interrupted. Great for fault-tolerant workloads.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Monitor your usage</h4>
                        <p>Start with the recommended size and scale up/down based on actual performance needs.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Regional considerations</h4>
                        <p>Choose regions close to your users for better latency and data compliance.</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Reserved instances</h4>
                        <p>For long-running workloads, consider reserved instances for significant cost savings.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasSubmitted && (
          <div className="card">
            <div className="card-body text-center py-12">
              <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Get Personalized VM Recommendations</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Our recommendation engine analyzes thousands of VM configurations across multiple cloud providers 
                to find the perfect match for your specific workload requirements and budget.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Cpu className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Performance Matching</h4>
                    <p className="text-sm text-gray-600">Find VMs that meet your CPU, memory, and GPU requirements</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Cost Optimization</h4>
                    <p className="text-sm text-gray-600">Stay within budget while maximizing performance value</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Smart Scoring</h4>
                    <p className="text-sm text-gray-600">AI-powered scoring based on workload type and requirements</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default VMRecommendations;
