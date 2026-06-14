import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const PAGE_SIZES = [25, 50, 100, 200];

// Build a compact page list with ellipses, e.g. [1, '…', 4, 5, 6, '…', 20].
const pageList = (current, total) => {
  const out = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= current - 1 && p <= current + 1)) {
      out.push(p);
    } else if (out[out.length - 1] !== '…') {
      out.push('…');
    }
  }
  return out;
};

const Pagination = ({ page, pageSize, totalItems, onPageChange, onPageSizeChange }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const start = totalItems === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, totalItems);

  const btn = 'inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded border text-sm transition-colors';
  const idle = 'border-gray-200 text-gray-600 hover:bg-gray-50';
  const active = 'border-primary-600 bg-primary-50 text-primary-700 font-medium';
  const disabled = 'border-gray-100 text-gray-300 cursor-not-allowed';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1 text-sm">
      <div className="flex items-center gap-3 text-gray-600">
        <span>
          {start.toLocaleString()}–{end.toLocaleString()} of {totalItems.toLocaleString()}
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="input w-auto py-1"
            aria-label="Rows per page"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1}
          className={`${btn} ${current <= 1 ? disabled : idle}`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageList(current, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-1 text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${btn} ${p === current ? active : idle}`}
              aria-current={p === current ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(current + 1)}
          disabled={current >= totalPages}
          className={`${btn} ${current >= totalPages ? disabled : idle}`}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
