using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Common.Interfaces;
using JobAppTracker.Application.Features.Interviews.Commands;
using JobAppTracker.Application.Features.Interviews.Dtos;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Application.Mappers;
using JobAppTracker.Domain.Entities;
using JobAppTracker.Domain.Enums;
using MediatR;

namespace JobAppTracker.Application.Features.Interviews.Handlers
{
    public class CreateInterviewHandler
        : IRequestHandler<CreateInterviewCommand, CreateInterviewDto>
    {
        private readonly IInterviewRepository _interviewRepository;
        private readonly IJobAppRepository _jobAppRepository;
        private readonly ICurrentUserService _currentUserService;

        public CreateInterviewHandler(
            IInterviewRepository interviewRepository,
            IJobAppRepository jobAppRepository,
            ICurrentUserService currentUserService
        )
        {
            _interviewRepository = interviewRepository;
            _jobAppRepository = jobAppRepository;
            _currentUserService = currentUserService;
        }

        public async Task<CreateInterviewDto> Handle(
            CreateInterviewCommand request,
            CancellationToken cancellationToken
        )
        {
            var currentUserId = _currentUserService.UserId;
            var jobApp = await _jobAppRepository.GetByIdAsync(Guid.Parse(request.JobAppId));

            if (jobApp == null || jobApp.UserId != currentUserId)
                throw new NotFoundException("Job application not found.");

            var interview = Interview.Create(
                jobAppId: Guid.Parse(request.JobAppId),
                userId: currentUserId,
                interviewType: request.InterviewType,
                interviewDate: request.InterviewDate,
                interviewerName: request.InterviewerName,
                note: request.Note,
                feedback: request.Feedback
            );

            var result = await _interviewRepository.AddAsync(interview);
            await _interviewRepository.SaveChangesAsync();
            return InterviewsMapper.ToCreateInterviewDto(result);
        }
    }
}
