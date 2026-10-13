using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Common.Interfaces;
using JobAppTracker.Application.Common.Templates;
using JobAppTracker.Application.Features.Authentication.Commands;
using JobAppTracker.Application.Features.Authentication.DTOs;
using JobAppTracker.Application.Interfaces.Services.Email;
using JobAppTracker.Application.Interfaces.Services.Frontend;
using JobAppTracker.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace JobAppTracker.Application.Features.Authentication.Handlers
{
    public class ForgotPasswordHandler : IRequestHandler<ForgotPasswordCommand, ForgotPasswordDto>
    {
        private readonly UserManager<User> _userManager;
        private readonly IEmailService _emailService;
        private readonly IFrontendUrlService _frontendUrlService;

        public ForgotPasswordHandler(
            UserManager<User> userManager,
            IEmailService emailService,
            IFrontendUrlService frontendUrlService
        )
        {
            _userManager = userManager;
            _emailService = emailService;
            _frontendUrlService = frontendUrlService;
        }

        public async Task<ForgotPasswordDto> Handle(
            ForgotPasswordCommand request,
            CancellationToken cancellationToken
        )
        {
            // Always return the same response to prevent email enumeration.
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user is null)
                return new ForgotPasswordDto();

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var encoded = Uri.EscapeDataString(token);
            var email = Uri.EscapeDataString(request.Email);
            var resetLink = _frontendUrlService.ResetPassword(encoded, email);

            await _emailService.SendEmailAsync(
                request.Email,
                EmailTemplates.ResetPasswordSubject,
                EmailTemplates.ResetPassword(user.FirstName, resetLink)
            );

            return new ForgotPasswordDto();
        }
    }
}
