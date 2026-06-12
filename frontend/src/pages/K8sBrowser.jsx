import React, { useState, useMemo } from 'react';
import { useQueries } from 'react-query';
import { vmApi } from '../services/api';
import Layout from '../components/Layout/Layout';
import K8sFilters from '../components/K8s/K8sFilters';
import GpuCell from '../components/Common/GpuCell';
import { k8sServices, getProviders } from '../data/k8sServices';
import { isEligibleWorkerNode } from '../data/k8sNodePools';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

const defaultFilters = () => ({
  providers: getProviders(),
  min_vcpus: '',
  max_vcpus: '',
  min_memory: '',
  max_memory: '',
  max_price: '',
  has_gpu: false,
  gpu_name: '',
  region: '',
  eligible_only: true,
});

// Per-provider ceiling: the backend caps a single /vms query at 1000 rows.
const NODE_LIMIT = 1000;

const getProviderColor = (provider) => {
  const colors = {
    aws: 'bg-orange-100 text-orange-800',
    azure: 'bg-blue-100 text-blue-800',
    gcp: 'bg-green-100 text-green-800',
    ibm: 'bg-purple-100 text-purple-800',
    oci: 'bg-red-100 text-red-800',
    do: 'bg-sky-100 text-sky-800',
    ovhcloud: 'bg-indigo-100 text-indigo-800',
    scaleway: 'bg-violet-100 text-violet-800',
    nebius: 'bg-teal-100 text-teal-800',
    scp: 'bg-slate-100 text-slate-800',
    default: 'bg-gray-100 text-gray-800',
  };
  return colors[provider.toLowerCase()] || colors.default;
};

const formatPrice = (price) => {
  if (price === null || price === undefined || price <= 0) return 'N/A';
  return `$${price.toFixed(4)}`;
};

const columns = [
  { key: 'provider', label: 'Provider / Service', span: 'col-span-2' },
  { key: 'instance_type', label: 'Instance type', span: 'col-span-2' },
  { key: 'vcpus', label: 'vCPUs', span: 'col-span-1' },
  { key: 'memory_gib', label: 'Memory', span: 'col-span-1' },
  { key: 'region', label: 'Region', span: 'col-span-2' },
  { key: 'price', label: 'Node $/hr', span: 'col-span-1' },
  { key: 'spot_price', label: 'Spot', span: 'col-span-1' },
  { key: 'accelerator_name', label: 'GPU', span: 'col-span-2' },
];

const K8sBrowser = () => {
  const [filters, setFilters] = useState(defaultFilters);
  const [sortConfig, setSortConfig] = useState({ key: 'price', direction: 'asc' });

  const selected = useMemo(() => filters.providers || [], [filters.providers]);

  // Worker-node attribute filters are pushed down to the catalog query so the
  // backend does the heavy lifting (and the result set stays small). Region is
  // a free-text "contains" match applied client-side, since the backend only
  // does exact region matches and these span many providers.
  const nodeParams = useMemo(() => ({
    hide_incomplete: true,
    sort_by: 'price',
    sort_order: 'asc',
    limit: NODE_LIMIT,
    min_vcpus: filters.min_vcpus || undefined,
    max_vcpus: filters.max_vcpus || undefined,
    min_memory: filters.min_memory || undefined,
    max_memory: filters.max_memory || undefined,
    max_price: filters.max_price || undefined,
    has_gpu: filters.has_gpu ? true : undefined,
    gpu_name: filters.gpu_name || undefined,
  }), [
    filters.min_vcpus, filters.max_vcpus, filters.min_memory, filters.max_memory,
    filters.max_price, filters.has_gpu, filters.gpu_name,
  ]);

  // Query each provider separately so every one gets its full allotment of
  // instances rather than competing for a shared, price-sorted global limit.
  const nodeQueries = useQueries(
    selected.map((p) => ({
      queryKey: ['k8s-nodes', p, nodeParams],
      queryFn: () => vmApi.getVMs({ providers: [p], ...nodeParams }),
      staleTime: 60000,
      keepPreviousData: true,
    }))
  );

  const nodesLoading = nodeQueries.some((q) => q.isLoading);

  const nodesByProvider = useMemo(() => {
    const map = {};
    nodeQueries.forEach((q) => {
      (q.data?.data?.vms || []).forEach((vm) => {
        // Only priced compute nodes are meaningful here; GCP splits some GPU-only
        // rows without vCPU/memory that would be useless as a "node".
        if (vm.price == null || vm.price <= 0 || vm.vcpus == null) return;
        const p = (vm.provider || '').toLowerCase();
        // Keep only shapes the provider's managed K8s service accepts as
        // node-pool workers (per-provider documented rules).
        if (filters.eligible_only && !isEligibleWorkerNode(p, vm)) return;
        (map[p] = map[p] || []).push(vm);
      });
    });
    Object.values(map).forEach((list) => list.sort((a, b) => a.price - b.price));
    return map;
  }, [nodeQueries, filters.eligible_only]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronUp className="w-3 h-3 text-gray-400" />;
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-3 h-3 text-gray-600" />
      : <ChevronDown className="w-3 h-3 text-gray-600" />;
  };

  // Flatten: each worker node becomes a top-level row tagged with its service.
  const rows = useMemo(() => {
    const services = k8sServices.filter((s) => selected.includes(s.provider));
    const regionTerm = (filters.region || '').trim().toLowerCase();

    const flat = [];
    services.forEach((s) => {
      (nodesByProvider[s.provider] || []).forEach((vm, i) => {
        if (regionTerm && !(vm.region || '').toLowerCase().includes(regionTerm)) return;
        flat.push({
          id: `${s.provider}-${s.short}-${vm.instance_type}-${vm.region}-${i}`,
          provider: s.provider,
          service: s.service,
          short: s.short,
          control_plane_hourly: s.control_plane_hourly,
          instance_type: vm.instance_type,
          vcpus: vm.vcpus,
          memory_gib: vm.memory_gib,
          region: vm.region,
          price: vm.price,
          spot_price: vm.spot_price,
          accelerator_name: vm.accelerator_name,
          accelerator_count: vm.accelerator_count,
          gpu_info: vm.gpu_info,
        });
      });
    });

    const { key, direction } = sortConfig;
    flat.sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];
      const aNil = aVal === null || aVal === undefined;
      const bNil = bVal === null || bVal === undefined;
      if (typeof aVal === 'string' || typeof bVal === 'string') {
        aVal = aNil ? '' : String(aVal).toLowerCase();
        bVal = bNil ? '' : String(bVal).toLowerCase();
      } else {
        aVal = aNil ? 0 : aVal;
        bVal = bNil ? 0 : bVal;
      }
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return flat;
  }, [filters, sortConfig, nodesByProvider, selected]);

  const serviceCount = useMemo(() => new Set(rows.map((r) => r.short)).size, [rows]);

  const renderCell = (col, r) => {
    switch (col.key) {
      case 'provider':
        return (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`badge ${getProviderColor(r.provider)}`}>{r.provider.toUpperCase()}</span>
            <span className="min-w-0 leading-tight">
              <span className="block text-xs font-medium text-gray-700 truncate">{r.short}</span>
              <span className="block text-[11px] text-gray-400 truncate">
                CP {r.control_plane_hourly == null
                  ? '—'
                  : r.control_plane_hourly <= 0
                    ? 'free'
                    : `$${r.control_plane_hourly.toFixed(2)}/hr`}
              </span>
            </span>
          </div>
        );
      case 'instance_type':
        return <span className="font-medium text-gray-900 truncate">{r.instance_type || '—'}</span>;
      case 'vcpus':
        return <span className="text-gray-700">{r.vcpus ?? '—'}</span>;
      case 'memory_gib':
        return <span className="text-gray-700 truncate">{r.memory_gib != null ? `${r.memory_gib} GiB` : '—'}</span>;
      case 'region':
        return <span className="text-gray-700 truncate">{r.region || '—'}</span>;
      case 'price':
        return <span className="font-medium text-gray-900">{formatPrice(r.price)}</span>;
      case 'spot_price':
        return r.spot_price
          ? <span className="text-xs font-medium text-yellow-600">{formatPrice(r.spot_price)}</span>
          : <span className="text-xs text-gray-400">—</span>;
      case 'accelerator_name':
        return <GpuCell name={r.accelerator_name} count={r.accelerator_count} gpuInfo={r.gpu_info} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Filter sidebar */}
        <aside className="w-full lg:w-56 lg:flex-shrink-0 lg:sticky lg:top-20">
          <K8sFilters
            filters={filters}
            onFiltersChange={setFilters}
            onReset={() => setFilters(defaultFilters())}
          />
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {rows.length.toLocaleString()} {filters.eligible_only ? 'node-pool eligible ' : ''}worker nodes across {serviceCount} managed Kubernetes services
            </p>
            {nodesLoading && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-600">Loading…</span>
              </div>
            )}
          </div>

          {rows.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No worker nodes found</h3>
              <p className="text-gray-600 mb-4">
                {nodesLoading ? 'Loading node pricing…' : 'Try adjusting your filters to see more results.'}
              </p>
              <button onClick={() => setFilters(defaultFilters())} className="btn-primary">
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="card overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-3 items-center px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600 uppercase tracking-wide">
                {columns.map((col) => (
                  <button
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`${col.span} flex items-center space-x-1 hover:text-gray-900 transition-colors text-left`}
                  >
                    <span>{col.label}</span>{getSortIcon(col.key)}
                  </button>
                ))}
              </div>

              {/* Rows — each worker node is a flat top-level row */}
              <div className="divide-y divide-gray-200">
                {rows.map((r) => (
                  <div
                    key={r.id}
                    className="grid grid-cols-12 gap-3 items-center px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    {columns.map((col) => (
                      <div key={col.key} className={`${col.span} truncate`}>
                        {renderCell(col, r)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default K8sBrowser;
