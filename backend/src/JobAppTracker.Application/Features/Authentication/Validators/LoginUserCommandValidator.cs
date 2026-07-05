using FluentValidation;
using JobAppTracker.Application.Features.Authentication.Commands;

namespace JobAppTracker.Application.Features.Authentication.Validators
{
    public class LoginUserCommandValidator : AbstractValidator<LoginUserCommand>
    {
        public LoginUserCommandValidator()
        {
            RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid email is required");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters")
                .Matches("^(?=.*[A-Za-z])(?=.*\\d).+$").WithMessage("Password must contain letters and numbers");
        }
    }
}
