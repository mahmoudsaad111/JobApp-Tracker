using FluentValidation;
using JobAppTracker.Application.Features.Authentication.Commands;

namespace JobAppTracker.Application.Features.Authentication.Validators
{
    public class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
    {
        public ResetPasswordCommandValidator()
        {
            RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid email is required");
            RuleFor(x => x.Token).NotEmpty().WithMessage("This link is invalid or has expired.");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters")
                .Matches("^(?=.*[A-Za-z])(?=.*\\d).+$").WithMessage("Password must contain letters and numbers");
        }
    }

    public class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
    {
        public ChangePasswordCommandValidator()
        {
            RuleFor(x => x.CurrentPassword).NotEmpty().WithMessage("Current password is required");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("New password is required")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters")
                .Matches("^(?=.*[A-Za-z])(?=.*\\d).+$").WithMessage("Password must contain letters and numbers");
        }
    }
}
