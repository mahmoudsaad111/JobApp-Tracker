using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Features.Documents.Dtos;
using JobAppTracker.Application.Features.Documents.Queries;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Application.Interfaces.Services;
using MediatR;

namespace JobAppTracker.Application.Features.Documents.Handlers
{
    public class GetDocumentTextHandler : IRequestHandler<GetDocumentTextQuery, DocumentTextDto>
    {
        // Keeps the response small enough for an AI model's context window.
        private const int MaxCharacters = 20_000;

        private readonly IDocumentRepository _documentRepository;
        private readonly IDocumentTextExtractorService _textExtractor;

        public GetDocumentTextHandler(
            IDocumentRepository documentRepository,
            IDocumentTextExtractorService textExtractor
        )
        {
            _documentRepository = documentRepository;
            _textExtractor = textExtractor;
        }

        public async Task<DocumentTextDto> Handle(
            GetDocumentTextQuery request,
            CancellationToken cancellationToken
        )
        {
            // The ownership query filter makes this return null for other users' documents.
            var document = await _documentRepository.GetByIdAsync(request.DocumentId);
            if (document is null)
                throw new NotFoundException("Document Not Found");

            var text = await _textExtractor.ExtractTextAsync(document.FilePath, cancellationToken);
            var isTruncated = text.Length > MaxCharacters;

            return new DocumentTextDto
            {
                FileName = document.FileName,
                Text = isTruncated ? text[..MaxCharacters] : text,
                IsTruncated = isTruncated,
            };
        }
    }
}
