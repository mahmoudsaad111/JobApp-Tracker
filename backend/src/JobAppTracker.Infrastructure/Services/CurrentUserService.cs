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

        public Guid UserId =>
            Guid.Parse(
                _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            );
        public Guid? UserIdOrNull =>
    Guid.TryParse(
        _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value,
        out var id) ? id : null;
    }
}
