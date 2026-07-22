// Application/Features/CoverLetterGeneration/Queries/GenerateCoverLetterQuery.cs
using JobAppTracker.Application.Features.AI.CoverLetterGeneration.DTOs;
using MediatR;

namespace JobAppTracker.Application.Features.CoverLetterGeneration.Queries;

public record GenerateCoverLetterQuery(
    Guid JobApplicationId,
    Guid DocumentId,
    string? Tone
) : IRequest<CoverLetterDto>;