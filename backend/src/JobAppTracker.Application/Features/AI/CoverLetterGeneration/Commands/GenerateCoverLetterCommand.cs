using JobAppTracker.Application.Features.AI.CoverLetterGeneration.DTOs;
using MediatR;

namespace JobAppTracker.Application.Features.AI.CoverLetterGeneration.Commands;
public record GenerateCoverLetterCommand(Guid ApplicationId, Guid DocumentId, Guid UserId, string? Tone) 
    : IRequest<CoverLetterDto>;