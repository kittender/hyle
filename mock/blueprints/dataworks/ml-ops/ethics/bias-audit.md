# Bias Audit

## subgroup-metrics-required
**Severity:** critical
Report accuracy, precision, and recall per protected subgroup, not just the aggregate.

## training-data-provenance
**Severity:** critical
Every dataset records its source, consent basis, and collection date. No
unprovenanced data enters training.

## drift-monitoring
**Severity:** warning
Production inputs are monitored for distribution drift against the training set.
