using System;

namespace JobAppTracker.Domain.Common.Exceptions
{
    /// <summary>
    /// Thrown when a domain invariant is violated (invalid state, bad input to
    /// an entity's factory/behavior methods, illegal state transition, etc.).
    /// Kept independent from JobAppTracker.Application so the Domain project
    /// never has to reference outward.
    /// </summary>
    public class DomainException : Exception
    {
        public DomainException(string message)
            : base(message) { }

        public DomainException(string message, Exception innerException)
            : base(message, innerException) { }
    }
}
