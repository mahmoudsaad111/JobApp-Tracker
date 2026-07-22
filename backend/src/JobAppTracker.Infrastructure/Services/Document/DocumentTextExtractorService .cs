// Infrastructure/Services/Documents/DocumentTextExtractorService.cs
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using JobAppTracker.Application.Interfaces.Services;
using JobAppTracker.Domain.Common.Exceptions;
using UglyToad.PdfPig;

namespace JobAppTracker.Infrastructure.Services.Documents;

public class DocumentTextExtractorService : IDocumentTextExtractorService
{
    public Task<string> ExtractTextAsync(string filePath, CancellationToken ct = default)
    {
        var relative = filePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", relative);
        if (!File.Exists(fullPath))
            throw new DomainException("Document file not found.");

        var extension = Path.GetExtension(filePath).ToLowerInvariant();

        var text = extension switch
        {
            ".pdf" => ExtractFromPdf(fullPath),
            ".docx" => ExtractFromDocx(fullPath),
            _ => throw new DomainException($"Unsupported file type '{extension}' for text extraction.")
        };

        if (string.IsNullOrWhiteSpace(text))
            throw new DomainException("Could not extract any text from this document.");

        return Task.FromResult(text);
    }

    private static string ExtractFromPdf(string filePath)
    {
        using var document = PdfDocument.Open(filePath);
        var sb = new System.Text.StringBuilder();

        foreach (var page in document.GetPages())
        {
            sb.AppendLine(page.Text);
        }

        return sb.ToString().Trim();
    }

    private static string ExtractFromDocx(string filePath)
    {
        using var wordDoc = WordprocessingDocument.Open(filePath, false);
        var body = wordDoc.MainDocumentPart?.Document?.Body;

        if (body is null)
            return string.Empty;

        var sb = new System.Text.StringBuilder();
        foreach (var paragraph in body.Elements<Paragraph>())
        {
            sb.AppendLine(paragraph.InnerText);
        }

        return sb.ToString().Trim();
    }
}