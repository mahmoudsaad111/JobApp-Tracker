// Application/Features/CoverLetterGeneration/Queries/GenerateCoverLetterQueryHandler.cs
using JobAppTracker.Application.Features.AI.CoverLetterGeneration.DTOs;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Application.Interfaces.Services;
using JobAppTracker.Application.Interfaces.Services.AI;
using JobAppTracker.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace JobAppTracker.Application.Features.CoverLetterGeneration.Queries;

public class GenerateCoverLetterQueryHandler : IRequestHandler<GenerateCoverLetterQuery, CoverLetterDto>
{
    private readonly IJobAppRepository _jobAppRepository;
    private readonly IDocumentRepository _documentRepository;

    private readonly ICoverLetterGeneratorService _coverLetterService;
    private readonly IDocumentTextExtractorService _documentTextExtractorService; 

    public GenerateCoverLetterQueryHandler(IJobAppRepository jobAppRepository,IDocumentRepository documentRepository,
     ICoverLetterGeneratorService coverLetterService,IDocumentTextExtractorService documentTextExtractorService)
    {
        _jobAppRepository = jobAppRepository;
        _coverLetterService = coverLetterService;
        _documentTextExtractorService=documentTextExtractorService ;
        _documentRepository=documentRepository; 
    }

    public async Task<CoverLetterDto> Handle(GenerateCoverLetterQuery request, CancellationToken ct)
    {
         var application = await _jobAppRepository.GetByIdAsync(request.JobApplicationId)
            ?? throw new KeyNotFoundException($"Job application {request.JobApplicationId} not found");
         var document = await _documentRepository.GetByIdAsync(request.DocumentId)
            ?? throw new KeyNotFoundException($"Document {request.DocumentId} not found");
        
        var ResumeText=await _documentTextExtractorService.ExtractTextAsync(document.FilePath,ct); 
        var coverLetterRequest = new CoverLetterRequest(
            JobTitle: application.Title,
            CompanyName: application.CompanyName,
            JobDescription: application.Description,
            RequiredSkills: application.RequiredSkills,
            ResumeText: ResumeText,
            Tone: request.Tone
        );

        var text = await _coverLetterService.GenerateAsync(coverLetterRequest, ct);

        return new CoverLetterDto(text);
    }
}