using System;
using JobAppTracker.Domain.Common.Exceptions;

namespace JobAppTracker.Domain.Common
{
    /// <summary>
    /// Small set of guard clauses used by entity factory/behavior methods to
    /// enforce invariants and reject invalid input at the domain boundary.
    /// </summary>
    internal static class Guard
    {
        public static void AgainstNullOrWhiteSpace(string? value, string paramName)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new DomainException($"{paramName} is required.");
        }

        public static void AgainstExceedingLength(string? value, int maxLength, string paramName)
        {
            if (value != null && value.Length > maxLength)
                throw new DomainException($"{paramName} cannot exceed {maxLength} characters.");
        }

        public static void AgainstEmptyGuid(Guid value, string paramName)
        {
            if (value == Guid.Empty)
                throw new DomainException($"{paramName} must be a valid identifier.");
        }

        public static void AgainstInvalidEnum<TEnum>(TEnum value, string paramName)
            where TEnum : struct, Enum
        {
            if (!Enum.IsDefined(typeof(TEnum), value))
                throw new DomainException($"{paramName} is not a recognized value.");
        }

        public static void AgainstDefaultDate(DateTime value, string paramName)
        {
            if (value == default)
                throw new DomainException($"{paramName} must be a valid date.");
        }

        public static void AgainstFutureDate(DateTime value, string paramName)
        {
            if (value > DateTime.UtcNow)
                throw new DomainException($"{paramName} cannot be in the future.");
        }

        public static void AgainstNegativeOrZero(long value, string paramName)
        {
            if (value <= 0)
                throw new DomainException($"{paramName} must be greater than zero.");
        }

        public static void AgainstNegative(int value, string paramName)
        {
            if (value < 0)
                throw new DomainException($"{paramName} cannot be negative.");
        }
    }
}
