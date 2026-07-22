using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Features.JobApp.Dtos;
using JobAppTracker.Domain.Enums;
using MediatR;

namespace JobAppTracker.Application.Features.JobApp.Commands
{
    public class UpdateJobAppCommand : IRequest<UpdateJobAppDto>
    {
        public Guid JobAppId { get; set; }
        public string CompanyName { get; set; }
        public string Title { get; set; }
        public string Location { get; set; }
        public string? JobLink { get; set; }
        public JobAppStatus Status { get; set; }
        public string Description { get; set; }

        public JobType Type {get; set; }
        public WorkMode WorkMode {get; set; }
        public IEnumerable<string> RequiredSkills {get; set; }
    }
}
