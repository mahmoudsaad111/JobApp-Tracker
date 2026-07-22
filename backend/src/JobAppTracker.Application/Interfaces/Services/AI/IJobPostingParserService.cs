using JobAppTracker.Domain.ValueObjects;

namespace JobAppTracker.Application.Interfaces.Services.AI;

public interface IJobPostingParserService
{
    Task<ParsedJobPosting> ParseAsync(string rawText, CancellationToken ct = default);
}