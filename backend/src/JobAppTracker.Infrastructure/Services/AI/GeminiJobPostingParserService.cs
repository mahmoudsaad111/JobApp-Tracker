// Infrastructure/Services/AI/GeminiJobPostingParserService.cs
using System.Text.Json;
using JobAppTracker.Application.Interfaces.Services.AI;
using JobAppTracker.Domain.ValueObjects;

namespace JobAppTracker.Infrastructure.Services.AI;

public class GeminiJobPostingParserService : IJobPostingParserService
{
    private readonly IGeminiClient _geminiClient;

    public GeminiJobPostingParserService(IGeminiClient geminiClient)
    {
        _geminiClient = geminiClient;
    }

    public async Task<ParsedJobPosting> ParseAsync(string rawText, CancellationToken ct = default)
    {
        var jsonText = await _geminiClient.GenerateJsonAsync(rawText, SystemPrompt, ct);

        return JsonSerializer.Deserialize<ParsedJobPosting>(jsonText,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
    }

    private const string SystemPrompt = """
        You extract structured data from job postings. Return ONLY valid JSON matching:
        {"companyName": string|null, "jobTitle": string|null, "location": string|null,
         "jobType": "Remote"|"Hybrid"|"Onsite"|null, "salaryRange": string|null, "requiredSkills": string[]}
        """;
}