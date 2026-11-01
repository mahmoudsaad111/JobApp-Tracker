using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;
using JobAppTracker.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace JobAppTracker.Infrastructure.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        // The website's login cookie stores the user id as NameIdentifier; OAuth access tokens (used by /mcp)
        // store it as "sub". Both are the same user id.
        private string? UserIdValue =>
            _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? _httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value;

        public Guid UserId => Guid.Parse(UserIdValue!);

        public Guid? UserIdOrNull => Guid.TryParse(UserIdValue, out var id) ? id : null;
    }
}
