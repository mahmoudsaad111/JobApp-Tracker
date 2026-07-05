using System.Collections.Generic;
using System.Linq;
using JobAppTracker.Application.Features.Documents.Dtos;
using JobAppTracker.Domain.Entities;

namespace JobAppTracker.Application.Mappers
{
    public static class DocumentsMapper
    {
        public static GetDocumentDto ToGetDocumentDto(Document document)
        {
            return new GetDocumentDto
            {
                Id = document.Id,
                FileName = document.FileName,
                FilePath = document.FilePath,
                FileSize = document.FileSize,
                ContentType = document.ContentType,
                Type = document.Type,
                CreatedAt = document.CreatedAt,
            };
        }

        public static GetUserDocumentsDto ToGetUserDocumentsDto(IEnumerable<Document> documents)
        {
            return new GetUserDocumentsDto
            {
                Documents = documents.Select(ToGetDocumentDto).ToList(),
            };
        }

        public static UploadDocumentDto ToUploadDocumentDto(Document document, Guid userId)
        {
            return new UploadDocumentDto
            {
                UserId = userId,
                FileName = document.FileName,
                FilePath = document.FilePath,
                FileSize = document.FileSize,
                Type = document.Type.ToString(),
                ContentType = document.ContentType,
                DocumentType = document.Type,
                CreatedAt = document.CreatedAt,
            };
        }
    }
}
