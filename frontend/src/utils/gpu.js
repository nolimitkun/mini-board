// SkyPilot's catalog stores GPU details in a `GpuInfo` blob that looks like a
// Python dict, e.g.:
//   {'Gpus': [{'Name': 'H100', 'Manufacturer': 'NVIDIA', 'Count': 8,
//              'MemoryInfo': {'SizeInMiB': 81920}}], 'TotalGpuMemoryInMiB': 655360}
// It isn't valid JSON (single quotes, Python literals), so rather than parse the
// whole thing we pull out the few fields worth showing with focused regexes.
export const parseGpuInfo = (gpuInfo) => {
  if (!gpuInfo || typeof gpuInfo !== 'string') return null;

  const numFrom = (re) => {
    const m = gpuInfo.match(re);
    return m ? Number(m[1]) : null;
  };

  const perGpuMiB = numFrom(/'SizeInMiB':\s*(\d+(?:\.\d+)?)/);
  const totalMiB = numFrom(/'TotalGpuMemoryInMiB':\s*(\d+(?:\.\d+)?)/);
  const manMatch = gpuInfo.match(/'Manufacturer':\s*'([^']+)'/);

  // 81920 MiB == 80 GiB, which matches how GPUs are marketed ("H100 80GB").
  const toGB = (miB) => (miB != null ? Math.round(miB / 1024) : null);
  const perGpuGB = toGB(perGpuMiB);
  const totalGB = toGB(totalMiB);

  if (perGpuGB == null && totalGB == null && !manMatch) return null;
  return { perGpuGB, totalGB, manufacturer: manMatch ? manMatch[1] : null };
};
