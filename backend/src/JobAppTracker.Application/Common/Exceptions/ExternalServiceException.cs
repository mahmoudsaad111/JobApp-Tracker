using System.Net;

namespace JobAppTracker.Application.Common.Exceptions;

/// <summary>
/// An outside service we depend on (for example the AI provider) failed or is unavailable.
/// Mapped to HTTP 503 so the user sees a friendly message instead of a generic 500.
/// </summary>
public class ExternalServiceException : AppException
{
    public ExternalServiceException(string message, List<string>? errors = null)
        : base(message, (int)HttpStatusCode.ServiceUnavailable, errors) { }
}
