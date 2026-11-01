using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;

namespace JobAppTracker.API.Authentication;

// Claude only starts the browser login when /mcp answers 401 AND the WWW-Authenticate header points at
// the protected-resource metadata. Every other authorization result keeps the default behavior.
public class McpAuthorizationResultHandler(IConfiguration configuration) : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _default = new();

    public Task HandleAsync(
        RequestDelegate next,
        HttpContext context,
        AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult
    )
    {
        if (authorizeResult.Challenged && context.Request.Path.StartsWithSegments("/mcp"))
        {
            var resourceUrl = configuration["Mcp:ResourceUrl"]!;
            var metadataUrl = new Uri(new Uri(resourceUrl), "/.well-known/oauth-protected-resource").AbsoluteUri;

            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.Headers.WWWAuthenticate = $"Bearer resource_metadata=\"{metadataUrl}\"";
            return Task.CompletedTask;
        }

        return _default.HandleAsync(next, context, policy, authorizeResult);
    }
}
