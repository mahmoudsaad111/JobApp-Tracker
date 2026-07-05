using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;
using JobAppTracker.Application.Common.Interfaces;
using JobAppTracker.Application.Common.Responses;
using JobAppTracker.Application.Features.Interviews.Dtos;
using JobAppTracker.Application.Features.Interviews.Queries;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Application.Mappers;
using MediatR;
using MediatR.Pipeline;
using Microsoft.AspNetCore.Http;

namespace JobAppTracker.Application.Features.Interviews.Handlers
{
    public class GetAllInterviewsHandler
        : IRequestHandler<GetAllInterviewsQuery, IEnumerable<GetAllInterviewsDto>>
    {
        private IInterviewRepository _interviewRepository;
        private readonly ICurrentUserService _currentUserService;

        public GetAllInterviewsHandler(
            IInterviewRepository interviewRepository,
            ICurrentUserService currentUserService
        )
        {
            _interviewRepository = interviewRepository;
            _currentUserService = currentUserService;
        }

        public async Task<IEnumerable<GetAllInterviewsDto>> Handle(
            GetAllInterviewsQuery request,
            CancellationToken cancellationToken
        )
        {
            // Get the current user's id from JWT claims
            var userId = _currentUserService.UserId;
            var interviews = await _interviewRepository.GetInterviewsForUserAsync(userId);
            return InterviewsMapper.ToGetAllInterviewsDto(interviews);
        }
    }
}
