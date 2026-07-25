using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Common.Responses;
using JobAppTracker.Application.Features.JobApp.Dtos;
using JobAppTracker.Domain.Enums;
using MediatR;

namespace JobAppTracker.Application.Features.JobApp.Queries
{
    public class GetJobAppsForUserQuery : IRequest<ApiResponse<List<GetJobAppForUserDto>>>
    {
        public Guid UserId;
        public string Search { get; set; } = string.Empty;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public JobAppSortBy? SortBy { get; set; } = null;
        public string? SortDir { get; set; } = null;
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public JobAppStatus? Status { get; set; } = null;
        public WorkMode? WorkMode { get; set; } = null;
    }
}
