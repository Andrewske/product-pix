// Fields that should NEVER be sent to PostHog
const BLOCKLIST_FIELDS = [
  /email/i,
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /credential/i,
  /card/i,
  /cvv/i,
  /ssn/i,
  /phone/i,
  /address/i,
  /authorization/i,
  /cookie/i,
  /session/i,
  /^ip$/i,
];

// Patterns to redact in string values
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  ip: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  card: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  token: /\b[a-zA-Z0-9_-]{32,}\b/g,
  uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
};

export function sanitizeForPostHog(
  context: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    // Skip blocklisted field names
    if (BLOCKLIST_FIELDS.some(pattern => pattern.test(key))) {
      continue;
    }

    // Recursively sanitize the value
    sanitized[key] = sanitizeValue(value);
  }

  return sanitized;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    let sanitized = value;

    // Redact email addresses
    sanitized = sanitized.replace(PII_PATTERNS.email, '[EMAIL]');

    // Redact IP addresses
    sanitized = sanitized.replace(PII_PATTERNS.ip, '[IP]');

    // Redact credit card numbers
    sanitized = sanitized.replace(PII_PATTERNS.card, '[CARD]');

    // Redact long tokens, but keep UUIDs (useful for debugging)
    sanitized = sanitized.replace(PII_PATTERNS.token, (match) => {
      // Reset lastIndex for global regex
      PII_PATTERNS.uuid.lastIndex = 0;
      return PII_PATTERNS.uuid.test(match) ? match : '[TOKEN]';
    });

    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    return sanitizeForPostHog(value as Record<string, unknown>);
  }

  return value;
}