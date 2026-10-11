namespace JobAppTracker.Application.Features.Documents.Dtos
{
    public class DocumentFileDto
    {
        public string PhysicalPath { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = "application/octet-stream";
    }
}
