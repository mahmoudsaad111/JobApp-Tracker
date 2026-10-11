using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Features.Authentication.Commands;
using JobAppTracker.Application.Features.Authentication.DTOs;
using JobAppTracker.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace JobAppTracker.Application.Features.Authentication.Handlers
{
    public class VerifyEmailHandler : IRequestHandler<VerifyEmailCommand, VerifyEmailDto>
    {
        // One message for every failure, so the response never reveals
        // whether a user id exists or why the link was rejected.
        private const string InvalidLinkMessage = "This link is invalid or has expired.";

        private readonly UserManager<User> _userManager;

        public VerifyEmailHandler(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public async Task<VerifyEmailDto> Handle(
            VerifyEmailCommand request,
            CancellationToken cancellationToken
        )
        {
            var user = await _userManager.FindByIdAsync(request.UserId.ToString());
            if (user is null)
                throw new BadRequestException(InvalidLinkMessage);

            // Clicking the same link twice is normal, so treat it as success.
            if (user.EmailConfirmed)
                return Verified();

            var result = await _userManager.ConfirmEmailAsync(user, request.Token);
            if (!result.Succeeded)
                throw new BadRequestException(InvalidLinkMessage);

            return Verified();
        }

        private static VerifyEmailDto Verified() =>
            new VerifyEmailDto { IsSuccess = true, Message = "Email verified successfully" };
    }
}
