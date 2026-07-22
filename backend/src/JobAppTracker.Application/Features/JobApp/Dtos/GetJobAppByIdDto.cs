using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Domain.Entities;
using JobAppTracker.Domain.Enums;

namespace JobAppTracker.Application.Features.JobApp.Dtos
{
    public class GetJobAppByIdDto
    {
        public Guid JobAppId { get; set; }

        public JobAppStatus Status { get; set; }
        public string? CompanyName { get; set; }

        public string? Location { get; set; }
        public string? Title { get; set; }

        public string? Description { get; set; }
        public string? JobLink { get; set; }
        public JobType Type { get; set; }
        public WorkMode WorkMode { get; set; }

        public DateTime AppliedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; }
        
        public IEnumerable<string>RequiredSkills{ get; set; } = new List<string>(); 
        public IEnumerable<InterviewDto> Interviews { get; set; } = new List<InterviewDto>();
    }

    public class InterviewDto
    {
        public Guid InterviewId { get; set; }
        public string? InterviewerName { get; set; }
        public InterviewType InterviewType { get; set; }
        public DateTime InterviewDate { get; set; }
        public string? Note { get; set; } = string.Empty;
        public string? Feedback { get; set; } = string.Empty;
    }
}
