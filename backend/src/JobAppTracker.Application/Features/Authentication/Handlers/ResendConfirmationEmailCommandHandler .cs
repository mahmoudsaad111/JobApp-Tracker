using System;
using System.Collections.Generic;
using System.Net;
using System.Text;
using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Common.Templates;
using JobAppTracker.Application.Features.Authentication.Commands;
using JobAppTracker.Application.Interfaces.Services.Email;
using JobAppTracker.Application.Interfaces.Services.Frontend;
using JobAppTracker.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;

namespace JobAppTracker.Application.Features.Authentication.Handlers
{
    public class ResendConfirmationEmailCommandHandler
        : IRequestHandler<ResendConfirmationEmailCommand, bool>
    {
        private readonly UserManager<User> _userManager;
        private readonly IEmailService _emailService; // your existing email service
        private readonly IFrontendUrlService _frontendUrlService;

        public ResendConfirmationEmailCommandHandler(
            UserManager<User> userManager,
            IEmailService emailService,
            IFrontendUrlService frontendUrlService
        )
        {
            _userManager = userManager;
            _emailService = emailService;
            _frontendUrlService = frontendUrlService;
        }

        public async Task<bool> Handle(
            ResendConfirmationEmailCommand request,
            CancellationToken cancellationToken
        )
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
    
            if (user == null || user.EmailConfirmed)
                 return true; // same response whether or not the account exists or is confirmed

            var token        = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var encodedToken = WebUtility.UrlEncode(token);
            var link         = _frontendUrlService.EmailConfirmation(user.Id.ToString(), encodedToken);

            await _emailService.SendEmailAsync(
                request.Email,
                EmailTemplates.ConfirmEmailSubject,
                EmailTemplates.ConfirmEmail(user.FirstName, link)
            );

            return true;
        }
    }
}
