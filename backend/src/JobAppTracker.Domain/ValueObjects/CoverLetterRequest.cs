namespace JobAppTracker.Domain.ValueObjects; 
public record CoverLetterRequest(
    string CompanyName,
    string JobTitle,
    string? JobDescription,
    IReadOnlyCollection<string> RequiredSkills,
    string ResumeText,
    string? Tone = null   
);