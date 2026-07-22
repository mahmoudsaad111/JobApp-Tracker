// Application/Interfaces/Services/IDocumentTextExtractorService.cs
namespace JobAppTracker.Application.Interfaces.Services;

public interface IDocumentTextExtractorService
{
    Task<string> ExtractTextAsync(string filePath, CancellationToken ct = default);
}