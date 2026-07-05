using JobAppTracker.Application.Features.Dashboard.Dtos;
using JobAppTracker.Domain.Entities;

namespace JobAppTracker.Application.Mappers
{
    public static class DashboardMapper
    {
        public static DashboardSummaryDto ToDashboardSummaryDto(DashboardSummaryDto dashboardSummary)
        {
            return dashboardSummary;
        }
    }
}
