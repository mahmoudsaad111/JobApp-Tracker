namespace JobAppTracker.Domain.ValueObjects;
public record ParsedJobPosting(
    string? CompanyName, string? JobTitle, string? Location,
    string? JobType, string? SalaryRange, List<string> RequiredSkills
);