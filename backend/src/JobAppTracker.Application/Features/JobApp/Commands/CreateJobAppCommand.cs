using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Features.JobApp.Dtos;
using JobAppTracker.Domain.Enums;
using MediatR;

namespace JobAppTracker.Application.Features.JobApp.Commands
{
    public class CreateJobAppCommand : IRequest<CreateJobAppDto>
    {
        public string? CompanyName { get; set; }
        public string? Title { get; set; }
        public DateTime ApplicationDate { get; set; } = DateTime.Now;
        
        public JobType? Type { get; set; }
        public string? Location { get; set; }
        public string? Link { get; set; }
        public JobAppStatus Status { get; set; }
        public string Description { get; set; } = string.Empty;
        public WorkMode? WorkMode { get; set; }
        public List<string>? RequiredSkills { get; set; } = new List<string>();
    }
}
