using System;
using System.Collections.Generic;
using System.Net;
using System.Text;
using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Common.Templates;
using JobAppTracker.Application.Features.Authentication.Commands;
using JobAppTracker.Application.Features.Authentication.DTOs;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Application.Interfaces.Services.Email;
using JobAppTracker.Application.Interfaces.Services.Frontend;
using JobAppTracker.Application.Mappers;
using JobAppTracker.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace JobAppTracker.Application.Features.Authentication.Handlers
{
    public class RegisterUserHandler : IRequestHandler<RegisterUserCommand, RegisterResultDto>
    {
        private readonly UserManager<User> _usermanager;
        private readonly ILogger<RegisterUserHandler> _logger;
        private readonly IEmailService _emailService;
        private readonly IFrontendUrlService _frontendUrlService;

        public RegisterUserHandler(
            UserManager<User> userManager,
            IEmailService emailService,
            IFrontendUrlService frontendUrlService,
            ILogger<RegisterUserHandler> logger
        )
        {
            _usermanager = userManager;
            _emailService = emailService;
            _frontendUrlService = frontendUrlService;
            _logger = logger;
        }

        public async Task<RegisterResultDto> Handle(
            RegisterUserCommand request,
            CancellationToken cancellationToken
        )
        {
            // 1. Check if email already exists
            if (await _usermanager.FindByEmailAsync(request.Email) != null)
                throw new BadRequestException("Email already in use");

            // 2. Create user
            var user = User.Create(
                email: request.Email,
                firstName: request.FirstName,
                lastName: request.LastName
            );

            // 3. Save to DB
           var result = await _usermanager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                throw new ValidationException(
                    "User creation failed",
                    result.Errors.Select(e => e.Description).ToList()
                );
            }

            // Optionally assign default role here, e.g. "User"
            await _usermanager.AddToRoleAsync(user, "User");

            // 4. Generate email confirmation token and send email
         

       var emailSent = true;
        try
        {
            var token = await _usermanager.GenerateEmailConfirmationTokenAsync(user);
            var link = _frontendUrlService.EmailConfirmation(user.Id.ToString(), WebUtility.UrlEncode(token));
            await _emailService.SendEmailAsync(
                user.Email,
                EmailTemplates.ConfirmEmailSubject,
                EmailTemplates.ConfirmEmail(user.FirstName, link));
        }
        catch (Exception ex)
        {
            emailSent = false;
            _logger.LogError(ex, "Could not send confirmation email to user {UserId}", user.Id);
        }

            // 5. Return result
            return AuthenticationMapper.ToRegisterResultDto(user) with { EmailSent = emailSent };
        }
    }
}
