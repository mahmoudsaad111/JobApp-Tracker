using JobAppTracker.Domain.Common.Exceptions;
using JobAppTracker.Domain.Enums;
using Doc = JobAppTracker.Domain.Entities.Document;

namespace JobAppTracker.Domain.UnitTests.Document;

// NOTE: this file lives in the "Document" folder/namespace, which collides
// with the entity type JobAppTracker.Domain.Entities.Document (same simple
// name). The "Doc" alias above sidesteps that ambiguity - do the same for
// JobApplication/Interview/Note/User test files, since they'll hit the
// identical collision with their own entity names.
public class DocumentTests
{
    private const string ValidFileName = "MyResume.pdf";
    private const string ValidFilePath = "/uploads/documents/abc123.pdf";
    private const long ValidFileSize = 1024;
    private static readonly Guid ValidUserId = Guid.NewGuid();

    private static Doc CreateValidDocument(
        string fileName = ValidFileName,
        string filePath = ValidFilePath,
        long fileSize = ValidFileSize,
        DocumentType type = DocumentType.Resume,
        ContentType contentType = ContentType.PDF,
        Guid? userId = null,
        Guid? jobApplicationId = null
    )
    {
        return Doc.Create(
            fileName,
            filePath,
            fileSize,
            type,
            contentType,
            userId ?? ValidUserId,
            jobApplicationId
        );
    }

    // ---------- Create: happy path ----------

    [Fact]
    public void Create_WithValidData_ReturnsDocumentWithExpectedValues()
    {
        var document = CreateValidDocument();

        Assert.NotEqual(Guid.Empty, document.Id);
        Assert.Equal(ValidFileName, document.FileName);
        Assert.Equal(ValidFilePath, document.FilePath);
        Assert.Equal(ValidFileSize, document.FileSize);
        Assert.Equal(DocumentType.Resume, document.Type);
        Assert.Equal(ContentType.PDF, document.ContentType);
        Assert.Equal(ValidUserId, document.UserId);
        Assert.Null(document.JobApplicationId);
    }

    [Fact]
    public void Create_SetsCreatedAtAndUpdatedAtToTheSameUtcTimestamp()
    {
        var before = DateTime.UtcNow;

        var document = CreateValidDocument();

        var after = DateTime.UtcNow;

        Assert.Equal(document.CreatedAt, document.UpdatedAt);
        Assert.InRange(document.CreatedAt, before, after);
    }

    [Fact]
    public void Create_GeneratesUniqueIdsForEachDocument()
    {
        var first = CreateValidDocument();
        var second = CreateValidDocument();

        Assert.NotEqual(first.Id, second.Id);
    }

    [Fact]
    public void Create_TrimsFileNameAndFilePath()
    {
        var document = CreateValidDocument(
            fileName: "  MyResume.pdf  ",
            filePath: "  /uploads/documents/abc123.pdf  "
        );

        Assert.Equal(ValidFileName, document.FileName);
        Assert.Equal(ValidFilePath, document.FilePath);
    }

    [Fact]
    public void Create_WithJobApplicationId_AssignsIt()
    {
        var jobApplicationId = Guid.NewGuid();

        var document = CreateValidDocument(jobApplicationId: jobApplicationId);

        Assert.Equal(jobApplicationId, document.JobApplicationId);
    }

    // ---------- Create: edge cases / invalid input ----------

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithInvalidFileName_ThrowsDomainException(string? invalidFileName)
    {
        Assert.Throws<DomainException>(() => CreateValidDocument(fileName: invalidFileName!));
    }

    [Fact]
    public void Create_WithFileNameExceedingMaxLength_ThrowsDomainException()
    {
        var tooLongFileName = new string('a', 256) + ".pdf";

        Assert.Throws<DomainException>(() => CreateValidDocument(fileName: tooLongFileName));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithInvalidFilePath_ThrowsDomainException(string? invalidFilePath)
    {
        Assert.Throws<DomainException>(() => CreateValidDocument(filePath: invalidFilePath!));
    }

    [Fact]
    public void Create_WithFilePathExceedingMaxLength_ThrowsDomainException()
    {
        var tooLongFilePath = "/" + new string('a', 500);

        Assert.Throws<DomainException>(() => CreateValidDocument(filePath: tooLongFilePath));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-1024)]
    public void Create_WithNonPositiveFileSize_ThrowsDomainException(long invalidFileSize)
    {
        Assert.Throws<DomainException>(() => CreateValidDocument(fileSize: invalidFileSize));
    }

    [Fact]
    public void Create_WithInvalidDocumentType_ThrowsDomainException()
    {
        var invalidType = (DocumentType)999;

        Assert.Throws<DomainException>(() => CreateValidDocument(type: invalidType));
    }

    [Fact]
    public void Create_WithInvalidContentType_ThrowsDomainException()
    {
        var invalidContentType = (ContentType)999;

        Assert.Throws<DomainException>(() => CreateValidDocument(contentType: invalidContentType));
    }

    [Fact]
    public void Create_WithEmptyUserId_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => CreateValidDocument(userId: Guid.Empty));
    }

    [Fact]
    public void Create_WithEmptyJobApplicationId_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => CreateValidDocument(jobApplicationId: Guid.Empty));
    }

    // ---------- Rename ----------

    [Fact]
    public void Rename_WithValidName_UpdatesFileNameAndUpdatedAt()
    {
        var document = CreateValidDocument();
        var originalUpdatedAt = document.UpdatedAt;

        document.Rename("NewFileName.pdf");

        Assert.Equal("NewFileName.pdf", document.FileName);
        Assert.True(document.UpdatedAt >= originalUpdatedAt);
    }

    [Fact]
    public void Rename_TrimsWhitespace()
    {
        var document = CreateValidDocument();

        document.Rename("  NewFileName.pdf  ");

        Assert.Equal("NewFileName.pdf", document.FileName);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Rename_WithInvalidName_ThrowsDomainException(string? invalidName)
    {
        var document = CreateValidDocument();

        Assert.Throws<DomainException>(() => document.Rename(invalidName!));
    }

    [Fact]
    public void Rename_WithNameExceedingMaxLength_ThrowsDomainException()
    {
        var document = CreateValidDocument();
        var tooLongFileName = new string('a', 256) + ".pdf";

        Assert.Throws<DomainException>(() => document.Rename(tooLongFileName));
    }

    // ---------- Reclassify ----------

    [Fact]
    public void Reclassify_WithValidType_UpdatesTypeAndUpdatedAt()
    {
        var document = CreateValidDocument(type: DocumentType.Resume);
        var originalUpdatedAt = document.UpdatedAt;

        document.Reclassify(DocumentType.CoverLetter);

        Assert.Equal(DocumentType.CoverLetter, document.Type);
        Assert.True(document.UpdatedAt >= originalUpdatedAt);
    }

    [Fact]
    public void Reclassify_WithInvalidType_ThrowsDomainException()
    {
        var document = CreateValidDocument();
        var invalidType = (DocumentType)999;

        Assert.Throws<DomainException>(() => document.Reclassify(invalidType));
    }

    // ---------- Job application linking ----------

    [Fact]
    public void AssignToJobApplication_WithValidId_SetsJobApplicationIdAndUpdatesTimestamp()
    {
        var document = CreateValidDocument();
        var jobApplicationId = Guid.NewGuid();
        var originalUpdatedAt = document.UpdatedAt;

        document.AssignToJobApplication(jobApplicationId);

        Assert.Equal(jobApplicationId, document.JobApplicationId);
        Assert.True(document.UpdatedAt >= originalUpdatedAt);
    }

    [Fact]
    public void AssignToJobApplication_WithEmptyGuid_ThrowsDomainException()
    {
        var document = CreateValidDocument();

        Assert.Throws<DomainException>(() => document.AssignToJobApplication(Guid.Empty));
    }

    [Fact]
    public void RemoveFromJobApplication_ClearsJobApplicationId()
    {
        var document = CreateValidDocument(jobApplicationId: Guid.NewGuid());

        document.RemoveFromJobApplication();

        Assert.Null(document.JobApplicationId);
    }

    [Fact]
    public void RemoveFromJobApplication_WhenAlreadyUnassigned_IsANoOpThatStillUpdatesTimestamp()
    {
        var document = CreateValidDocument();
        var originalUpdatedAt = document.UpdatedAt;

        document.RemoveFromJobApplication();

        Assert.Null(document.JobApplicationId);
        Assert.True(document.UpdatedAt >= originalUpdatedAt);
    }
}
