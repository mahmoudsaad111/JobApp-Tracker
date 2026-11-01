using System.Security.Claims;
using JobAppTracker.Domain.Entities;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace JobAppTracker.API.Controllers;

// The two OAuth endpoints Claude calls: /connect/authorize (browser login) and /connect/token (code -> token).
// OpenIddict validates the protocol details (PKCE, redirect URI, client); this controller only decides WHO the user is.
[ApiExplorerSettings(IgnoreApi = true)]
public class OAuthController(
    UserManager<User> userManager,
    SignInManager<User> signInManager,
    IConfiguration configuration
) : ControllerBase
{
    [HttpGet("~/connect/authorize"), HttpPost("~/connect/authorize"), IgnoreAntiforgeryToken]
    public async Task<IActionResult> Authorize()
    {
        var request = HttpContext.GetOpenIddictServerRequest()
            ?? throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

        // Is the user already signed in on the website? (normal Identity cookie)
        var cookieResult = await HttpContext.AuthenticateAsync(IdentityConstants.ApplicationScheme);
        if (!cookieResult.Succeeded || cookieResult.Principal is null)
        {
            // Not signed in: send them to the Angular login page and come back to this exact URL afterwards.
            var parameters = Request.HasFormContentType ? Request.Form.ToList() : Request.Query.ToList();
            var returnUrl = Request.PathBase + Request.Path + QueryString.Create(parameters);
            return Redirect("/auth/login?returnUrl=" + Uri.EscapeDataString(returnUrl));
        }

        var user = await userManager.GetUserAsync(cookieResult.Principal);
        if (user is null || !await signInManager.CanSignInAsync(user))
            return Forbid(
                Error(Errors.AccessDenied, "The user is not allowed to sign in."),
                OpenIddictServerAspNetCoreDefaults.AuthenticationScheme
            );

        // The token only carries the user id ("sub"). Name, email and the like are not needed by the MCP tools.
        var identity = new ClaimsIdentity(
            OpenIddictServerAspNetCoreDefaults.AuthenticationScheme,
            Claims.Name,
            Claims.Role
        );
        identity.SetClaim(Claims.Subject, user.Id.ToString());

        var principal = new ClaimsPrincipal(identity);
        principal.SetScopes(request.GetScopes());

        // The token is only valid for our MCP endpoint (audience check on /mcp, step D4).
        principal.SetResources(configuration["Mcp:ResourceUrl"]!);

        // Put every claim into the access token only.
        principal.SetDestinations(_ => [Destinations.AccessToken]);

        return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    [HttpPost("~/connect/token"), IgnoreAntiforgeryToken, Produces("application/json")]
    public async Task<IActionResult> Exchange()
    {
        var request = HttpContext.GetOpenIddictServerRequest()
            ?? throw new InvalidOperationException("The OpenID Connect request cannot be retrieved.");

        if (!request.IsAuthorizationCodeGrantType() && !request.IsRefreshTokenGrantType())
            throw new InvalidOperationException("The specified grant type is not supported.");

        // OpenIddict already validated the code / refresh token; this is the principal stored inside it.
        var result = await HttpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        var principal = result.Principal
            ?? throw new InvalidOperationException("The token principal cannot be retrieved.");

        // The user may have been deleted, locked or disabled since the token was issued.
        var user = await userManager.FindByIdAsync(principal.GetClaim(Claims.Subject)!);
        if (user is null || !await signInManager.CanSignInAsync(user) || await userManager.IsLockedOutAsync(user))
            return Forbid(
                Error(Errors.InvalidGrant, "The user is no longer allowed to sign in."),
                OpenIddictServerAspNetCoreDefaults.AuthenticationScheme
            );

        return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
    }

    private static AuthenticationProperties Error(string error, string description) =>
        new(
            new Dictionary<string, string?>
            {
                [OpenIddictServerAspNetCoreConstants.Properties.Error] = error,
                [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = description,
            }
        );
}
