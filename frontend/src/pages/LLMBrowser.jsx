import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from 'react-query';
import { llmApi } from '../services/api';
import Layout from '../components/Layout/Layout';
import LLMFilters from '../components/LLMs/LLMFilters';
import Pagination from '../components/Common/Pagination';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

const defaultFilters = (providers = null) => ({
  providers,
  search: '',
  min_context: '',
  max_input_price: '',
  vision_only: false,
});

const getProviderColor = (provider) => {
  const colors = {
    anthropic: 'bg-amber-100 text-amber-800',
    aws: 'bg-orange-100 text-orange-800',
    azure: 'bg-blue-100 text-blue-800',
    gcp: 'bg-green-100 text-green-800',
    google: 'bg-emerald-100 text-emerald-800',
    openai: 'bg-teal-100 text-teal-800',
    mistral: 'bg-red-100 text-red-800',
    cohere: 'bg-purple-100 text-purple-800',
    xai: 'bg-slate-100 text-slate-800',
    deepseek: 'bg-indigo-100 text-indigo-800',
    alibaba: 'bg-rose-100 text-rose-800',
    together: 'bg-violet-100 text-violet-800',
    groq: 'bg-pink-100 text-pink-800',
    fireworks: 'bg-fuchsia-100 text-fuchsia-800',
    ibm: 'bg-cyan-100 text-cyan-800',
    perplexity: 'bg-sky-100 text-sky-800',
    default: 'bg-gray-100 text-gray-800',
  };
  return colors[provider.toLowerCase()] || colors.default;
};

const formatPrice = (price) => {
  if (price === null || price === undefined) return 'N/A';
  return `$${price.toFixed(2)}`;
};

const formatContext = (tokens) => {
  if (tokens == null) return '—';
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(tokens % 1000000 === 0 ? 0 : 1)}M`;
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}K`;
  return String(tokens);
};

const columns = [
  { key: 'provider', label: 'Provider / Platform', span: 'col-span-3' },
  { key: 'model', label: 'Model', span: 'col-span-2' },
  { key: 'developer', label: 'Developer', span: 'col-span-2' },
  { key: 'context_tokens', label: 'Context', span: 'col-span-1' },
  { key: 'input_price', label: 'Input $/1M', span: 'col-span-1' },
  { key: 'output_price', label: 'Output $/1M', span: 'col-span-1' },
  { key: 'modalities', label: 'Modality', span: 'col-span-2' },
];

const LLMBrowser = () => {
  const [filters, setFilters] = useState(() => defaultFilters());
  const [sortConfig, setSortConfig] = useState({ key: 'input_price', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Providers come from the backend (which aggregates them from provider sources).
  const { data: providersResp } = useQuery('llm-providers', () => llmApi.getProviders());
  const allProviders = useMemo(() => providersResp?.data?.providers || [], [providersResp]);

  // Default to "all selected" once the provider list arrives.
  useEffect(() => {
    if (filters.providers === null && allProviders.length) {
      setFilters((f) => ({ ...f, providers: allProviders }));
    }
  }, [allProviders, filters.providers]);

  const selected = useMemo(() => filters.providers || [], [filters.providers]);

  // Filtering, sorting, and pagination are all done server-side; omit
  // `providers` when "all" are selected.
  const modelParams = useMemo(() => {
    const allSelected =
      filters.providers === null ||
      (allProviders.length > 0 && selected.length === allProviders.length);
    return {
      providers: allSelected ? undefined : selected,
      search: filters.search || undefined,
      min_context: filters.min_context ? Number(filters.min_context) * 1000 : undefined,
      max_input_price: filters.max_input_price || undefined,
      vision_only: filters.vision_only ? true : undefined,
      sort_by: sortConfig.key,
      sort_order: sortConfig.direction,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    };
  }, [filters, selected, allProviders, sortConfig, page, pageSize]);

  const { data: modelsResp, isFetching } = useQuery(
    ['llm-models', modelParams],
    () => llmApi.getModels(modelParams),
    { keepPreviousData: true }
  );
  const models = useMemo(() => modelsResp?.data?.models || [], [modelsResp]);
  const filteredCount = modelsResp?.data?.filtered_count || 0;

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

  // The server returns the already-filtered, sorted page; just tag rows with a key.
  const rows = useMemo(
    () => models.map((m, i) => ({ id: `${m.provider}-${m.model_id}-${i}`, ...m })),
    [models]
  );

  // Reset to the first page whenever the filters, sort, or page size change.
  useEffect(() => { setPage(1); }, [filters, sortConfig, pageSize]);

  const renderCell = (col, r) => {
    switch (col.key) {
      case 'provider':
        return (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`badge ${getProviderColor(r.provider)}`}>{r.provider.toUpperCase()}</span>
            <span className="min-w-0 leading-tight">
              <span className="block text-xs font-medium text-gray-700 truncate">{r.platform}</span>
              <span className="block text-[11px] text-gray-400 truncate font-mono">{r.model_id}</span>
            </span>
          </div>
        );
      case 'model':
        return <span className="font-medium text-gray-900 truncate">{r.model}</span>;
      case 'developer':
        return <span className="text-gray-700 truncate">{r.developer}</span>;
      case 'context_tokens':
        return <span className="text-gray-700">{formatContext(r.context_tokens)}</span>;
      case 'input_price':
        return <span className="font-medium text-gray-900">{formatPrice(r.input_price)}</span>;
      case 'output_price':
        return <span className="font-medium text-gray-900">{formatPrice(r.output_price)}</span>;
      case 'modalities':
        return (
          <div className="flex flex-wrap gap-1">
            {(r.modalities || []).map((m) => (
              <span key={m} className="badge bg-gray-100 text-gray-700">{m}</span>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Filter sidebar */}
        <aside className="w-full lg:w-56 lg:flex-shrink-0 lg:sticky lg:top-20">
          <LLMFilters
            filters={filters}
            providers={allProviders}
            onFiltersChange={setFilters}
            onReset={() => setFilters(defaultFilters(allProviders))}
          />
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredCount.toLocaleString()} LLM model offerings across {allProviders.length} cloud providers
            </p>
            {isFetching && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-600">Loading…</span>
              </div>
            )}
          </div>

          {rows.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
              <p className="text-gray-600 mb-4">
                {isFetching ? 'Loading models…' : 'Try adjusting your filters to see more results.'}
              </p>
              <button onClick={() => setFilters(defaultFilters(allProviders))} className="btn-primary">
                Reset Filters
              </button>
            </div>
          ) : (
            <>
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

                {/* Rows */}
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

              <Pagination
                page={page}
                pageSize={pageSize}
                totalItems={filteredCount}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LLMBrowser;
