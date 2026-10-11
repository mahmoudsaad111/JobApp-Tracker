// Api/Controllers/ResumeMatchController.cs
using JobAppTracker.Application.Common.Responses;
using JobAppTracker.Application.Features.JobMatching.Queries;
using JobAppTracker.Application.Interfaces.Services.AI;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobAppTracker.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/job-applications/{jobApplicationId}/match")]
public class ResumeMatchController : ControllerBase
{
    private readonly IMediator _mediator;

    public ResumeMatchController(IMediator mediator) => _mediator = mediator;

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ResumeMatchResult>>> Match(
        Guid jobApplicationId, [FromBody] MatchResumeRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new MatchResumeQuery(jobApplicationId, request.DocumentId), ct);
        return Ok(ApiResponse<ResumeMatchResult>.SuccessResult(result, "Resume matched successfully"));
    }
}

public record MatchResumeRequest(Guid DocumentId);