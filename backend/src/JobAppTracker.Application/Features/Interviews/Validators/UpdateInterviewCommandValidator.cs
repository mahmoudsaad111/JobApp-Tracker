using System;
using FluentValidation;
using JobAppTracker.Application.Features.Interviews.Commands;

namespace JobAppTracker.Application.Features.Interviews.Validators
{
    public class UpdateInterviewCommandValidator : AbstractValidator<UpdateInterviewCommand>
    {
        public UpdateInterviewCommandValidator()
        {
            RuleFor(x => x.InterviewId)
                .NotEmpty().WithMessage("InterviewId is required");

            RuleFor(x => x.JobAppId)
                .Must(id => id == null || id != Guid.Empty).WithMessage("JobAppId, when provided, must be a valid GUID");

            RuleFor(x => x.InterviewDate)
                .GreaterThanOrEqualTo(DateTime.Today).WithMessage("Interview date must be today or in the future");

            RuleFor(x => x.InterviewerName)
                .MaximumLength(200).When(x => !string.IsNullOrWhiteSpace(x.InterviewerName))
                .WithMessage("Interviewer name is too long (max 200 chars)");

            RuleFor(x => x.Note)
                .MaximumLength(2000).When(x => !string.IsNullOrWhiteSpace(x.Note))
                .WithMessage("Note is too long (max 2000 chars)");

            RuleFor(x => x.Feedback)
                .MaximumLength(2000).When(x => !string.IsNullOrWhiteSpace(x.Feedback))
                .WithMessage("Feedback is too long (max 2000 chars)");
        }
    }
}
