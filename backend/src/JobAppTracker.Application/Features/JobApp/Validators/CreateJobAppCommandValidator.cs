using FluentValidation;
using JobAppTracker.Application.Features.JobApp.Commands;

namespace JobAppTracker.Application.Features.JobApp.Validators
{
    public class CreateJobAppCommandValidator : AbstractValidator<CreateJobAppCommand>
    {
        public CreateJobAppCommandValidator()
        {
            RuleFor(x => x.CompanyName)
                .NotEmpty().WithMessage("Company name is required")
                .MaximumLength(200).WithMessage("Company name is too long (max 200 chars)");

            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Title is required")
                .MaximumLength(200).WithMessage("Title is too long (max 200 chars)");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description is too long (max 1000 chars)");
        }
    }
}
