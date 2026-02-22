/**
 * Error handling utilities for Hive blockchain operations
 * @module core/errors
 */

export {
  ErrorType,
  type ParsedChainError,
  parseChainError,
  formatError,
  shouldTriggerAuthFallback,
  isResourceCreditsError,
  isInfoError,
  isNetworkError,
} from "./chain-errors";
