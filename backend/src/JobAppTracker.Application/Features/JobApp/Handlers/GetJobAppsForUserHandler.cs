using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Security.Claims;
using System.Text;
using JobAppTracker.Application.Common.Interfaces;
using JobAppTracker.Application.Features.JobApp.Dtos;
using JobAppTracker.Application.Features.JobApp.Queries;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Application.Mappers;
using JobAppTracker.Domain.Entities;
using JobAppTracker.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace JobAppTracker.Application.Features.JobApp.Handlers
{
    public class GetJobAppsForUserHandler
        : IRequestHandler<GetJobAppsForUserQuery, List<GetJobAppForUserDto>>
    {
        private readonly IJobAppRepository _jobAppRepository;
        private readonly ICurrentUserService _currentUserService;

        public GetJobAppsForUserHandler(
            IJobAppRepository jobAppRepository,
            ICurrentUserService currentUserService
        )
        {
            _jobAppRepository = jobAppRepository;
            _currentUserService = currentUserService;
        }

        public async Task<List<GetJobAppForUserDto>> Handle(
            GetJobAppsForUserQuery request,
            CancellationToken cancellationToken
        )
        {
            request.UserId = _currentUserService.UserId;

            // Get the job applications for the user from the repository
            IQueryable<JobApplication> result = _jobAppRepository.GetJobAppsForUser(request.UserId);

            // Apply filters based on the request parameters

            // If Search is provided, filter by CompanyName or Title containing the search term (case-insensitive)
            if (!string.IsNullOrEmpty(request.Search))
            {
                var pattern = $"%{request.Search}%";
                result = result.Where(j =>
                    EF.Functions.Like(j.CompanyName, pattern) || EF.Functions.Like(j.Title, pattern)
                );
            }

            if (request.Status != null)
            {
                result = result.Where(j => j.Status == request.Status);
            }

            if (request.FromDate.HasValue)
            {
                result = result.Where(j => j.AppliedAt >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                result = result.Where(j => j.AppliedAt <= request.ToDate.Value);
            }

            if (request.SortBy != null)
            {
                result = request.SortBy switch
                {
                    JobAppSortBy.CompanyName => result.OrderBy(j => j.CompanyName),
                    JobAppSortBy.Title => result.OrderBy(j => j.Title),
                    JobAppSortBy.AppliedAt => result.OrderBy(j => j.AppliedAt),
                    JobAppSortBy.Status => result.OrderBy(j => j.Status),
                    JobAppSortBy.WorkMode => result.OrderBy(j => j.WorkMode),
                    _ => result,
                };
            }
            else
            {
                result = result.OrderBy(j => j.AppliedAt);
            }
            if (request.Page > 0 && request.PageSize > 0)
            {
                result = result.Skip((request.Page - 1) * request.PageSize).Take(request.PageSize);
            }

            var jobApps = await result.ToListAsync(cancellationToken);
            return JobAppMapper.ToGetJobAppForUserDto(jobApps).ToList();
        }
    }
}
