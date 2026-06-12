import React from 'react';
import { parseGpuInfo } from '../../utils/gpu';

// Shared GPU cell for the VM and K8s tables: accelerator count + name, plus the
// per-GPU and total GPU memory parsed from the catalog's GpuInfo blob.
const GpuCell = ({ name, count, gpuInfo }) => {
  if (!name) return <span className="text-gray-400">—</span>;

  const info = parseGpuInfo(gpuInfo);
  const memParts = [];
  if (info?.perGpuGB && info?.totalGB && info.perGpuGB !== info.totalGB) {
    memParts.push(`${info.perGpuGB} GB each`, `${info.totalGB} GB total`);
  } else if (info?.totalGB || info?.perGpuGB) {
    // Single GPU (or only one figure in the catalog) — one number says it all.
    memParts.push(`${info.totalGB || info.perGpuGB} GB`);
  }

  return (
    <span className="text-green-700">
      <span className="block text-xs">
        {count != null && <span className="font-medium">{count}x </span>}
        {name}
        {info?.manufacturer && (
          <span className="text-gray-400"> · {info.manufacturer}</span>
        )}
      </span>
      {memParts.length > 0 && (
        <span className="block text-[11px] text-gray-500">{memParts.join(' · ')}</span>
      )}
    </span>
  );
};

export default GpuCell;
