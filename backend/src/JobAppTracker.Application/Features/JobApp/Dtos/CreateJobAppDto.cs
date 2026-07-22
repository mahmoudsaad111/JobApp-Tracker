using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Domain.Enums;

namespace JobAppTracker.Application.Features.JobApp.Dtos
{
    public class CreateJobAppDto
    {
        public Guid JobAppId { get; set; }
        public string CompanyName { get; set; }
        public string Title { get; set; }
        public string Location { get; set; }
        public string JobLink { get; set; }
        public DateTime AppliedAt { get; set; }
        public JobAppStatus Status { get; set; }
        public string Description { get; set; }
        public JobType Type { get; set; }
        public WorkMode WorkMode { get; set; }
        public List<string> RequiredSkills { get; set; } = new List<string>();
    }
}
