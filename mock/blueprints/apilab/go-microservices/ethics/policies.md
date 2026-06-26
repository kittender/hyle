# Policies

## least-privilege-network
**Severity:** critical
Services expose only the ports they need and deny all egress by default.

## structured-logs-only
**Severity:** warning
No `fmt.Println` debugging in committed code — use the structured logger.
