using System.ComponentModel;
using JobAppTracker.Application.Features.Interviews.Commands;
using JobAppTracker.Application.Features.Interviews.Dtos;
using JobAppTracker.Application.Features.Interviews.Queries;
using JobAppTracker.Domain.Enums;
using MediatR;
using ModelContextProtocol.Server;

namespace JobAppTracker.Mcp.Tools;

// Tools for interacting with the user's interviews.
[McpServerToolType]
public class InterviewTools(IMediator mediator)
{
    [McpServerTool(Name = "list_interviews", ReadOnly = true)]
    [Description("Lists the current user's job interviews, soonest first (up to 50).")]
    public async Task<ListResult<GetAllInterviewsDto>> ListInterviews(
        CancellationToken cancellationToken = default)
    {
        var result = await mediator.SendForMcpAsync(new GetAllInterviewsQuery(), cancellationToken);
        return ListResult<GetAllInterviewsDto>.From(result.OrderBy(i => i.InterviewDate));
    }

    [McpServerTool(Name = "get_interview", ReadOnly = true)]
    [Description("Gets one of the current user's interviews by ID.")]
    public Task<GetInterviewDto> GetInterview(
        [Description("The interview ID (GUID).")] Guid id,
        CancellationToken cancellationToken = default
    ) =>
        mediator.SendForMcpAsync(new GetInterviewQuery { InterviewId = id }, cancellationToken);

    [McpServerTool(Name = "create_interview", ReadOnly = false)]
    [Description("Creates an interview linked to one of the current user's job applications.")]
    public Task<CreateInterviewDto> CreateInterview(
        [Description("The related job application ID (GUID).")] Guid jobApplicationId,
        [Description("Interview date and time.")] DateTime interviewDate,
        [Description("Interview type: Phone, Video, OnSite, Technical, HRRound, or Final.")]
            InterviewType interviewType,
        [Description("Interviewer name.")] string? interviewerName = null,
        [Description("Interview notes.")] string note = "",
        [Description("Interview feedback.")] string feedback = "",
        CancellationToken cancellationToken = default
    )
    {
        var command = new CreateInterviewCommand
        {
            JobAppId = jobApplicationId.ToString(),
            InterviewDate = interviewDate,
            InterviewType = interviewType,
            InterviewerName = interviewerName,
            Note = note,
            Feedback = feedback,
        };

        return mediator.SendForMcpAsync(command, cancellationToken);
    }

    [McpServerTool(Name = "update_interview", ReadOnly = false, Idempotent = true)]
    [Description("Updates one of the current user's interviews.")]
    public Task<UpdateInterviewDto> UpdateInterview(
        [Description("The interview ID (GUID).")] Guid id,
        [Description("The related job application ID (GUID), if changing its application.")] Guid? jobApplicationId,
        [Description("Interview date and time.")] DateTime interviewDate,
        [Description("Interview type.")] InterviewType interviewType,
        [Description("Interviewer name.")] string? interviewerName,
        [Description("Interview notes.")] string? note,
        [Description("Interview feedback.")] string? feedback,
        CancellationToken cancellationToken = default
    )
    {
        var command = new UpdateInterviewCommand
        {
            InterviewId = id,
            JobAppId = jobApplicationId,
            InterviewDate = interviewDate,
            InterviewType = interviewType,
            InterviewerName = interviewerName,
            Note = note,
            Feedback = feedback,
        };

        return mediator.SendForMcpAsync(command, cancellationToken);
    }

    [McpServerTool(Name = "delete_interview", ReadOnly = false, Destructive = true)]
    [Description("Permanently deletes one of the current user's interviews.")]
    public Task<bool> DeleteInterview(
        [Description("The interview ID (GUID).")] Guid id,
        CancellationToken cancellationToken = default
    ) =>
        mediator.SendForMcpAsync(new DeleteInterviewCommand { InterviewId = id }, cancellationToken);
}