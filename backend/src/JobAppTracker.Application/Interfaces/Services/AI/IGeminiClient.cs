namespace JobAppTracker.Application.Interfaces.Services.AI;

public interface IGeminiClient
{
    /// <summary>Plain text generation — no system instruction, no forced JSON output.</summary>
    Task<string> GenerateTextAsync(string prompt, CancellationToken ct = default);

    /// <summary>JSON-mode generation, with an optional system instruction, for structured extraction.</summary>
    Task<string> GenerateJsonAsync(string prompt, string? systemInstruction = null, CancellationToken ct = default);
}