# Experiment Logging

Every training run logs, at minimum:

- Dataset version (content hash, not just a path)
- Hyperparameters
- Git commit of the training code
- Metrics per epoch
- Random seed

## Why
Reproducibility is non-negotiable: a result you cannot reproduce is a result you
cannot trust.
