export { ErrorCodes, type ErrorCode } from './codes';
export type { ErrorDomain, Severity } from './error-classes';
export {
  AuthErrorContextSchema,
  BaseErrorContextSchema,
  CreditErrorContextSchema,
  GenerationErrorContextSchema,
  PaymentErrorContextSchema,
  RateLimitErrorContextSchema,
  ValidationErrorContextSchema,
} from './schemas';
export {
  ProductPixError,
  createAuthError,
  createCreditError,
  createGenerationError,
  createPaymentError,
  createRateLimitError,
  createValidationError,
} from './error-classes';