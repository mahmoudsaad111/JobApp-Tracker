using JobAppTracker.Application.Features.Documents.Dtos;
using MediatR;

namespace JobAppTracker.Application.Features.Documents.Queries
{
    public class GetDocumentFileQuery : IRequest<DocumentFileDto>
    {
        public Guid DocumentId { get; set; }
    }
}
