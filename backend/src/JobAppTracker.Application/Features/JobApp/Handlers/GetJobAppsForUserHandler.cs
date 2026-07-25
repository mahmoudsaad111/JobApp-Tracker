using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Security.Claims;
using System.Text;
using JobAppTracker.Application.Common.Interfaces;
using JobAppTracker.Application.Common.Responses;
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
        : IRequestHandler<GetJobAppsForUserQuery, ApiResponse<List<GetJobAppForUserDto>>>
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

        public async Task<ApiResponse<List<GetJobAppForUserDto>>> Handle(
            GetJobAppsForUserQuery request,
            CancellationToken cancellationToken
        )
        {
            request.UserId = _currentUserService.UserId;

            IQueryable<JobApplication> result = _jobAppRepository.GetJobAppsForUser(request.UserId);

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

            var total = await result.CountAsync(cancellationToken);

            if (request.SortBy != null)
            {
                result = request.SortBy switch
                {
                    JobAppSortBy.CompanyName => request.SortDir == "desc" ? result.OrderByDescending(j => j.CompanyName) : result.OrderBy(j => j.CompanyName),
                    JobAppSortBy.Title => request.SortDir == "desc" ? result.OrderByDescending(j => j.Title) : result.OrderBy(j => j.Title),
                    JobAppSortBy.AppliedAt => request.SortDir == "desc" ? result.OrderByDescending(j => j.AppliedAt) : result.OrderBy(j => j.AppliedAt),
                    JobAppSortBy.Status => request.SortDir == "desc" ? result.OrderByDescending(j => j.Status) : result.OrderBy(j => j.Status),
                    JobAppSortBy.WorkMode => request.SortDir == "desc" ? result.OrderByDescending(j => j.WorkMode) : result.OrderBy(j => j.WorkMode),
                    _ => result,
                };
            }
            else
            {
                result = result.OrderByDescending(j => j.AppliedAt);
            }
            if (request.Page > 0 && request.PageSize > 0)
            {
                result = result.Skip((request.Page - 1) * request.PageSize).Take(request.PageSize);
            }

            var jobApps = await result.ToListAsync(cancellationToken);
            var data = JobAppMapper.ToGetJobAppForUserDto(jobApps).ToList();

            var response = ApiResponse<List<GetJobAppForUserDto>>.SuccessResult(
                data,
                "JobApps Retrieved Successfully"
            );
            response.Total = total;
            return response;
        }
    }
}
