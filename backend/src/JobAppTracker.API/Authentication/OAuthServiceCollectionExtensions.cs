using System.Security.Cryptography.X509Certificates;
using JobAppTracker.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace JobAppTracker.API.Authentication;

// Turns this API into an OAuth 2.1 login server, so MCP clients (Claude) can sign users in with a browser.
public static class OAuthServiceCollectionExtensions
{
    // The login server's address (issuer) = the site root of the MCP URL, with a trailing slash.
    // The protected-resource metadata must name exactly this value.
    public static string IssuerFor(string resourceUrl) =>
        new Uri(resourceUrl).GetLeftPart(UriPartial.Authority) + "/";

    public static IServiceCollection AddMcpOAuth(
        this IServiceCollection services,
        IWebHostEnvironment environment,
        IConfiguration configuration
    )
    {
        // The public URL of the MCP endpoint. Tokens are issued for exactly this audience.
        var resourceUrl = configuration["Mcp:ResourceUrl"]
            ?? throw new InvalidOperationException("Mcp:ResourceUrl is not configured.");
        var issuer = IssuerFor(resourceUrl);

        services.AddOpenIddict().AddCore(options =>
                {
                    // Store OpenIddict's clients, authorizations and tokens in our existing database.
                    options.UseEntityFrameworkCore().UseDbContext<AppDbContext>();
                })
            .AddServer(options =>
            {
                // Use the configured public origin for discovery URLs; proxy request hosts may omit public ports.
                options.SetIssuer(new Uri(issuer));

                options.SetAuthorizationEndpointUris($"{issuer}connect/authorize")
                    .SetTokenEndpointUris($"{issuer}connect/token")
                    .SetConfigurationEndpointUris($"{issuer}.well-known/oauth-authorization-server")
                    .SetJsonWebKeySetEndpointUris($"{issuer}.well-known/jwks");

                // Browser login (authorization code) plus refresh tokens, so users stay signed in.
                options.AllowAuthorizationCodeFlow().AllowRefreshTokenFlow();

                // PKCE is mandatory: protects the code if someone intercepts it.
                options.RequireProofKeyForCodeExchange();

                // Scopes a client may request.
                options.RegisterScopes(Scopes.OfflineAccess, "mcp");

                // Claude sends a "resource" parameter (RFC 8707) naming the MCP server it wants a token for.
                // Accept our MCP URL (with and without a trailing slash) and rely on the scope permission.
                options.RegisterResources(resourceUrl, resourceUrl.TrimEnd('/') + "/");
                options.IgnoreResourcePermissions();

                var aspNetCore = options.UseAspNetCore()
                    .EnableAuthorizationEndpointPassthrough()   // our controller handles /connect/authorize
                    .EnableTokenEndpointPassthrough();          // our controller handles /connect/token

                if (environment.IsDevelopment())
                {
                    // Local test certificates, and allow plain http on localhost.
                    options.AddDevelopmentEncryptionCertificate().AddDevelopmentSigningCertificate();
                    aspNetCore.DisableTransportSecurityRequirement();
                }
                else
                {
                    options
                        .AddEncryptionCertificate(LoadCertificate(environment, configuration, "Encryption"))
                        .AddSigningCertificate(LoadCertificate(environment, configuration, "Signing"));
                }
            })
            .AddValidation(options =>
            {
                // /mcp checks access tokens issued by this same app (signature, expiry...).
                options.UseLocalServer();
                options.UseAspNetCore();

                // ...and only accepts tokens that were issued for the MCP URL.
                options.AddAudiences(resourceUrl);
            });

        // When /mcp rejects a request, answer 401 with a pointer to the metadata (Claude needs this to start login).
        services.AddSingleton<IAuthorizationMiddlewareResultHandler, McpAuthorizationResultHandler>();

        // Creates or updates the OAuth clients (Claude, MCP Inspector) every time the app starts.
        services.AddHostedService<OAuthClientSeeder>();

        return services;
    }

    private static X509Certificate2 LoadCertificate(
        IWebHostEnvironment environment,
        IConfiguration configuration,
        string purpose
    )
    {
        var section = configuration.GetSection($"Mcp:Certificates:{purpose}");
        var path = section["Path"];
        if (string.IsNullOrWhiteSpace(path))
        {
            throw new InvalidOperationException(
                $"Mcp:Certificates:{purpose}:Path must point to a persistent PFX certificate outside Development."
            );
        }

        // A relative path (for example App_Data/mcp-certs/mcp-signing.pfx) is resolved from the app folder.
        var fullPath = Path.IsPathRooted(path) ? path : Path.Combine(environment.ContentRootPath, path);

        var certificate = X509CertificateLoader.LoadPkcs12FromFile(
            fullPath,
            section["Password"],
            X509KeyStorageFlags.EphemeralKeySet
        );
        if (!certificate.HasPrivateKey)
        {
            certificate.Dispose();
            throw new InvalidOperationException(
                $"The MCP {purpose.ToLowerInvariant()} certificate must include its private key."
            );
        }

        return certificate;
    }
}
