import { describe, it, expect } from "vitest";
import {
  parseChainError,
  formatError,
  shouldTriggerAuthFallback,
  isResourceCreditsError,
  isInfoError,
  isNetworkError,
  ErrorType,
} from "./chain-errors";

describe("chain-errors", () => {
  describe("parseChainError", () => {
    it("should parse insufficient RC error", () => {
      const error = new Error("Please wait to transact, or power up HIVE.");
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.INSUFFICIENT_RESOURCE_CREDITS);
      expect(result.message).toContain("Resource Credits");
      expect(result.originalError).toBe(error);
    });

    it("should parse insufficient RC with different pattern", () => {
      const error = { message: "Insufficient RC mana" };
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.INSUFFICIENT_RESOURCE_CREDITS);
    });

    it("should parse min comment interval error", () => {
      const error = new Error("You may only post once every 3 seconds");
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.COMMON);
      expect(result.message).toContain("wait before posting");
    });

    it("should parse identical vote error", () => {
      const error = new Error("Your current vote on this comment is identical");
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.INFO);
      expect(result.message).toContain("already voted");
    });

    it("should parse must claim something error", () => {
      const error = { message: "Must claim something" };
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.INFO);
      expect(result.message).toContain("must claim");
    });

    it("should parse cannot claim VESTS error", () => {
      const error = new Error("Cannot claim that much VESTS");
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.INFO);
      expect(result.message).toContain("Cannot claim");
    });

    it("should parse cannot delete comment with votes error", () => {
      const error = new Error("Cannot delete a comment with net positive votes");
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.INFO);
      expect(result.message).toContain("Cannot delete");
    });

    it("should parse comment has children error", () => {
      const error = { message: "Assert Exception:c.children == 0" };
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.COMMON);
      expect(result.message).toContain("with replies");
    });

    it("should parse comment cashout error", () => {
      const error = new Error("comment_cashout has already occurred");
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.COMMON);
      expect(result.message).toContain("paid out");
    });

    it("should parse voting on paid out post error", () => {
      const error = {
        message: "Votes evaluating for comment that is paid out is forbidden",
      };
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.COMMON);
      expect(result.message).toContain("paid out");
    });

    it("should parse missing active authority error", () => {
      const error = new Error("Missing Active Authority alice");
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.MISSING_AUTHORITY);
      expect(result.message).toContain("active");
    });

    it("should parse missing owner authority error", () => {
      const error = { message: "Missing Owner Authority bob" };
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.MISSING_AUTHORITY);
      expect(result.message).toContain("owner");
    });

    it("should parse missing posting authority error", () => {
      const error = new Error("Missing required posting authority");
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.MISSING_AUTHORITY);
      expect(result.message).toContain("posting authority");
    });

    it("should parse token expired error", () => {
      const error = { message: "Token expired" };
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.TOKEN_EXPIRED);
      expect(result.message).toContain("expired");
    });

    it("should parse invalid token error", () => {
      const error = new Error("Invalid token");
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.TOKEN_EXPIRED);
    });

    it("should parse already reblogged error", () => {
      const error = { message: "alice has already reblogged this post" };
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.INFO);
      expect(result.message).toContain("already reblogged");
    });

    it("should parse duplicate transaction error", () => {
      const error = new Error("Duplicate transaction check failed");
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.INFO);
      expect(result.message).toContain("already been processed");
    });

    it("should parse network error", () => {
      const error = new Error("Network request failed");
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.NETWORK);
      expect(result.message).toContain("Network error");
    });

    it("should parse connection refused error", () => {
      const error = { message: "ECONNREFUSED" };
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.NETWORK);
    });

    it("should parse timeout error", () => {
      const error = new Error("Request timed out");
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.TIMEOUT);
      expect(result.message).toContain("timed out");
    });

    it("should parse account not found error", () => {
      const error = { message: "Account nonexistent does not exist" };
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.VALIDATION);
      expect(result.message).toContain("not found");
    });

    it("should parse invalid memo key error", () => {
      const error = new Error("Invalid memo key");
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.VALIDATION);
      expect(result.message).toContain("memo key");
    });

    it("should parse insufficient funds error", () => {
      const error = { message: "Insufficient funds: need 10 HIVE" };
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.VALIDATION);
      expect(result.message).toContain("Insufficient funds");
    });

    it("should handle error with error_description field", () => {
      const error = {
        error_description: "Custom error description from API",
      };
      const result = parseChainError(error);

      expect(result.message).toBe("Custom error description from API");
      expect(result.type).toBe(ErrorType.COMMON);
    });

    it("should match patterns in error_description when both message and error_description exist", () => {
      const error = {
        message: "Request failed",
        error_description: "Missing Active Authority alice"
      };
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.MISSING_AUTHORITY);
      expect(result.message).toContain("active");
    });

    it("should match patterns in message when error_description doesn't match", () => {
      const error = {
        message: "Missing Active Authority bob",
        error_description: "Some generic error"
      };
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.MISSING_AUTHORITY);
      expect(result.message).toContain("active");
    });

    it("should truncate long error messages", () => {
      const longMessage = "A".repeat(200);
      const error = new Error(longMessage);
      const result = parseChainError(error);

      expect(result.message.length).toBeLessThanOrEqual(150);
    });

    it("should handle string errors", () => {
      const error = "Something went wrong";
      const result = parseChainError(error);

      expect(result.message).toBe(error);
      expect(result.type).toBe(ErrorType.COMMON);
    });

    it("should match patterns in plain string inputs", () => {
      const error = "Missing Active Authority alice";
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.MISSING_AUTHORITY);
      expect(result.message).toContain("active");
    });

    it("should match RC patterns in plain string inputs", () => {
      const error = "Please wait to transact, or power up HIVE.";
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.INSUFFICIENT_RESOURCE_CREDITS);
      expect(result.message).toContain("Resource Credits");
    });

    it("should handle empty/null errors", () => {
      const result1 = parseChainError(null);
      expect(result1.message).toBe("Unknown error occurred");

      const result2 = parseChainError(undefined);
      expect(result2.message).toBe("Unknown error occurred");

      const result3 = parseChainError("");
      expect(result3.message).toBe("Unknown error occurred");
    });

    it("should handle error objects without message", () => {
      const error = { code: 500 };
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.COMMON);
    });

    it('should handle plain objects without message property (avoid "[object Object]")', () => {
      const plainObject = { code: 500, data: { foo: 'bar' } };
      const result = parseChainError(plainObject);

      expect(result.type).toBe(ErrorType.COMMON);
      expect(result.message).not.toBe('[object Object]');
      expect(result.message).toBe('Error code: 500');
    });

    it('should handle objects with error_description in fallback path', () => {
      const errorObj = { error_description: 'Something went wrong', otherField: 123 };
      const result = parseChainError(errorObj);

      expect(result.type).toBe(ErrorType.COMMON);
      expect(result.message).toBe('Something went wrong');
    });

    it('should handle plain objects with no recognizable error properties', () => {
      const plainObject = { foo: 'bar', baz: 123 };
      const result = parseChainError(plainObject);

      expect(result.type).toBe(ErrorType.COMMON);
      expect(result.message).toBe('Unknown error occurred');
      expect(result.message).not.toBe('[object Object]');
    });
  });

  describe("formatError", () => {
    it("should return tuple of [message, type]", () => {
      const error = new Error("Please wait to transact");
      const [message, type] = formatError(error);

      expect(typeof message).toBe("string");
      expect(type).toBe(ErrorType.INSUFFICIENT_RESOURCE_CREDITS);
    });

    it("should be backward compatible with old formatError signature", () => {
      const error = { message: "Missing Active Authority" };
      const result = formatError(error);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toContain("active");
      expect(result[1]).toBe(ErrorType.MISSING_AUTHORITY);
    });
  });

  describe("shouldTriggerAuthFallback", () => {
    it("should return true for missing authority errors", () => {
      const error = new Error("Missing required posting authority");
      expect(shouldTriggerAuthFallback(error)).toBe(true);
    });

    it("should return true for token expired errors", () => {
      const error = { message: "Token expired" };
      expect(shouldTriggerAuthFallback(error)).toBe(true);
    });

    it("should return false for RC errors", () => {
      const error = new Error("Please wait to transact");
      expect(shouldTriggerAuthFallback(error)).toBe(false);
    });

    it("should return false for network errors", () => {
      const error = { message: "Network request failed" };
      expect(shouldTriggerAuthFallback(error)).toBe(false);
    });

    it("should return false for info errors", () => {
      const error = new Error("You have already reblogged this post");
      expect(shouldTriggerAuthFallback(error)).toBe(false);
    });
  });

  describe("isResourceCreditsError", () => {
    it("should return true for RC errors", () => {
      const error = new Error("Please wait to transact");
      expect(isResourceCreditsError(error)).toBe(true);
    });

    it("should return true for insufficient RC pattern", () => {
      const error = { message: "Insufficient RC account" };
      expect(isResourceCreditsError(error)).toBe(true);
    });

    it("should return false for non-RC errors", () => {
      const error = new Error("Missing authority");
      expect(isResourceCreditsError(error)).toBe(false);
    });
  });

  describe("isInfoError", () => {
    it("should return true for informational errors", () => {
      const errors = [
        "Your current vote on this comment is identical",
        "You have already reblogged this post",
        "Must claim something",
        "Cannot claim that much VESTS",
        "Cannot delete a comment with net positive votes",
      ];

      errors.forEach((msg) => {
        expect(isInfoError(new Error(msg))).toBe(true);
      });
    });

    it("should return false for critical errors", () => {
      const error = new Error("Missing Active Authority");
      expect(isInfoError(error)).toBe(false);
    });
  });

  describe("isNetworkError", () => {
    it("should return true for network errors", () => {
      const errors = [
        "Network request failed",
        "ECONNREFUSED",
        "Connection refused",
        "Failed to fetch",
      ];

      errors.forEach((msg) => {
        expect(isNetworkError(new Error(msg))).toBe(true);
      });
    });

    it("should return true for timeout errors", () => {
      const errors = ["Request timed out", "Connection timeout"];

      errors.forEach((msg) => {
        expect(isNetworkError(new Error(msg))).toBe(true);
      });
    });

    it("should return false for non-network errors", () => {
      const error = new Error("Missing authority");
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle error objects with nested properties", () => {
      const error = {
        response: {
          data: {
            error_description: "Nested error description",
          },
        },
        message: "Top level message",
      };

      const result = parseChainError(error);
      expect(result.message).toBe("Top level message");
    });

    it("should handle errors with only toString method", () => {
      const error = {
        toString: () => "Custom toString error",
      };

      const result = parseChainError(error);
      expect(result.message).toContain("Custom toString");
    });

    it("should handle multiple error patterns in same message", () => {
      const error = new Error(
        "Network timeout: Please wait to transact due to insufficient RC"
      );
      const result = parseChainError(error);

      // Should match the first pattern encountered (RC is checked before timeout in our implementation)
      expect(result.type).toBe(ErrorType.INSUFFICIENT_RESOURCE_CREDITS);
    });

    it("should preserve original error for debugging", () => {
      const originalError = new Error("Test error");
      const result = parseChainError(originalError);

      expect(result.originalError).toBe(originalError);
    });

    it("should not misclassify 'social network' as network error", () => {
      const error = new Error("Welcome to our social network platform");
      const result = parseChainError(error);

      // Should not be classified as network error due to strict regex
      expect(result.type).not.toBe(ErrorType.NETWORK);
      expect(result.type).toBe(ErrorType.COMMON);
    });

    it("should detect network-down as network error", () => {
      const error = new Error("Network down, please try again");
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.NETWORK);
      expect(result.message).toContain("Network error");
    });

    it("should detect network-unreachable as network error", () => {
      const error = new Error("Network unreachable");
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.NETWORK);
      expect(result.message).toContain("Network error");
    });

    it("should handle validation errors with word boundaries", () => {
      const error = new Error("Invalid parameter provided");
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.VALIDATION);
      expect(result.message).toContain("Invalid parameter");
    });

    it("should truncate long validation error messages to 150 characters", () => {
      const longValidationMessage = "Invalid parameter: " + "A".repeat(200);
      const error = new Error(longValidationMessage);
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.VALIDATION);
      expect(result.message.length).toBe(150);
      expect(result.message).toBe(longValidationMessage.substring(0, 150));
    });

    it("should not misclassify 'invalidate cache' as validation error", () => {
      const error = new Error("Need to invalidate cache");
      const result = parseChainError(error);

      // Should not match because 'invalidate' doesn't have word boundary on 'invalid'
      expect(result.type).toBe(ErrorType.COMMON);
    });

    it("should handle plain object with code property only", () => {
      const error = { code: 404 };
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.COMMON);
      expect(result.message).toBe("Error code: 404");
      expect(result.message).not.toBe("[object Object]");
    });

    it("should handle plain object with only custom properties", () => {
      const error = { customField: "value", anotherField: 123 };
      const result = parseChainError(error);

      expect(result.type).toBe(ErrorType.COMMON);
      expect(result.message).toBe("Unknown error occurred");
      expect(result.message).not.toBe("[object Object]");
    });
  });
});
