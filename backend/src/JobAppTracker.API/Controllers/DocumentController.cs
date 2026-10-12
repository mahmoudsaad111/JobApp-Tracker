using System.Security.Claims;
using JobAppTracker.Application.Common.Responses;
using JobAppTracker.Application.Features.Documents.Commands;
using JobAppTracker.Application.Features.Documents.Dtos;
using JobAppTracker.Application.Features.Documents.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobAppTracker.API.Controllers
{
    [ApiController]
    [Route("api/Document")]
    [Authorize]
    public class DocumentsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public DocumentsController(IMediator mediator) => _mediator = mediator;

        // ── GET /api/documents ────────────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetUserDocuments()
        {
            var docs = await _mediator.Send(new GetUserDocumentsQuery());
            return Ok(
                ApiResponse<GetUserDocumentsDto>.SuccessResult(
                    docs,
                    "Documents retrieved successfully."
                )
            );
        }

        // ── POST /api/documents ───────────────────────────────────────────────
        [HttpPost]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> UploadDocument(
            [FromForm] IFormFile file,
            [FromForm] string type = "Other"
        )
        {
            var document = await _mediator.Send(
                new UploadDocumentCommand
                {
                    File = file, // ← pass the whole file
                    Type = type,
                }
            );
            return Ok(
                ApiResponse<UploadDocumentDto>.SuccessResult(
                    document,
                    "Document uploaded successfully."
                )
            );
        }

        // ── GET /api/document/{id}/file ───────────────────────────────────────
        // The only way to read an uploaded file: authenticated + ownership-checked.
        [HttpGet("{id:guid}/file")]
        public async Task<IActionResult> GetDocumentFile(Guid id, [FromQuery] bool download = false)
        {
            var file = await _mediator.Send(new GetDocumentFileQuery { DocumentId = id });
            Response.Headers["X-Content-Type-Options"] = "nosniff";

            if (download)
                return PhysicalFile(file.PhysicalPath, file.ContentType, file.FileName);

            Response.Headers["Content-Disposition"] =
                $"inline; filename*=UTF-8''{Uri.EscapeDataString(file.FileName)}";
            return PhysicalFile(file.PhysicalPath, file.ContentType);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(Guid id) { 
          var result = await _mediator.Send(new DeleteDocumentCommand { DocumentId = id });
          return Ok(ApiResponse<DeleteDocumentDto>.SuccessResult(
            result,
            "Document deleted successfully."
          ));
        }
    }
}
