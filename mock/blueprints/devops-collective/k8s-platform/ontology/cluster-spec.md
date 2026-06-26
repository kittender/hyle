# Cluster Specification

## Environments
- `dev` — single node pool, spot instances, no SLA.
- `staging` — mirrors prod topology at reduced scale.
- `prod` — multi-AZ, autoscaling, PodDisruptionBudgets required.

## Conventions
- All workloads declare resource requests *and* limits.
- Every Deployment has liveness + readiness probes.
- Config via ConfigMap/Secret, never baked into images.
