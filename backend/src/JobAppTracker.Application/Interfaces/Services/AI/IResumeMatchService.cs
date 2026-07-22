
namespace JobAppTracker.Application.Interfaces.Services.AI; 
public interface IResumeMatchService
{
     Task<ResumeMatchResult> MatchAsync(IReadOnlyCollection<string> requiredSkills, string resumeText, CancellationToken ct = default);
}
public record ResumeMatchResult(
    List<string> MatchedSkills,
    List<string> MissingSkills,
    int MatchPercentage
);
