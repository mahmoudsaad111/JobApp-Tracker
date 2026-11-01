using System.ComponentModel;
using JobAppTracker.Application.DTOs;
using JobAppTracker.Application.Features.AI.CoverLetterGeneration.DTOs;
using JobAppTracker.Application.Features.CoverLetterGeneration.Queries;
using JobAppTracker.Application.Features.JobMatching.Queries;
using JobAppTracker.Application.Features.JobPostingParsing.Queries;
using JobAppTracker.Application.Interfaces.Services.AI;
using MediatR;
using ModelContextProtocol.Server;

namespace JobAppTracker.Mcp.Tools;

// AI-powered tools. They do not change data, but they send text to Gemini (external, costs quota),
// so they are marked OpenWorld = true.
[McpServerToolType]
public class AiTools(IMediator mediator)
{
    [McpServerTool(Name = "parse_job_posting", ReadOnly = true, OpenWorld = true)]
    [Description("Extracts structured role, company, location, and skill details from job posting text.")]
    public Task<ParsedJobPostingDto> ParseJobPosting(
        [Description("The full text of the job posting.")] string rawText,
        CancellationToken cancellationToken = default
    ) =>
        mediator.SendForMcpAsync(new ParseJobPostingQuery(rawText), cancellationToken);

    [McpServerTool(Name = "match_resume_to_application", ReadOnly = true, OpenWorld = true)]
    [Description(
        "Compares a resume document with a job application. Use list_documents and list_applications " +
        "to find the required IDs."
    )]
    public Task<ResumeMatchResult> MatchResumeToApplication(
        [Description("The job application ID (GUID).")] Guid applicationId,
        [Description("The resume document ID (GUID).")] Guid documentId,
        CancellationToken cancellationToken = default
    ) =>
        mediator.SendForMcpAsync(
            new MatchResumeQuery(applicationId, documentId),
            cancellationToken
        );

    [McpServerTool(Name = "generate_cover_letter", ReadOnly = true, OpenWorld = true)]
    [Description(
        "Generates a cover letter using a job application and resume document. " +
        "Use list_applications and list_documents to find the required IDs."
    )]
    public Task<CoverLetterDto> GenerateCoverLetter(
        [Description("The job application ID (GUID).")] Guid applicationId,
        [Description("The resume document ID (GUID).")] Guid documentId,
        [Description("Optional tone, such as professional, confident, or conversational.")]
            string? tone = null,
        CancellationToken cancellationToken = default
    ) =>
        mediator.SendForMcpAsync(
            new GenerateCoverLetterQuery(applicationId, documentId, tone),
            cancellationToken
        );
}
