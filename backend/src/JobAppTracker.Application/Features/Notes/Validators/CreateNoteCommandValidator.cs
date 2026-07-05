using FluentValidation;
using JobAppTracker.Application.Features.Notes.Commands;

namespace JobAppTracker.Application.Features.Notes.Validators
{
    public class CreateNoteCommandValidator : AbstractValidator<CreateNoteCommand>
    {
        public CreateNoteCommandValidator()
        {
            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("Note content is required")
                .MaximumLength(2000).WithMessage("Note is too long (max 2000 chars)");

            RuleFor(x => x.JobAppId)
                .Must(id => id == null || id != Guid.Empty).WithMessage("JobAppId, when provided, must be a valid GUID");
        }
    }
}
