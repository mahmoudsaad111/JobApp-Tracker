using JobAppTracker.Application.Common.Responses;
using JobAppTracker.Application.Features.Authentication.Commands;
using JobAppTracker.Application.Features.Authentication.DTOs;
using JobAppTracker.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace JobAppTracker.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    [EnableRateLimiting("auth")]         

    public class AuthController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly SignInManager<User> _signInManager;
        private readonly UserManager<User> _userManager;

        public AuthController(
            IMediator mediator,
            SignInManager<User> signInManager,
            UserManager<User> userManager
        )
        {
            _mediator = mediator;
            _signInManager = signInManager;
            _userManager = userManager;
        }


        [HttpPost("Register")]
        [EnableRateLimiting("email")]
        public async Task<IActionResult> Register(RegisterUserCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(ApiResponse<object>.SuccessResult(result.Email, "Registration successful"));
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login(LoginUserCommand command)
        {
            var result = await _mediator.Send(command);

            return Ok(ApiResponse<LoginUserDto>.SuccessResult(result, "Login successful"));
        }

        [HttpGet("VerifyEmail")]
        public async Task<IActionResult> VerifyEmail([FromQuery] VerifyEmailCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(ApiResponse<object>.SuccessResult(result, "Email verification successful"));
        }

        [Authorize]
        [HttpPost("ChangePassword")]
        public async Task<IActionResult> ChangePassword(ChangePasswordCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(ApiResponse<object>.SuccessResult(result, "Password changed successfully"));
        }


        [HttpPost("ResetPassword")]
        public async Task<IActionResult> ResetPassword(ResetPasswordCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(ApiResponse<object>.SuccessResult(result, "Password reset successfully"));
        }

        [HttpPost("ResendConfirmationEmail")]
        [EnableRateLimiting("email")]
        public async Task<IActionResult> ResendConfirmationEmail(
            ResendConfirmationEmailCommand command
        )
        {
            var result = await _mediator.Send(command);
            return Ok(ApiResponse<object>.SuccessResult(result, "Confirmation email sent"));
        }

        [HttpPost("ForgotPassword")]
        [EnableRateLimiting("email")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(ApiResponse<object>.SuccessResult(result, "Password reset email sent"));
        }

        [Authorize]
        [HttpPost("Logout")]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok(ApiResponse<object>.SuccessResult(null, "Logout successful"));
        }
    }
}
