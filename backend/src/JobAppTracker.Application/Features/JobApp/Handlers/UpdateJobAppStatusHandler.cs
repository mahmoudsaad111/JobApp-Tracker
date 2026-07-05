using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Common.Interfaces;
using JobAppTracker.Application.Features.JobApp.Commands;
using JobAppTracker.Application.Features.JobApp.Dtos;
using JobAppTracker.Application.Interfaces.Repositories;
using MediatR;

namespace JobAppTracker.Application.Features.JobApp.Handlers
{
    public class UpdateJobAppStatusHandler
        : IRequestHandler<UpdateJobAppStatusCommand, UpdateJobAppStatusDto>
    {
        private readonly ICurrentUserService _currentUserService;
        private readonly IJobAppRepository _jobAppRepository;

        public UpdateJobAppStatusHandler(
            ICurrentUserService currentUserService,
            IJobAppRepository jobAppRepository
        )
        {
            _currentUserService = currentUserService;
            _jobAppRepository = jobAppRepository;
        }

        public async Task<UpdateJobAppStatusDto> Handle(
            UpdateJobAppStatusCommand request,
            CancellationToken cancellationToken
        )
        {
            var userId = _currentUserService.UserId;
            var jobApp = await _jobAppRepository.GetByIdAsync(request.JobAppId);
            if (jobApp == null || jobApp.UserId != userId)
                throw new NotFoundException("Job application not found.");

            jobApp.ChangeStatus(request.Status);

            var UpdatedJobApp = _jobAppRepository.Update(jobApp);
            await _jobAppRepository.SaveChangesAsync();

            return new UpdateJobAppStatusDto
            {
                JobAppId = UpdatedJobApp.Id,
                Status = UpdatedJobApp.Status,
                CompanyName = UpdatedJobApp.CompanyName,
                Title = UpdatedJobApp.Title,
                Location = UpdatedJobApp.Location,
                JobLink = UpdatedJobApp.Link,
                AppliedAt = UpdatedJobApp.AppliedAt,
                Description = UpdatedJobApp.Description,
            };
        }
    }
}
