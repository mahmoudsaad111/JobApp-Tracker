// Api/Controllers/CoverLetterController.cs
using JobAppTracker.Application.Common.Responses;
using JobAppTracker.Application.Features.AI.CoverLetterGeneration.DTOs;
using JobAppTracker.Application.Features.CoverLetterGeneration.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobAppTracker.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/job-applications/{jobApplicationId}/cover-letter")]
public class CoverLetterController : ControllerBase
{
    private readonly IMediator _mediator;

    public CoverLetterController(IMediator mediator) => _mediator = mediator;

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CoverLetterDto>>> Generate(
        Guid jobApplicationId, [FromBody] GenerateCoverLetterRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new GenerateCoverLetterQuery(jobApplicationId, request.DocumentId, request.Tone), ct);
        return Ok(ApiResponse<CoverLetterDto>.SuccessResult(result, "Cover letter generated successfully"));
    }
}

public record GenerateCoverLetterRequest(Guid DocumentId, string? Tone);