// Curated comparison of managed Kubernetes services across cloud providers.
//
// Unlike the VM catalog (which is priced live from the backend), managed
// Kubernetes offerings differ mostly on features, limits, and control-plane
// pricing models, so this is a hand-maintained feature matrix. Prices are the
// list control-plane cost in USD and exclude the worker nodes themselves.
//
// Sources: each provider's public pricing / limits docs. Review periodically —
// versions and limits drift. Last reviewed: 2026-06.

export const k8sServices = [
  {
    provider: 'aws',
    service: 'Amazon EKS',
    short: 'EKS',
    // Control-plane price per cluster per hour (USD).
    control_plane_hourly: 0.10,
    free_control_plane: false,
    sla: 99.95,
    latest_version: '1.33',
    max_nodes_per_cluster: 100000,
    max_pods_per_node: 250,
    cni: 'AWS VPC CNI',
    serverless_option: 'Fargate',
    auto_upgrade: true,
    fleet_management: 'EKS + Karpenter',
    docs: 'https://aws.amazon.com/eks/',
  },
  {
    provider: 'azure',
    service: 'Azure Kubernetes Service',
    short: 'AKS',
    control_plane_hourly: 0.10, // Standard tier; Free tier = 0 (no uptime SLA)
    free_control_plane: true, // Free tier available (best-effort, no SLA)
    sla: 99.95,
    latest_version: '1.33',
    max_nodes_per_cluster: 5000,
    max_pods_per_node: 250,
    cni: 'Azure CNI',
    serverless_option: 'Virtual Nodes (ACI)',
    auto_upgrade: true,
    fleet_management: 'Azure Kubernetes Fleet Manager',
    docs: 'https://azure.microsoft.com/products/kubernetes-service',
  },
  {
    provider: 'gcp',
    service: 'Google Kubernetes Engine',
    short: 'GKE',
    control_plane_hourly: 0.10, // Per-cluster mgmt fee; one zonal cluster free
    free_control_plane: true, // One zonal/Autopilot cluster free per billing account
    sla: 99.95,
    latest_version: '1.33',
    max_nodes_per_cluster: 65000,
    max_pods_per_node: 256,
    cni: 'GKE Dataplane V2 (Cilium)',
    serverless_option: 'Autopilot',
    auto_upgrade: true,
    fleet_management: 'GKE Fleets / Anthos',
    docs: 'https://cloud.google.com/kubernetes-engine',
  },
  {
    provider: 'oci',
    service: 'OCI Container Engine for Kubernetes',
    short: 'OKE',
    control_plane_hourly: 0.0, // Basic clusters free; Enhanced ~0.10/hr
    free_control_plane: true,
    sla: 99.95,
    latest_version: '1.32',
    max_nodes_per_cluster: 2000,
    max_pods_per_node: 110,
    cni: 'OCI VCN-Native / Flannel',
    serverless_option: 'Virtual Nodes',
    auto_upgrade: true,
    fleet_management: 'OCI Fleet App Management',
    docs: 'https://www.oracle.com/cloud/cloud-native/kubernetes-engine/',
  },
  {
    provider: 'ibm',
    service: 'IBM Cloud Kubernetes Service',
    short: 'IKS',
    control_plane_hourly: 0.0, // Managed master free; pay for workers
    free_control_plane: true,
    sla: 99.99,
    latest_version: '1.32',
    max_nodes_per_cluster: 500,
    max_pods_per_node: 110,
    cni: 'Calico',
    serverless_option: null,
    auto_upgrade: false,
    fleet_management: 'Multicloud Object / Satellite',
    docs: 'https://www.ibm.com/products/kubernetes-service',
  },
  {
    provider: 'do',
    service: 'DigitalOcean Kubernetes',
    short: 'DOKS',
    control_plane_hourly: 0.0, // Standard control plane free; HA ~ $40/mo
    free_control_plane: true,
    sla: 99.95,
    latest_version: '1.32',
    max_nodes_per_cluster: 512,
    max_pods_per_node: 110,
    cni: 'Cilium',
    serverless_option: null,
    auto_upgrade: true,
    fleet_management: null,
    docs: 'https://www.digitalocean.com/products/kubernetes',
  },
  {
    provider: 'ovhcloud',
    service: 'OVHcloud Managed Kubernetes',
    short: 'OVH MKS',
    control_plane_hourly: 0.0, // Free control plane
    free_control_plane: true,
    sla: 99.9,
    latest_version: '1.31',
    max_nodes_per_cluster: 100,
    max_pods_per_node: 110,
    cni: 'Cilium / Canal',
    serverless_option: null,
    auto_upgrade: true,
    fleet_management: null,
    docs: 'https://www.ovhcloud.com/en/public-cloud/kubernetes/',
  },
  {
    provider: 'scaleway',
    service: 'Scaleway Kubernetes Kapsule',
    short: 'Kapsule',
    control_plane_hourly: 0.0, // Shared control plane free; Dedicated ~€0.10/hr
    free_control_plane: true,
    sla: 99.95,
    latest_version: '1.31',
    max_nodes_per_cluster: 500,
    max_pods_per_node: 110,
    cni: 'Cilium',
    serverless_option: null,
    auto_upgrade: true,
    fleet_management: null,
    docs: 'https://www.scaleway.com/en/kubernetes-kapsule/',
  },
  {
    provider: 'nebius',
    service: 'Nebius Managed Kubernetes',
    short: 'Nebius MK8s',
    control_plane_hourly: 0.0, // Free managed control plane
    free_control_plane: true,
    sla: 99.95,
    latest_version: '1.31',
    max_nodes_per_cluster: 1000,
    max_pods_per_node: 110,
    cni: 'Cilium',
    serverless_option: null,
    auto_upgrade: true,
    fleet_management: null,
    docs: 'https://nebius.com/services/managed-kubernetes',
  },
  {
    provider: 'scp',
    service: 'Samsung Cloud Platform Kubernetes Engine',
    short: 'SCP KE',
    // SCP pricing/limits are not publicly documented in detail — left null so
    // the UI shows "—" rather than implying a figure we cannot source.
    control_plane_hourly: null,
    free_control_plane: false,
    sla: null,
    latest_version: null,
    max_nodes_per_cluster: null,
    max_pods_per_node: null,
    cni: 'Calico',
    serverless_option: null,
    auto_upgrade: false,
    fleet_management: null,
    docs: 'https://cloud.samsungsds.com/serviceportal/product/kubernetes-engine',
  },
];

export const getProviders = () =>
  [...new Set(k8sServices.map((s) => s.provider))].sort();
