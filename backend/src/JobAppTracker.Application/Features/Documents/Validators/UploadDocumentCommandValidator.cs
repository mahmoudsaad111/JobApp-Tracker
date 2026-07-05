using System.IO;
using FluentValidation;
using JobAppTracker.Application.Features.Documents.Commands;

namespace JobAppTracker.Application.Features.Documents.Validators
{
    public class UploadDocumentCommandValidator : AbstractValidator<UploadDocumentCommand>
    {
        private static readonly string[] AllowedExtensions = new[] { ".pdf", ".docx", ".doc", ".txt", ".png", ".jpg", ".jpeg" };

        public UploadDocumentCommandValidator()
        {
            RuleFor(x => x.File)
                .NotNull().WithMessage("File is required")
                .Must(f => f.Length > 0).WithMessage("File must not be empty");

            RuleFor(x => x.File.FileName)
                .Must(fn => fn != null && AllowedExtensions.Contains(Path.GetExtension(fn).ToLower()))
                .WithMessage($"File type not allowed. Allowed: {string.Join(',', AllowedExtensions)}");

            RuleFor(x => x.Type).NotEmpty().WithMessage("Document type is required");
        }
    }
}
