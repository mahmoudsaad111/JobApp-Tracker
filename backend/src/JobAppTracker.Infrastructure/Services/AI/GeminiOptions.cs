namespace JobAppTracker.Infrastructure.Services.AI;

public class GeminiOptions
{
    public const string SectionName = "Gemini";

    public string ApiKey { get; set; } = string.Empty;
    public string? Model { get; set; } 
    public string? BaseUrl { get; set; } 
}