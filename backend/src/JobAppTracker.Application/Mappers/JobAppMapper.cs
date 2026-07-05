using System.Collections.Generic;
using System.Linq;
using JobAppTracker.Application.Features.JobApp.Dtos;
using JobAppTracker.Domain.Entities;

namespace JobAppTracker.Application.Mappers
{
    public static class JobAppMapper
    {
        public static GetJobAppByIdDto ToGetJobAppByIdDto(JobApplication jobApp)
        {
            return new GetJobAppByIdDto
            {
                JobAppId = jobApp.Id,
                CompanyName = jobApp.CompanyName,
                Title = jobApp.Title,
                Description = jobApp.Description,
                JobLink = jobApp.Link,
                Type = jobApp.Type,
                WorkMode = jobApp.WorkMode,
                Location = jobApp.Location,
                AppliedAt = jobApp.AppliedAt,
                CreatedAt = jobApp.CreatedAt,
                UpdatedAt = jobApp.UpdatedAt,
                Status = jobApp.Status,
                Interviews = jobApp.Interviews.Select(i => new InterviewDto
                {
                    InterviewId = i.Id,
                    InterviewerName = i.InterviewerName,
                    InterviewType = i.InterviewType,
                    InterviewDate = i.InterviewDate,
                    Note = i.Note,
                    Feedback = i.Feedback,
                }).ToList(),
            };
        }

        public static GetJobAppForUserDto ToGetJobAppForUserDto(JobApplication jobApp)
        {
            return new GetJobAppForUserDto
            {
                JobAppId = jobApp.Id,
                CompanyName = jobApp.CompanyName,
                Title = jobApp.Title,
                AppliedAt = jobApp.AppliedAt,
                Status = jobApp.Status,
                WorkMode = jobApp.WorkMode,
            };
        }

        public static IEnumerable<GetJobAppForUserDto> ToGetJobAppForUserDto(IEnumerable<JobApplication> jobApps)
        {
            return jobApps.Select(ToGetJobAppForUserDto).ToList();
        }
    }
}
