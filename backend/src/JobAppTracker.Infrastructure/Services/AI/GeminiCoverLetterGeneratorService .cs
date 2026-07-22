// Infrastructure/Services/AI/GeminiCoverLetterGeneratorService.cs
using JobAppTracker.Application.Interfaces.Services.AI;
using JobAppTracker.Domain.ValueObjects;

namespace JobAppTracker.Infrastructure.Services.AI;

public class GeminiCoverLetterGeneratorService : ICoverLetterGeneratorService
{
    private readonly IGeminiClient _geminiClient;

    public GeminiCoverLetterGeneratorService(IGeminiClient geminiClient)
    {
        _geminiClient = geminiClient;
    }

    public async Task<string> GenerateAsync(CoverLetterRequest request, CancellationToken ct = default)
    {
        var tone = string.IsNullOrWhiteSpace(request.Tone) ? "professional" : request.Tone;

        var prompt = $"""
            Write a {tone} cover letter for this job application.

            Job Title: {request.JobTitle}
            Company: {request.CompanyName}
            Job Description: {request.JobDescription ?? "Not provided"}
            Required Skills: {string.Join(", ", request.RequiredSkills)}

            Candidate's Resume:
            {request.ResumeText}

            Rules:
            - 3-4 paragraphs, no more than 350 words
            - Reference specific skills/experience from the resume that match the job's requirements
            - Do not invent experience not present in the resume
            - No placeholder brackets like [Your Name] — write it ready to send, addressed generically ("Dear Hiring Manager")
            - Return plain text only, no markdown formatting
            """;

        var text = await _geminiClient.GenerateTextAsync(prompt, ct);
        return text.Trim();
    }
}