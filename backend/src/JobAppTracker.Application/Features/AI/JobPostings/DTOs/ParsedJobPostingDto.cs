// Application/DTOs/ParsedJobPostingDto.cs
namespace JobAppTracker.Application.DTOs;

public record ParsedJobPostingDto(
    string? CompanyName,
    string? JobTitle,
    string? Location,
    string? JobType,
    string? SalaryRange,
    List<string> RequiredSkills
);