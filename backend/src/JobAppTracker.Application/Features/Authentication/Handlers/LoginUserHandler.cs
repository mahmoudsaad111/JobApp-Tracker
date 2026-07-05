using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Features.Authentication.Commands;
using JobAppTracker.Application.Features.Authentication.DTOs;
using JobAppTracker.Application.Mappers;
using JobAppTracker.Domain.Entities;
using MediatR;
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
                false
            );
            if (!result.Succeeded)
            {
                throw new UnauthorizedException("Invalid login attempt");
            }

            await _signInManager.SignInAsync(user, false);

            // get the user role
            var roles = await _usermanager.GetRolesAsync(user);

            return AuthenticationMapper.ToLoginUserDto(user, roles);
        }
    }
}
