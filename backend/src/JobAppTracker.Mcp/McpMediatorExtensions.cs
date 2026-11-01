using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Domain.Common.Exceptions;
using MediatR;
using ModelContextProtocol;

namespace JobAppTracker.Mcp;

internal static class McpMediatorExtensions
{
    // Sends a MediatR request and converts expected business errors into McpException.
    // McpException messages are shown to the AI model, so it can fix its input and retry.
    // Any other exception stays generic on purpose, so internal details never leak.
    public static async Task<TResponse> SendForMcpAsync<TResponse>(
        this IMediator mediator,
        IRequest<TResponse> request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            return await mediator.Send(request, cancellationToken);
        }
        catch (AppException exception)
        {
            // NotFound, Validation, Conflict, BadRequest, Forbidden, ExternalService...
            var details = exception.Errors is { Count: > 0 }
                ? $"{exception.Message}: {string.Join("; ", exception.Errors)}"
                : exception.Message;
            throw new McpException(details);
        }
        catch (DomainException exception)
        {
            throw new McpException(exception.Message);
        }
    }
}
