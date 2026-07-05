using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Common.Interfaces;
using JobAppTracker.Application.Features.Documents.Commands;
using JobAppTracker.Application.Features.Documents.Dtos;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Application.Interfaces.Services;
using JobAppTracker.Application.Mappers;
using JobAppTracker.Domain.Entities;
using JobAppTracker.Domain.Enums;
using MediatR;
using Microsoft.VisualBasic;

namespace JobAppTracker.Application.Features.Documents.Handlers
{
    public class UploadDocumentHandler : IRequestHandler<UploadDocumentCommand, UploadDocumentDto>
    {
        private readonly IDocumentRepository _documentRepository;
        private readonly ICurrentUserService _currentUserService;
        private readonly IFileStorageService _fileStorageService;

        public UploadDocumentHandler(
            IDocumentRepository documentRepository,
            ICurrentUserService currentUserService,
            IFileStorageService fileStorageService
        )
        {
            _documentRepository = documentRepository;
            _currentUserService = currentUserService;
            _fileStorageService = fileStorageService;
        }

        public async Task<UploadDocumentDto> Handle(
            UploadDocumentCommand request,
            CancellationToken cancellationToken
        )
        {
            var userId = _currentUserService.UserId;

            // Save to disk → returns "/uploads/documents/{guid}.pdf"
            var filePath = await _fileStorageService.SaveAsync(request.File, "documents");

            var ext = Path.GetExtension(request.File.FileName).ToLower();
            var docType = Enum.TryParse<DocumentType>(
                request.Type,
                ignoreCase: true,
                out var parsed
            )
                ? parsed
                : DocumentType.Other;
            var contentTypeEnum = ext switch
            {
                ".pdf" => ContentType.PDF,
                ".doc" => ContentType.Word,
                ".docx" => ContentType.Word,
                _ => ContentType.Other,
            };

            var document = Document.Create(
                fileName: request.File.FileName, // original name e.g. "MyCV.pdf"
                filePath: filePath, // "/uploads/documents/{guid}.pdf"
                fileSize: request.File.Length,
                type: docType,
                contentType: contentTypeEnum,
                userId: userId
            );

            await _documentRepository.AddAsync(document);
            await _documentRepository.SaveChangesAsync();

            return DocumentsMapper.ToUploadDocumentDto(document, userId);
        }
    }
}
