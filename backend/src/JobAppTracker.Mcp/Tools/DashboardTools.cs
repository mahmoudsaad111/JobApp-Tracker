using System.ComponentModel;
using JobAppTracker.Application.Features.Dashboard.Dtos;
using JobAppTracker.Application.Features.Dashboard.Queries;
using MediatR;
using ModelContextProtocol.Server;

namespace JobAppTracker.Mcp.Tools;

// Tools for interacting with the user's dashboard.
[McpServerToolType]
public class DashboardTools(IMediator mediator)
{
    [McpServerTool(Name = "get_dashboard_summary", ReadOnly = true)]
    [Description("Gets a summary of the current user's job applications and interviews.")]
    public Task<DashboardSummaryDto> GetDashboardSummary(
        CancellationToken cancellationToken = default
    ) =>
        mediator.SendForMcpAsync(new DashboardSummaryQuery(), cancellationToken);
}
