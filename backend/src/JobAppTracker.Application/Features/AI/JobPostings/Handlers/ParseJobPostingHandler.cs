// Application/Commands/ParseJobPosting/ParseJobPostingHandler.cs
using JobAppTracker.Application.DTOs;
using JobAppTracker.Application.Features.JobPostingParsing.Queries;
using JobAppTracker.Application.Interfaces.Services.AI;
using JobAppTracker.Domain.Common.Exceptions;
using MediatR;

namespace JobAppTracker.Application.Commands.ParseJobPosting;

public class ParseJobPostingHandler : IRequestHandler<ParseJobPostingQuery, ParsedJobPostingDto>
{
    private readonly IJobPostingParserService _parser;

    public ParseJobPostingHandler(IJobPostingParserService parser)
        => _parser = parser;

    public async Task<ParsedJobPostingDto> Handle(ParseJobPostingQuery request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.RawText))
            throw new DomainException("Job posting text cannot be empty.");

        var parsed = await _parser.ParseAsync(request.RawText, ct);

        return new ParsedJobPostingDto(
            parsed.CompanyName,
            parsed.JobTitle,
            parsed.Location,
            parsed.JobType,
            parsed.SalaryRange,
            parsed.RequiredSkills
        );
    }
}