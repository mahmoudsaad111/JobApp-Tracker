// Application/Features/JobPostingParsing/Queries/ParseJobPostingQuery.cs
using JobAppTracker.Application.DTOs;
using JobAppTracker.Domain.ValueObjects;
using MediatR;

namespace JobAppTracker.Application.Features.JobPostingParsing.Queries;

public record ParseJobPostingQuery(string RawText) : IRequest<ParsedJobPostingDto>;