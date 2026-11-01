using OpenIddict.Abstractions;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace JobAppTracker.API.Authentication;

// Registers the OAuth clients allowed to log users in. Runs at every startup (create or update),
// so changing a redirect URI here and redeploying is enough.
public class OAuthClientSeeder(IServiceProvider serviceProvider) : IHostedService
{
    // Client IDs: type the first one into Claude's "Add custom connector" dialog (advanced settings).
    public const string ClaudeClientId = "jobapptracker-claude";
    public const string InspectorClientId = "jobapptracker-inspector";

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = serviceProvider.CreateAsyncScope();
        var manager = scope.ServiceProvider.GetRequiredService<IOpenIddictApplicationManager>();

        // Claude apps (claude.ai web, desktop, mobile) always return to this fixed callback.
        await UpsertAsync(
            manager,
            CreateDescriptor(
                ClaudeClientId,
                "Claude",
                "https://claude.ai/api/mcp/auth_callback"
            ),
            cancellationToken
        );

        // MCP Inspector (used to test the server from a developer machine).
        await UpsertAsync(
            manager,
            CreateDescriptor(
                InspectorClientId,
                "MCP Inspector",
                "http://localhost:6274/oauth/callback",
                "http://localhost:6274/oauth/callback/debug",
                "http://127.0.0.1:6274/oauth/callback",
                "http://127.0.0.1:6274/oauth/callback/debug"
            ),
            cancellationToken
        );
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    // Public client = no secret (browser/desktop apps cannot keep one). PKCE protects the flow instead.
    private static OpenIddictApplicationDescriptor CreateDescriptor(
        string clientId,
        string displayName,
        params string[] redirectUris
    )
    {
        var descriptor = new OpenIddictApplicationDescriptor
        {
            ClientId = clientId,
            ClientType = ClientTypes.Public,
            ConsentType = ConsentTypes.Implicit,
            DisplayName = displayName,
            Permissions =
            {
                Permissions.Endpoints.Authorization,
                Permissions.Endpoints.Token,
                Permissions.GrantTypes.AuthorizationCode,
                Permissions.GrantTypes.RefreshToken,
                Permissions.ResponseTypes.Code,
                Permissions.Prefixes.Scope + "mcp",
                Permissions.Prefixes.Scope + Scopes.OfflineAccess,
            },
            Requirements = { Requirements.Features.ProofKeyForCodeExchange },
        };

        foreach (var uri in redirectUris)
            descriptor.RedirectUris.Add(new Uri(uri));

        return descriptor;
    }

    private static async Task UpsertAsync(
        IOpenIddictApplicationManager manager,
        OpenIddictApplicationDescriptor descriptor,
        CancellationToken cancellationToken
    )
    {
        var existing = await manager.FindByClientIdAsync(descriptor.ClientId!, cancellationToken);
        if (existing is null)
            await manager.CreateAsync(descriptor, cancellationToken);
        else
            await manager.UpdateAsync(existing, descriptor, cancellationToken);
    }
}
