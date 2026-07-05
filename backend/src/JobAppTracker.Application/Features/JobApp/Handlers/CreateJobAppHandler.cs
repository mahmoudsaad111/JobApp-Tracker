using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Common.Interfaces;
using JobAppTracker.Application.Features.JobApp.Commands;
using JobAppTracker.Application.Features.JobApp.Dtos;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Domain.Entities;
using JobAppTracker.Domain.Enums;
using MediatR;

namespace JobAppTracker.Application.Features.JobApp.Handlers
{
    public class CreateJobAppHandler : IRequestHandler<CreateJobAppCommand, CreateJobAppDto>
    {
        private readonly IJobAppRepository _jobAppRepository;
        private readonly ICurrentUserService _currentUserService;

        public CreateJobAppHandler(
            IJobAppRepository jobAppRepository,
            ICurrentUserService currentUserService
        )
        {
            _jobAppRepository = jobAppRepository;
            _currentUserService = currentUserService;
        }

        public async Task<CreateJobAppDto> Handle(
            CreateJobAppCommand request,
            CancellationToken cancellationToken
        )
        {
            var jobApplication = JobApplication.Create(
                userId: _currentUserService.UserId,
                companyName: request.CompanyName ?? throw new BadRequestException("Company name is required"),
                title: request.Title ?? throw new BadRequestException("Title is required"),
                appliedAt: request.ApplicationDate,
                location: request.Location,
                description: request.Description,
                link: request.Link,
                workMode: request.WorkMode ?? WorkMode.Onsite,
                status: request.Status
            );

            var result = await _jobAppRepository.AddAsync(jobApplication);
            if (result is null)
                throw new BadRequestException("Failed to create job application");

            await _jobAppRepository.SaveChangesAsync();

            return new CreateJobAppDto
            {
                JobAppId = result.Id,
                CompanyName = result.CompanyName,
                Title = result.Title,
                Location = result.Location,
                JobLink = result.Link,
                AppliedAt = result.AppliedAt,
                Status = result.Status,
                Description = result.Description,
            };
        }
    }
}
