using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Features.Documents.Dtos;
using JobAppTracker.Application.Features.Documents.Queries;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Application.Interfaces.Services;
using MediatR;

namespace JobAppTracker.Application.Features.Documents.Handlers
{
    public class GetDocumentFileHandler : IRequestHandler<GetDocumentFileQuery, DocumentFileDto>
    {
        private readonly IDocumentRepository _documentRepository;
        private readonly IFileStorageService _fileStorageService;

        public GetDocumentFileHandler(
            IDocumentRepository documentRepository,
            IFileStorageService fileStorageService
        )
        {
            _documentRepository = documentRepository;
            _fileStorageService = fileStorageService;
        }

        public async Task<DocumentFileDto> Handle(
            GetDocumentFileQuery request,
            CancellationToken cancellationToken
        )
        {
            // The ownership query filter makes this return null for other users' documents.
            var document = await _documentRepository.GetByIdAsync(request.DocumentId);
            if (document is null)
                throw new NotFoundException("Document Not Found");

            var physicalPath = _fileStorageService.GetPhysicalPath(document.FilePath);
            if (!File.Exists(physicalPath))
                throw new NotFoundException("Document file not found");

            var contentType = Path.GetExtension(physicalPath).ToLowerInvariant() switch
            {
                ".pdf" => "application/pdf",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".doc" => "application/msword",
                _ => "application/octet-stream",
            };

            return new DocumentFileDto
            {
                PhysicalPath = physicalPath,
                FileName = document.FileName,
                ContentType = contentType,
            };
        }
    }
}
