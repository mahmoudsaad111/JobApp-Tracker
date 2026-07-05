using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Common.Interfaces;
using JobAppTracker.Application.Features.Interviews.Commands;
using JobAppTracker.Application.Features.Interviews.Dtos;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Application.Mappers;
using MediatR;

namespace JobAppTracker.Application.Features.Interviews.Handlers
{
    public class UpdateInterviewHandler
        : IRequestHandler<UpdateInterviewCommand, UpdateInterviewDto>
    {
        private readonly IInterviewRepository _interviewRepository;
        private readonly ICurrentUserService _currentUserService;

        public UpdateInterviewHandler(
            IInterviewRepository interviewRepository,
            ICurrentUserService currentUserService
        )
        {
            _interviewRepository = interviewRepository;
            _currentUserService = currentUserService;
        }

        public async Task<UpdateInterviewDto> Handle(
            UpdateInterviewCommand request,
            CancellationToken cancellationToken
        )
        {
            var userId = _currentUserService.UserId;
            var interview = await _interviewRepository.GetByIdAsync(request.InterviewId);
            if (interview == null || interview.UserId != userId)
                throw new NotFoundException("Interview not found.");

            interview.UpdateDetails(
                interviewType: request.InterviewType,
                interviewDate: request.InterviewDate,
                interviewerName: request.InterviewerName,
                note: request.Note
            );

            if (!string.IsNullOrWhiteSpace(request.Feedback))
                interview.AddFeedback(request.Feedback);

            var result = _interviewRepository.Update(interview);
            await _interviewRepository.SaveChangesAsync();
            return InterviewsMapper.ToUpdateInterviewDto(result);
        }
    }
}
