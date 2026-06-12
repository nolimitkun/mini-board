// Worker-node eligibility rules per managed Kubernetes service.
//
// The VM catalog (SkyPilot) lists every purchasable VM shape, but not every
// shape can back a node pool. Each rule below encodes the provider's own
// documented node-pool constraints, so the K8s page only shows instance types
// the managed service actually accepts as workers.
//
// Rule fields (all optional — an absent field means "no constraint"):
//   minVcpus / minMemoryGib  numeric floors on the instance specs
//   allowFamilies            instance_type must match one of these regexes
//   exclude                  instance_type matching any of these is dropped
//   note / source            why, and where the constraint is documented
//
// Like k8sServices.js this is hand-maintained from provider docs — review
// periodically. Last reviewed: 2026-06.

export const nodePoolRules = {
  aws: {
    // EKS node groups accept virtually any current-generation EC2 type
    // (default t3.medium); no documented hard floor.
    note: 'EKS supports all current-generation EC2 instance types.',
    source: 'https://docs.aws.amazon.com/eks/latest/APIReference/API_CreateNodegroup.html',
  },
  azure: {
    // User node pools: at least 2 vCPUs and 2 GiB RAM. (System pools are
    // stricter — 4 GiB and no B-series — but workers here are user pools.)
    minVcpus: 2,
    minMemoryGib: 2,
    note: 'AKS user node pools require >= 2 vCPUs and 2 GiB RAM.',
    source: 'https://learn.microsoft.com/en-us/azure/aks/quotas-skus-regions',
  },
  gcp: {
    // Micro/small shared-core types lack the memory to run GKE system
    // components. Dedicated-core types (incl. n1-highcpu-2) are fine.
    exclude: [/^f1-micro$/, /^e2-micro$/, /^g1-small$/],
    note: 'GKE nodes need enough memory for system components; f1-micro, e2-micro and g1-small are unsupported.',
    source: 'https://cloud.google.com/kubernetes-engine/docs/concepts/cluster-architecture',
  },
  oci: {
    // OKE supports most VM/BM shapes; Micro VM shapes (e.g.
    // VM.Standard.E2.1.Micro) and dedicated-host shapes are not supported.
    exclude: [/\.Micro\b/i],
    note: 'OKE workers support most shapes; Micro VM shapes are not supported.',
    source: 'https://docs.oracle.com/en-us/iaas/Content/ContEng/Reference/contengimagesshapes.htm',
  },
  ibm: {
    // IKS worker pools use a fixed set of VPC flavor families (balanced,
    // compute, memory, GPU) — not arbitrary VPC profiles.
    allowFamilies: [/^bx[23]/i, /^cx[23]/i, /^mx[23]/i, /^gx[234]/i],
    note: 'IKS workers come only in bx/cx/mx/gx VPC flavor families.',
    source: 'https://cloud.ibm.com/docs/containers?topic=containers-planning_worker_nodes',
  },
  do: {
    // DOKS pools use Basic (s-), General Purpose (g-/gd-), CPU-Optimized
    // (c-/c2-), Memory-Optimized (m-) and GPU droplets, minimum 2 GB RAM.
    minMemoryGib: 2,
    allowFamilies: [/^s-/, /^g-/, /^gd-/, /^c-/, /^c2-/, /^m-/, /^m3-/, /^m6-/, /^gpu-/],
    note: 'DOKS supports Basic, General Purpose, CPU/Memory-Optimized and GPU droplets with >= 2 GB RAM.',
    source: 'https://docs.digitalocean.com/products/kubernetes/details/limits/',
  },
  ovhcloud: {
    // MKS worker flavors: General Purpose (b2/b3), Compute (c2/c3), Memory
    // (r2/r3), GPU (t1/t2, a100/h100/l4/l40s). Sandbox (s1/d2) flavors are
    // not eligible.
    allowFamilies: [/^b[23]-/i, /^c[23]-/i, /^r[23]-/i, /^t[12]-/i, /^a100-/i, /^h100-/i, /^l4-/i, /^l40s-/i],
    note: 'OVH MKS workers are limited to B/C/R general flavors and GPU flavors; sandbox flavors are not eligible.',
    source: 'https://support.us.ovhcloud.com/hc/en-us/articles/1500005132102',
  },
  scaleway: {
    // Kapsule accepts most instance types; those without enough memory
    // (STARDUST, DEV1-S, PLAY2-PICO) are not eligible as nodes.
    exclude: [/^STARDUST/i, /^DEV1-S$/i, /^PLAY2-PICO$/i],
    note: 'Kapsule excludes the smallest instances (STARDUST, DEV1-S, PLAY2-PICO).',
    source: 'https://github.com/scaleway/scaleway-cli/blob/master/docs/commands/k8s.md',
  },
  nebius: {
    // Managed K8s node groups run on the same compute platforms as plain
    // VMs (cpu-d3/e2, gpu-*); no documented exclusions.
    note: 'Nebius node groups support all compute platforms.',
    source: 'https://nebius.com/services/managed-kubernetes',
  },
  scp: {
    // SCP Kubernetes Engine node constraints are not publicly documented;
    // no filtering applied rather than guessing.
    note: 'SCP node-pool constraints are not publicly documented; showing the full VM catalog.',
    source: 'https://cloud.samsungsds.com/serviceportal/product/kubernetes-engine',
  },
};

// True when `vm` (a row from the /vms API) is an eligible worker node for
// `provider`'s managed Kubernetes service.
export const isEligibleWorkerNode = (provider, vm) => {
  const rule = nodePoolRules[(provider || '').toLowerCase()];
  if (!rule) return true;

  const type = vm.instance_type || '';
  if (rule.minVcpus != null && (vm.vcpus == null || vm.vcpus < rule.minVcpus)) return false;
  if (rule.minMemoryGib != null && (vm.memory_gib == null || vm.memory_gib < rule.minMemoryGib)) return false;
  if (rule.allowFamilies && !rule.allowFamilies.some((re) => re.test(type))) return false;
  if (rule.exclude && rule.exclude.some((re) => re.test(type))) return false;
  return true;
};
