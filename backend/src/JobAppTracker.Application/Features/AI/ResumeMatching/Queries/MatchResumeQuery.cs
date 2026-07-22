// Application/Features/JobMatching/Queries/MatchResumeQuery.cs
using JobAppTracker.Application.Interfaces.Services.AI;
using MediatR;

namespace JobAppTracker.Application.Features.JobMatching.Queries;

public record MatchResumeQuery(Guid JobApplicationId, Guid DocumentId) : IRequest<ResumeMatchResult>;