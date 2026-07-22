using System.Text.Json;
using JobAppTracker.Application.Interfaces.Services.AI;

namespace JobAppTracker.Infrastructure.Services.AI;

public class GeminiResumeMatchService : IResumeMatchService
{
    private readonly IGeminiClient _geminiClient;

    public GeminiResumeMatchService(IGeminiClient geminiClient) => _geminiClient = geminiClient;

    public async Task<ResumeMatchResult> MatchAsync(IReadOnlyCollection<string> requiredSkills, 
    string resumeText, CancellationToken ct = default)
    {
        var prompt = $$"""
                  Required skills for this job: {{string.Join(", ", requiredSkills)}}

                Candidate's resume:
                {{resumeText}}

                       Compare the resume against the required skills. Treat naming variations as equivalent
                     (e.g. "Node.js" matches "NodeJS", "SQL Server" matches "SQL", "React" matches "ReactJS").
                         Return ONLY JSON in this exact shape:
                {
                  "matchedSkills": string[],
                   "missingSkills": string[],
                   "matchPercentage": number
                      }
               """;

        var raw = await _geminiClient.GenerateJsonAsync(prompt);
        var result = JsonSerializer.Deserialize<ResumeMatchResult>(raw, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        return result ?? throw new InvalidOperationException("Failed to parse Gemini match response");
    }

}