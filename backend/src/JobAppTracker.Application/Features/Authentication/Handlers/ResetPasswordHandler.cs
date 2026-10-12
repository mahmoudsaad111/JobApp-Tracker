using System;
using System.Collections.Generic;
using System.Linq;
using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Features.Authentication.Commands;
using JobAppTracker.Application.Features.Authentication.DTOs;
using JobAppTracker.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace JobAppTracker.Application.Features.Authentication.Handlers
{
    public class ResetPasswordHandler : IRequestHandler<ResetPasswordCommand, ResetPasswordDto>
    {
        // Same wording for "no such user" and "bad token" so the answer never reveals which accounts exist.
        private const string InvalidLinkMessage = "This link is invalid or has expired.";

        private readonly UserManager<User> _userManager;

        public ResetPasswordHandler(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public async Task<ResetPasswordDto> Handle(
            ResetPasswordCommand request,
            CancellationToken cancellationToken
        )
        {
            // Failures are thrown (HTTP 400) instead of returned, so the client can
            // never mistake a failed reset for a successful one.
            if (request.NewPassword != request.ConfirmNewPassword)
                throw new BadRequestException("Passwords do not match.");

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user is null)
                throw new BadRequestException(InvalidLinkMessage);

            var decodedToken = Uri.UnescapeDataString(request.Token);
            var result = await _userManager.ResetPasswordAsync(
                user,
                decodedToken,
                request.NewPassword
            );

            if (!result.Succeeded)
            {
                if (result.Errors.Any(e => e.Code == nameof(IdentityErrorDescriber.InvalidToken)))
                    throw new BadRequestException(InvalidLinkMessage);

                var errors = string.Join(" ", result.Errors.Select(e => e.Description));
                throw new BadRequestException(errors);
            }

            return new ResetPasswordDto
            {
                Success = true,
                Message = "Password reset successfully. You can now sign in.",
            };
        }
    }
}
