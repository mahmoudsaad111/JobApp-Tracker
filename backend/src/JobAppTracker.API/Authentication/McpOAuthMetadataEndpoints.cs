namespace JobAppTracker.API.Authentication;

// Public "protected resource metadata" (RFC 9728): tells Claude which login server protects /mcp.
public static class McpOAuthMetadataEndpoints
{
    public static WebApplication MapMcpOAuthMetadata(this WebApplication app)
    {
        var resourceUrl = app.Configuration["Mcp:ResourceUrl"]
            ?? throw new InvalidOperationException("Mcp:ResourceUrl is not configured.");

        var metadata = new
        {
            resource = resourceUrl,
            authorization_servers = new[] { OAuthServiceCollectionExtensions.IssuerFor(resourceUrl) },
            scopes_supported = new[] { "mcp" },
            bearer_methods_supported = new[] { "header" },
        };

        // Clients may ask for the root path or the path that matches the MCP URL (/mcp).
        app.MapGet("/.well-known/oauth-protected-resource", () => metadata).AllowAnonymous();
        app.MapGet("/.well-known/oauth-protected-resource/mcp", () => metadata).AllowAnonymous();

        return app;
    }
}
