using FluentValidation;
using JobAppTracker.Application.Features.Notes.Commands;

namespace JobAppTracker.Application.Features.Notes.Validators
{
    public class UpdateNoteCommandValidator : AbstractValidator<UpdateNoteCommand>
    {
        public UpdateNoteCommandValidator()
        {
            RuleFor(x => x.NoteId).NotEmpty().WithMessage("NoteId is required");

            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("Note content is required")
                .MaximumLength(2000).WithMessage("Note is too long (max 2000 chars)");
        }
    }
}
