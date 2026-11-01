using System.ComponentModel;
using JobAppTracker.Application.Common.Responses;
using JobAppTracker.Application.Features.JobApp.Commands;
using JobAppTracker.Application.Features.JobApp.Dtos;
using JobAppTracker.Application.Features.JobApp.Queries;
using JobAppTracker.Domain.Enums;
using MediatR;
using ModelContextProtocol.Server;

namespace JobAppTracker.Mcp.Tools;

// Tools for the user's job applications. Job descriptions are untrusted text (prompt-injection risk).
[McpServerToolType]
public class ApplicationTools(IMediator mediator)
{
    [McpServerTool(Name = "list_applications", ReadOnly = true)]
    [Description(
        "Lists the current user's job applications. Supports text search on company name and job title, " +
        "filters by status and work mode, and returns a page sorted newest first."
    )]
    public async Task<ApiResponse<List<GetJobAppForUserDto>>> ListApplications(
        [Description("Optional text to match against company name or job title.")] string? search = null,
        [Description("Optional status filter: Draft, Submitted, UnderReview, InterviewScheduled, Interviewed, Accepted, Rejected, or Withdrawn.")]
            JobAppStatus? status = null,
        [Description("Optional work mode filter: Onsite, Remote, or Hybrid.")] WorkMode? workMode = null,
        [Description("Page number, starting at 1.")] int page = 1,
        [Description("Results per page, from 1 to 50.")] int pageSize = 10,
        CancellationToken cancellationToken = default
    )
    {
        var query = new GetJobAppsForUserQuery
        {
            Search = search ?? string.Empty,
            Status = status,
            WorkMode = workMode,
            Page = Math.Max(page, 1),
            PageSize = Math.Clamp(pageSize, 1, 50),
        };

        return await mediator.SendForMcpAsync(query, cancellationToken);
    }

    [McpServerTool(Name = "get_application", ReadOnly = true)]
    [Description("Gets one of the current user's job applications, including its interviews, notes, and documents.")]
    public Task<GetJobAppByIdDto> GetApplication(
        [Description("The application ID (GUID), obtained from list_applications.")] Guid id,
        CancellationToken cancellationToken = default
    ) =>
        mediator.SendForMcpAsync(new GetJobAppByIdQuery { JobAppId = id }, cancellationToken);

    [McpServerTool(Name = "create_application", ReadOnly = false)]
    [Description("Creates a job application for the current user.")]
    public Task<CreateJobAppDto> CreateApplication(
        [Description("Employer name.")] string companyName,
        [Description("Role or job title.")] string title,
        [Description("Date applied. Defaults to the current local date and time.")] DateTime? applicationDate = null,
        [Description("Job type, such as FullTime, PartTime, Contract, Internship, Freelance, or Temporary.")] JobType? type = null,
        [Description("Job location.")] string? location = null,
        [Description("Job posting URL.")] string? link = null,
        [Description("Application status. Defaults to Draft.")] JobAppStatus status = JobAppStatus.Draft,
        [Description("Job description.")] string description = "",
        [Description("Work mode: Onsite, Remote, or Hybrid.")] WorkMode? workMode = null,
        [Description("Required skills for the role.")] List<string>? requiredSkills = null,
        CancellationToken cancellationToken = default
    )
    {
        var command = new CreateJobAppCommand
        {
            CompanyName = companyName,
            Title = title,
            ApplicationDate = applicationDate ?? DateTime.Now,
            Type = type,
            Location = location,
            Link = link,
            Status = status,
            Description = description,
            WorkMode = workMode,
            RequiredSkills = requiredSkills ?? [],
        };

        return mediator.SendForMcpAsync(command, cancellationToken);
    }

    [McpServerTool(Name = "update_application", ReadOnly = false, Idempotent = true)]
    [Description(
        "Replaces ALL details of one of the current user's job applications. Call get_application first " +
        "and pass the existing values for every field you are not changing, otherwise they are overwritten. " +
        "To change only the status, use update_application_status."
    )]
    public Task<UpdateJobAppDto> UpdateApplication(
        [Description("The application ID (GUID).")] Guid id,
        [Description("Employer name.")] string companyName,
        [Description("Role or job title.")] string title,
        [Description("Job location.")] string? location,
        [Description("Job posting URL.")] string? jobLink,
        [Description("Application date.")] DateTime? applicationDate,
        [Description("Current application status.")] JobAppStatus status,
        [Description("Job description.")] string? description,
        [Description("Job type.")] JobType type,
        [Description("Work mode.")] WorkMode workMode,
        [Description("Required skills.")] List<string>? requiredSkills,
        CancellationToken cancellationToken = default
    )
    {
        var command = new UpdateJobAppCommand
        {
            JobAppId = id,
            CompanyName = companyName,
            Title = title,
            Location = location,
            JobLink = jobLink,
            ApplicationDate = applicationDate,
            Status = status,
            Description = description,
            Type = type,
            WorkMode = workMode,
            RequiredSkills = requiredSkills,
        };

        return mediator.SendForMcpAsync(command, cancellationToken);
    }

    [McpServerTool(Name = "update_application_status", ReadOnly = false, Idempotent = true)]
    [Description("Changes the status of one of the current user's job applications.")]
    public Task<UpdateJobAppStatusDto> UpdateApplicationStatus(
        [Description("The application ID (GUID).")] Guid id,
        [Description("New status: Draft, Submitted, UnderReview, InterviewScheduled, Interviewed, Accepted, Rejected, or Withdrawn.")]
            JobAppStatus newStatus,
        CancellationToken cancellationToken = default
    ) =>
        mediator.SendForMcpAsync(
            new UpdateJobAppStatusCommand { JobAppId = id, Status = newStatus },
            cancellationToken
        );

    // delete_application is intentionally not exposed: it removes the application and everything linked to it,
    // and a prompt-injected job description could trick a model into calling it. Delete in the app instead.
}
