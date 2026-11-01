using JobAppTracker.Application.Features.Documents.Dtos;
using MediatR;

namespace JobAppTracker.Application.Features.Documents.Queries
{
    public class GetDocumentTextQuery : IRequest<DocumentTextDto>
    {
        public Guid DocumentId { get; set; }
    }
}
