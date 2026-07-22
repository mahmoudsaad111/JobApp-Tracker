// Api/Controllers/JobPostingParserController.cs
using JobAppTracker.Application.Common.Responses;
using JobAppTracker.Application.DTOs;
using JobAppTracker.Application.Features.JobPostingParsing.Queries;
using JobAppTracker.Domain.ValueObjects;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace JobAppTracker.Api.Controllers;

[ApiController]
[Route("api/job-postings/parse")]
public class JobPostingParserController : ControllerBase
{
    private readonly IMediator _mediator;

    public JobPostingParserController(IMediator mediator) => _mediator = mediator;

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ParsedJobPostingDto>>> Parse(
        [FromBody] ParseJobPostingRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new ParseJobPostingQuery(request.RawText), ct);
        return Ok(ApiResponse<ParsedJobPostingDto>.SuccessResult(result, "Job posting parsed successfully"));
    }
}

public record ParseJobPostingRequest(string RawText);