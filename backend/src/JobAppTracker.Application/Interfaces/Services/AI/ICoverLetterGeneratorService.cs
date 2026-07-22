using JobAppTracker.Domain.ValueObjects;

namespace JobAppTracker.Application.Interfaces.Services.AI;
public interface ICoverLetterGeneratorService
{
    Task<string> GenerateAsync(CoverLetterRequest request, CancellationToken ct = default);
}