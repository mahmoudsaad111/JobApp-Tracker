using System.Collections.Generic;
using JobAppTracker.Application.Features.Authentication.DTOs;
using JobAppTracker.Domain.Entities;

namespace JobAppTracker.Application.Mappers
{
    public static class AuthenticationMapper
    {
        public static LoginUserDto ToLoginUserDto(User user, IEnumerable<string> roles)
        {
            var role = roles?.FirstOrDefault();
            return new LoginUserDto
            {
                IsSuccess = true,
                Email = user.Email,
                UserId = user.Id,
                Role = role,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Message = "Login Successful",
            };
        }

        public static RegisterResultDto ToRegisterResultDto(User user)
        {
            return new RegisterResultDto
            {
                Email = user.Email,
            };
        }
    }
}
