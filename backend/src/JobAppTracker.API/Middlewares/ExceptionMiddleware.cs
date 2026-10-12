using System.Net;
using System.Text.Json;
using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Common.Responses;
using JobAppTracker.Domain.Common.Exceptions;

namespace JobAppTracker.API.Middlewares;

public class ExceptionMiddleware
{
    // camelCase (message, errors, ...) so errors look the same as normal API responses
    // and the Angular app / extension can read them with the same property names.
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleException(context, ex);
        }
    }

    private async Task HandleException(HttpContext context, Exception ex)
    {
        var statusCode = HttpStatusCode.InternalServerError;

        object response;

        switch (ex)
        {
            case NotFoundException notFoundEx:
                statusCode = HttpStatusCode.NotFound;

                response = ApiResponse<object>.FailureResult(notFoundEx.Errors, notFoundEx.Message);
                break;

            case ValidationException validationEx:
                statusCode = HttpStatusCode.BadRequest;

                response = ApiResponse<object>.FailureResult(
                    validationEx.Errors,
                    validationEx.Message
                );
                break;

            case BadRequestException badRequestEx:
                statusCode = HttpStatusCode.BadRequest;

                response = ApiResponse<object>.FailureResult(
                    badRequestEx.Errors,
                    badRequestEx.Message
                );
                break;

            case ConflictException conflictEx:
                statusCode = HttpStatusCode.Conflict;

                response = ApiResponse<object>.FailureResult(conflictEx.Errors, conflictEx.Message);
                break;

            case ForbiddenException forbiddenEx:
                statusCode = HttpStatusCode.Forbidden;

                response = ApiResponse<object>.FailureResult(
                    forbiddenEx.Errors,
                    forbiddenEx.Message
                );
                break;

            case UnauthorizedException unauthorizedEx:
                statusCode = HttpStatusCode.Unauthorized;

                response = ApiResponse<object>.FailureResult(
                    unauthorizedEx.Errors,
                    unauthorizedEx.Message
                );
                break;

            case ExternalServiceException externalEx:
                // Expected when a provider is down: log as a warning, tell the user to retry.
                _logger.LogWarning(externalEx, "External service failed");
                statusCode = HttpStatusCode.ServiceUnavailable;

                response = ApiResponse<object>.FailureResult(externalEx.Errors, externalEx.Message);
                break;

            case DomainException domainEx:
                statusCode = HttpStatusCode.BadRequest;

                response = ApiResponse<object>.FailureResult(null, domainEx.Message);
                break;

            default:
                // Unexpected: this is the only place the real cause can be recorded.
                _logger.LogError(
                    ex,
                    "Unhandled exception on {Method} {Path}",
                    context.Request.Method,
                    context.Request.Path
                );
                statusCode = HttpStatusCode.InternalServerError;

                response = ApiResponse<object>.FailureResult(null, "Internal server error");
                break;
        }

        // Response already started (for example while streaming a file): we can't change it.
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
    }
}
