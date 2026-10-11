using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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

            // Drafts are not sent applications yet, so they are excluded from every
            // dashboard number. This keeps the status buckets adding up to the total.
            var applicationsQuery = _appContext.JobApplications
                .AsNoTracking()
                .Where(j => j.UserId == userGuid && j.Status != JobAppStatus.Draft);

            // Aggregate counts run as SQL COUNT/GROUP BY, not loaded into memory
            var totalApplications = await applicationsQuery.CountAsync();
            var thisWeekApplications = await applicationsQuery.CountAsync(a => a.AppliedAt >= weekAgo);

            var statusCounts = await applicationsQuery
                .GroupBy(a => a.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var counts = statusCounts.ToDictionary(s => s.Status, s => s.Count);

            int Count(params JobAppStatus[] statuses) =>
                statuses.Sum(s => counts.GetValueOrDefault(s));

            // Every non-draft status belongs to exactly one dashboard bucket.
            var applied = Count(JobAppStatus.Submitted, JobAppStatus.UnderReview);
            var interviewing = Count(JobAppStatus.InterviewScheduled, JobAppStatus.Interviewed);
            var offered = Count(JobAppStatus.Accepted);
            var rejected = Count(JobAppStatus.Rejected);
            var withdrawn = Count(JobAppStatus.Withdrawn);

            var decided = applied + interviewing + offered + rejected + withdrawn;
            var responseRate = decided == 0
                ? 0
                : Math.Round((interviewing + offered + rejected) * 100.0 / decided, 1);

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
                    InterviewDate = a.InterviewDate,
                    InterviewType = a.InterviewType.ToString()
                })
                .ToListAsync(); // only pulls the fields needed, not the whole JobApplication

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
                ResponseRate = responseRate,
                ByStatus = new StatusBreakdownDto
                {
                    Applied = applied,
                    Interviewing = interviewing,
                    Offered = offered,
                    Rejected = rejected,
                    Withdrawn = withdrawn
                },
                UpcomingInterviews = upcomingInterviews,
                RecentApplications = recentApplications
            };
        }
    }
}
