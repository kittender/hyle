# GDPR Compliance Guidelines

## Personal Data Categories
Governed by `ethics/policies.yaml`:
- email, username, display_name
- ip_address, user_agent
- Any `_id` field linked to a User aggregate

## Right to Erasure
Every aggregate root with PII must implement `purge()`:

```java
public void purge() {
    this.email = "deleted@gdpr.invalid";
    this.displayName = "Deleted User";
    this.purgedAt = Instant.now();
}
```

## Retention
Audit logs: 12 months max. Session data: 30 days.
