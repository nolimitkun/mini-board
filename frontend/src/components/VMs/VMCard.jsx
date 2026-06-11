import React from 'react';
import { Cpu, HardDrive, DollarSign, MapPin, Zap, Monitor } from 'lucide-react';

const VMCard = ({ vm, onSelect, isSelected = false, showCompareButton = false }) => {
  const formatPrice = (price) => {
    if (price === null || price === undefined || price <= 0) return 'N/A';
    return `$${price.toFixed(4)}/hr`;
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
    <div className={`card transition-all duration-200 hover:shadow-lg ${
      isSelected ? 'ring-2 ring-primary-500 shadow-lg' : ''
    }`}>
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className={`badge ${getProviderColor(vm.provider)}`}>
                {vm.provider.toUpperCase()}
              </span>
              {vm.generation && (
                <span className="badge-gray">
                  {vm.generation}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {vm.instance_type
                || (vm.accelerator_name ? `${vm.accelerator_name} (GPU)` : '—')}
            </h3>
          </div>
          {showCompareButton && (
            <button
              onClick={() => onSelect(vm)}
              className={`btn text-xs ${
                isSelected ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {isSelected ? 'Selected' : 'Select'}
            </button>
          )}
        </div>

        {/* Specifications */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {vm.vcpus != null ? `${vm.vcpus} vCPUs` : '—'}
              </p>
              <p className="text-xs text-gray-500">CPU</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {vm.memory_gib != null ? `${vm.memory_gib} GiB` : '—'}
              </p>
              <p className="text-xs text-gray-500">Memory</p>
            </div>
          </div>
        </div>

        {/* GPU Info */}
        {vm.accelerator_name && (
          <div className="flex items-center space-x-2 mb-4 p-2 bg-green-50 rounded-md">
            <Monitor className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">
                {vm.accelerator_count}x {vm.accelerator_name}
              </p>
              <p className="text-xs text-green-600">GPU Accelerator</p>
            </div>
          </div>
        )}

        {/* Location */}
        <div className="flex items-center space-x-2 mb-4">
          <MapPin className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">{vm.region || '—'}</p>
            {vm.availability_zone && (
              <p className="text-xs text-gray-500">{vm.availability_zone}</p>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {formatPrice(vm.price)}
                </p>
                <p className="text-xs text-gray-500">On-demand</p>
              </div>
            </div>
            
            {vm.spot_price && (
              <div className="text-right">
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  <p className="text-sm font-medium text-gray-900">
                    {formatPrice(vm.spot_price)}
                  </p>
                </div>
                <p className="text-xs text-gray-500">Spot</p>
              </div>
            )}
          </div>
          
          {vm.spot_price && vm.price && (
            <div className="mt-2">
              <p className="text-xs text-green-600">
                Save {Math.round((1 - vm.spot_price / vm.price) * 100)}% with spot pricing
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VMCard;
