using System;
using System.Collections.Generic;
using System.Net.NetworkInformation;
using System.Text;
using JobAppTracker.Application.Features.Dashboard.Dtos;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Domain.Enums;
using JobAppTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobAppTracker.Infrastructure.Repositories
{
    public class DashboardRepository : IDashboardRepository
    {
        private readonly AppDbContext _appContext;

        public DashboardRepository(AppDbContext appContext)
        {
            _appContext = appContext;
        }

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(string userId)
        {
            var userGuid = Guid.Parse(userId);
            var weekAgo = DateTime.UtcNow.AddDays(-7);
            var now = DateTime.UtcNow;

            var applicationsQuery = _appContext.JobApplications
                .AsNoTracking()
                .Where(j => j.UserId == userGuid);

            // Aggregate counts run as SQL COUNT/GROUP BY, not loaded into memory
            var totalApplications = await applicationsQuery.CountAsync();
            var thisWeekApplications = await applicationsQuery.CountAsync(a => a.AppliedAt >= weekAgo);

            var statusCounts = await applicationsQuery
                .GroupBy(a => a.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            int CountFor(JobAppStatus status) =>
                statusCounts.FirstOrDefault(s => s.Status == status)?.Count ?? 0;

            var upcomingInterviews = await _appContext.Interviews
                .AsNoTracking()
                .Where(i => i.UserId == userGuid && i.InterviewDate >= now)
                .OrderBy(i => i.InterviewDate)
                .Take(5)
                .Select(a => new UpcomingInterviewDto
                {
                    Id = a.Id,
                    Company = a.JobApplication.CompanyName,
                    Position = a.JobApplication.Title,
                    InterviewDate = a.InterviewDate
                })
                .ToListAsync(); // only pulls the 2 fields needed, not the whole JobApplication

            var recentApplications = await applicationsQuery
                .OrderByDescending(a => a.AppliedAt)
                .Take(5)
                .Select(a => new RecentApplicationDto
                {
                    JobAppId = a.Id,
                    Company = a.CompanyName,
                    Position = a.Title,
                    AppliedDate = a.AppliedAt,
                    Status = a.Status.ToString()
                })
                .ToListAsync();

            return new DashboardSummaryDto
            {
                TotalApplications = totalApplications,
                ThisWeekApplications = thisWeekApplications,
                ByStatus = new StatusBreakdownDto
                {
                    Applied = CountFor(JobAppStatus.Submitted),
                    Interviewing = CountFor(JobAppStatus.InterviewScheduled),
                    Offered = CountFor(JobAppStatus.UnderReview),
                    Rejected = CountFor(JobAppStatus.Rejected),
                    Withdrawn = CountFor(JobAppStatus.Withdrawn)
                },
                UpcomingInterviews = upcomingInterviews,
                RecentApplications = recentApplications
            };
        }

    }
}
