using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Features.Authentication.Commands;
using JobAppTracker.Application.Features.Authentication.DTOs;
using JobAppTracker.Application.Mappers;
using JobAppTracker.Domain.Entities;
using JobAppTracker.Application.Common.Settings;
using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;

namespace JobAppTracker.Application.Features.Authentication.Handlers
{
    public class LoginUserHandler : IRequestHandler<LoginUserCommand, LoginUserDto>
    {
        private readonly UserManager<User> _usermanager;
        private readonly SignInManager<User> _signInManager;

        public LoginUserHandler(UserManager<User> userManager, SignInManager<User> signInManager)
        {
            _usermanager = userManager;
            _signInManager = signInManager;
        }

        public async Task<LoginUserDto> Handle(
            LoginUserCommand request,
            CancellationToken cancellationToken
        )
        {
            // find user by email
            var user = await _usermanager.FindByEmailAsync(request.Email);
            if (user is null)
            {
                throw new UnauthorizedException("Invalid email or password");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(
                user,
                request.Password,
                lockoutOnFailure: true
            );
            if (result.IsLockedOut)
            {
                throw new UnauthorizedException("Too many failed attempts. Try again in 15 minutes.");
            }
            if (!result.Succeeded)
            {
                throw new UnauthorizedException("Invalid email or password");
            }

            // Remember when this login started so the absolute session limit can be enforced
            var properties = new AuthenticationProperties { IsPersistent = false };
            properties.Items[AuthSettings.SessionStartKey] = DateTimeOffset.UtcNow.ToString("O");
            await _signInManager.SignInAsync(user, properties);

            // get the user role
            var roles = await _usermanager.GetRolesAsync(user);

            return AuthenticationMapper.ToLoginUserDto(user, roles);
        }
    }
}
