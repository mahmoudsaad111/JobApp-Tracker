using FluentValidation;
using JobAppTracker.Application.Features.Authentication.Commands;

namespace JobAppTracker.Application.Features.Authentication.Validators
{
    public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
    {
        public RegisterUserCommandValidator()
        {
            RuleFor(x => x.UserName)
                .NotEmpty().WithMessage("Username is required")
                .MaximumLength(100).WithMessage("Username is too long (max 100 chars)");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters")
                .Matches("^(?=.*[A-Za-z])(?=.*\\d).+$").WithMessage("Password must contain letters and numbers");

            RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid email is required");

            RuleFor(x => x.FirstName).NotEmpty().WithMessage("First name is required").MaximumLength(100);
            RuleFor(x => x.LastName).NotEmpty().WithMessage("Last name is required").MaximumLength(100);
        }
    }
}
