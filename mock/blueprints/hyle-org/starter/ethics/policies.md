# Policies

Behavioural limits every agent in this project must honour.

## no-secrets-in-output
**Severity:** critical
Agents must never print secrets, tokens, or `.env` values to logs or chat.

## human-in-the-loop-for-publish
**Severity:** warning
Publishing to a registry (`hyle push` / `release`) requires explicit human
confirmation; agents may prepare but not execute it autonomously.
