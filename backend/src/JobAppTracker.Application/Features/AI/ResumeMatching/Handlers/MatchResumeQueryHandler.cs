// Application/Features/JobMatching/Queries/MatchResumeQueryHandler.cs
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Application.Interfaces.Services;
using JobAppTracker.Application.Interfaces.Services.AI;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace JobAppTracker.Application.Features.JobMatching.Queries;

public class MatchResumeQueryHandler : IRequestHandler<MatchResumeQuery, ResumeMatchResult>
{
    private readonly IJobAppRepository _jobAppRepository;
    private readonly IResumeMatchService _matchService;
    
    private readonly IDocumentRepository _documentRepository;

    private readonly IDocumentTextExtractorService _documentTextExtractorService; 

    public MatchResumeQueryHandler(IJobAppRepository jobAppRepository,IDocumentTextExtractorService documentTextExtractorService,
    IDocumentRepository documentRepository,IResumeMatchService matchService)
    {
        _jobAppRepository = jobAppRepository;
        _documentRepository=documentRepository; 
        _documentTextExtractorService=documentTextExtractorService; 
        _matchService = matchService;
    }


    public async Task<ResumeMatchResult> Handle(MatchResumeQuery request, CancellationToken ct)
    {
        var application = await _jobAppRepository.GetByIdAsync(request.JobApplicationId)
            ?? throw new KeyNotFoundException($"Job application {request.JobApplicationId} not found");
         var document = await _documentRepository.GetByIdAsync(request.DocumentId)
            ?? throw new KeyNotFoundException($"Document {request.DocumentId} not found");
        var ResumeText=await _documentTextExtractorService.ExtractTextAsync(document.FilePath,ct); 

        return await _matchService.MatchAsync(application.RequiredSkills, ResumeText, ct);
    }
}