using System.IO;
using FluentValidation;
using JobAppTracker.Application.Features.Documents.Commands;
using JobAppTracker.Domain.Enums;

namespace JobAppTracker.Application.Features.Documents.Validators
{
    public class UploadDocumentCommandValidator : AbstractValidator<UploadDocumentCommand>
    {
        // Must match what the file storage service accepts (it checks the real file content too).
        private static readonly string[] AllowedExtensions = new[] { ".pdf", ".docx", ".doc" };

        public UploadDocumentCommandValidator()
        {
            RuleFor(x => x.File).NotNull().WithMessage("File is required");

            // Only look inside the file when there is one (avoids a NullReferenceException -> 500).
            When(x => x.File is not null, () =>
            {
                RuleFor(x => x.File.Length)
                    .GreaterThan(0).WithMessage("File must not be empty");

                RuleFor(x => x.File.FileName)
                    .Must(fn => !string.IsNullOrWhiteSpace(fn)
                        && AllowedExtensions.Contains(Path.GetExtension(fn).ToLowerInvariant()))
                    .WithMessage($"File type not allowed. Allowed: {string.Join(", ", AllowedExtensions)}");
            });

            RuleFor(x => x.Type)
                .NotEmpty().WithMessage("Document type is required")
                .Must(t => Enum.TryParse<DocumentType>(t, ignoreCase: true, out _))
                .WithMessage("Unknown document type");
        }
    }
}
