namespace JobAppTracker.Application.Features.Documents.Dtos
{
    public class DocumentTextDto
    {
        public string FileName { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;

        // True when the document was longer than the limit and Text was cut off.
        public bool IsTruncated { get; set; }
    }
}
