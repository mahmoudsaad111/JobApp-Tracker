using System;
using FluentValidation;
using JobAppTracker.Application.Features.Interviews.Commands;

namespace JobAppTracker.Application.Features.Interviews.Validators
{
    public class CreateInterviewCommandValidator : AbstractValidator<CreateInterviewCommand>
    {
        public CreateInterviewCommandValidator()
        {
            RuleFor(x => x.JobAppId)
                .Cascade(FluentValidation.CascadeMode.Stop)
                .NotEmpty().WithMessage("JobAppId is required")
                .Must(IsGuid).WithMessage("JobAppId must be a valid GUID string");

            RuleFor(x => x.InterviewDate)
                .Cascade(FluentValidation.CascadeMode.Stop)
                .NotEmpty().WithMessage("Interview date is required");

            RuleFor(x => x.InterviewerName)
                .MaximumLength(100).When(x => !string.IsNullOrWhiteSpace(x.InterviewerName))
                .WithMessage("Interviewer name is too long (max 100 chars)");

            RuleFor(x => x.Note)
                .MaximumLength(2000).WithMessage("Note is too long (max 2000 chars)");

            RuleFor(x => x.Feedback)
                .MaximumLength(2000).WithMessage("Feedback is too long (max 2000 chars)");
        }

        private static bool IsGuid(string id)
        {
            return Guid.TryParse(id, out _);
        }
    }
}
