using System.Collections.Generic;
using System.Linq;
using JobAppTracker.Application.Features.Interviews.Dtos;
using JobAppTracker.Application.Features.JobApp.Dtos;
using JobAppTracker.Domain.Entities;

namespace JobAppTracker.Application.Mappers
{
    public static class InterviewsMapper
    {
        public static CreateInterviewDto ToCreateInterviewDto(Interview interview)
        {
            return new CreateInterviewDto
            {
                InterviewId = interview.Id,
                JobAppId = interview.JobAppId,
                InterviewDate = interview.InterviewDate,
                InterviewType = interview.InterviewType,
                InterviewerName = interview.InterviewerName,
                Note = interview.Note,
                Feedback = interview.Feedback,
            };
        }

        public static UpdateInterviewDto ToUpdateInterviewDto(Interview interview)
        {
            return new UpdateInterviewDto
            {
                InterviewId = interview.Id,
                JobAppId = interview.JobAppId,
                InterviewDate = interview.InterviewDate,
                InterviewType = interview.InterviewType,
                InterviewerName = interview.InterviewerName,
                Note = interview.Note,
                Feedback = interview.Feedback,
            };
        }

        public static GetInterviewDto ToGetInterviewDto(Interview interview)
        {
            return new GetInterviewDto
            {
                InterviewId = interview.Id,
                JobAppId = interview.JobAppId,
                InterviewDate = interview.InterviewDate,
                InterviewType = interview.InterviewType,
                Note = interview.Note,
                Feedback = interview.Feedback,
            };
        }

        public static GetAllInterviewsDto ToGetAllInterviewsDto(Interview interview)
        {
            return new GetAllInterviewsDto
            {
                InterviewId = interview.Id,
                IobAppId = interview.JobAppId,
                InterviewDate = interview.InterviewDate,
                InterviewType = interview.InterviewType.ToString(),
                InterviewerName = interview.InterviewerName,
                Note = interview.Note ?? string.Empty,
                Feedback = interview.Feedback ?? string.Empty,
                CreatedAt = interview.CreatedAt,
                UpdatedAt = interview.UpdatedAt,
                JobApplication = interview.JobApplication == null
                    ? new JobApplicationSummaryDto()
                    : new JobApplicationSummaryDto
                    {
                        JobAppId = interview.JobApplication.Id,
                        CompanyName = interview.JobApplication.CompanyName ?? string.Empty,
                        Title = interview.JobApplication.Title ?? string.Empty,
                        Location = interview.JobApplication.Location ?? string.Empty,
                        Status = interview.JobApplication.Status.ToString(),
                        WorkMode = interview.JobApplication.WorkMode.ToString(),
                        Type = interview.JobApplication.Type.ToString(),
                        Link = interview.JobApplication.Link,
                    },
            };
        }

        public static IEnumerable<GetAllInterviewsDto> ToGetAllInterviewsDto(IEnumerable<Interview> interviews)
        {
            return interviews.Select(ToGetAllInterviewsDto).ToList();
        }
    }
}
