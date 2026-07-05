using System.Net;
using System.Text.Json;
using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Common.Responses;
using JobAppTracker.Domain.Common.Exceptions;

namespace JobAppTracker.API.Middlewares;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
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

    private static async Task HandleException(HttpContext context, Exception ex)
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

            case DomainException domainEx:
                statusCode = HttpStatusCode.BadRequest;

                response = ApiResponse<object>.FailureResult(null, domainEx.Message);
                break;

            default:
                statusCode = HttpStatusCode.InternalServerError;

                response = ApiResponse<object>.FailureResult(null, "Internal server error");
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
