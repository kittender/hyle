# Security Baseline

## no-root-containers
**Severity:** critical
Containers run as non-root with `readOnlyRootFilesystem: true`.

## network-policies-required
**Severity:** critical
Every namespace has a default-deny NetworkPolicy; ingress is explicit.

## no-cluster-admin-bindings
**Severity:** warning
Workloads never bind to `cluster-admin`; scope RBAC to the namespace.
