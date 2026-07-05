using System;
using JobAppTracker.Domain.Common.Exceptions;
using JobAppTracker.Domain.Enums;
using DocumentEntity = JobAppTracker.Domain.Entities.Document;
using InterviewEntity = JobAppTracker.Domain.Entities.Interview;
using JobApplicationEntity = JobAppTracker.Domain.Entities.JobApplication;
using NoteEntity = JobAppTracker.Domain.Entities.Note;

namespace JobAppTracker.Domain.UnitTests.JobApplication;

public class JobApplicationTests
{
    private static readonly Guid ValidUserId = Guid.NewGuid();
    private static readonly DateTime ValidAppliedAt = new DateTime(2025, 11, 1, 12, 0, 0, DateTimeKind.Utc);

    private static JobApplicationEntity CreateValidJobApplication(
        string? companyName = "Contoso",
        string? title = "Software Engineer",
        DateTime? appliedAt = null,
        string? location = "Seattle",
        string? description = "Great opportunity",
        string? link = "https://example.com",
        JobType type = JobType.FullTime,
        WorkMode workMode = WorkMode.Onsite,
        JobAppStatus status = JobAppStatus.Draft
    )
    {
        return JobApplicationEntity.Create(
            ValidUserId,
            companyName ?? string.Empty,
            title ?? string.Empty,
            appliedAt ?? ValidAppliedAt,
            location,
            description,
            link,
            type,
            workMode,
            status
        );
    }

    private static DocumentEntity CreateValidDocument(Guid? userId = null) =>
        DocumentEntity.Create("Resume.pdf", "/uploads/resume.pdf", 1024, JobAppTracker.Domain.Enums.DocumentType.Resume, JobAppTracker.Domain.Enums.ContentType.PDF, userId ?? ValidUserId);

    private static InterviewEntity CreateValidInterview(Guid? userId = null) =>
        InterviewEntity.Create(userId ?? ValidUserId, userId ?? ValidUserId, InterviewType.Phone, ValidAppliedAt);

    private static NoteEntity CreateValidNote(Guid? userId = null) =>
        NoteEntity.Create("Interview prep note", userId ?? ValidUserId);

    [Fact]
    public void Create_WithValidData_ReturnsJobApplicationWithExpectedValues()
    {
        var application = CreateValidJobApplication();

        Assert.NotEqual(Guid.Empty, application.Id);
        Assert.Equal(ValidUserId, application.UserId);
        Assert.Equal("Contoso", application.CompanyName);
        Assert.Equal("Software Engineer", application.Title);
        Assert.Equal("Seattle", application.Location);
        Assert.Equal("Great opportunity", application.Description);
        Assert.Equal("https://example.com", application.Link);
        Assert.Equal(JobType.FullTime, application.Type);
        Assert.Equal(WorkMode.Onsite, application.WorkMode);
        Assert.Equal(JobAppStatus.Draft, application.Status);
    }

    [Fact]
    public void Create_SetsCreatedAtAndUpdatedAtToTheSameUtcTimestamp()
    {
        var before = DateTime.UtcNow;

        var application = CreateValidJobApplication();

        var after = DateTime.UtcNow;

        Assert.Equal(application.CreatedAt, application.UpdatedAt);
        Assert.InRange(application.CreatedAt, before, after);
    }

    [Fact]
    public void Create_TrimsOptionalValues()
    {
        var application = CreateValidJobApplication(
            companyName: "  Contoso  ",
            title: "  Software Engineer  ",
            location: "  Seattle  ",
            description: "  Great opportunity  ",
            link: "  https://example.com  "
        );

        Assert.Equal("Contoso", application.CompanyName);
        Assert.Equal("Software Engineer", application.Title);
        Assert.Equal("Seattle", application.Location);
        Assert.Equal("Great opportunity", application.Description);
        Assert.Equal("https://example.com", application.Link);
    }

    [Fact]
    public void Create_WithEmptyUserId_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => JobApplicationEntity.Create(Guid.Empty, "Contoso", "Software Engineer", ValidAppliedAt));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithInvalidCompanyName_ThrowsDomainException(string? invalidName)
    {
        Assert.Throws<DomainException>(() => JobApplicationEntity.Create(ValidUserId, invalidName!, "Software Engineer", ValidAppliedAt));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithInvalidTitle_ThrowsDomainException(string? invalidTitle)
    {
        Assert.Throws<DomainException>(() => JobApplicationEntity.Create(ValidUserId, "Contoso", invalidTitle!, ValidAppliedAt));
    }

    [Fact]
    public void Create_WithInvalidLink_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => CreateValidJobApplication(link: "not-a-url"));
    }

    [Fact]
    public void Create_WithDefaultAppliedDate_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => JobApplicationEntity.Create(ValidUserId, "Contoso", "Software Engineer", default));
    }

    [Fact]
    public void UpdateDetails_WithValidData_UpdatesValuesAndTimestamp()
    {
        var application = CreateValidJobApplication();
        var originalUpdatedAt = application.UpdatedAt;
        var newAppliedAt = new DateTime(2025, 12, 1, 08, 0, 0, DateTimeKind.Utc);

        application.UpdateDetails(
            "Fabrikam",
            "Senior Engineer",
            newAppliedAt,
            JobType.Contract,
            WorkMode.Remote,
            "Redmond",
            "Updated description",
            "https://example.org"
        );

        Assert.Equal("Fabrikam", application.CompanyName);
        Assert.Equal("Senior Engineer", application.Title);
        Assert.Equal(newAppliedAt, application.AppliedAt);
        Assert.Equal(JobType.Contract, application.Type);
        Assert.Equal(WorkMode.Remote, application.WorkMode);
        Assert.Equal("Redmond", application.Location);
        Assert.Equal("Updated description", application.Description);
        Assert.Equal("https://example.org", application.Link);
        Assert.True(application.UpdatedAt >= originalUpdatedAt);
    }

    [Fact]
    public void ChangeStatus_WithValidTransition_UpdatesStatusAndTimestamp()
    {
        var application = CreateValidJobApplication(status: JobAppStatus.Submitted);
        var originalUpdatedAt = application.UpdatedAt;

        application.ChangeStatus(JobAppStatus.UnderReview);

        Assert.Equal(JobAppStatus.UnderReview, application.Status);
        Assert.True(application.UpdatedAt >= originalUpdatedAt);
    }

    [Fact]
    public void ChangeStatus_ToSameStatus_IsNoOp()
    {
        var application = CreateValidJobApplication(status: JobAppStatus.Submitted);
        var originalUpdatedAt = application.UpdatedAt;

        application.ChangeStatus(JobAppStatus.Submitted);

        Assert.Equal(JobAppStatus.Submitted, application.Status);
        Assert.Equal(originalUpdatedAt, application.UpdatedAt);
    }

    [Fact]
    public void ChangeStatus_FromTerminalState_ThrowsDomainException()
    {
        var application = CreateValidJobApplication(status: JobAppStatus.Accepted);

        Assert.Throws<DomainException>(() => application.ChangeStatus(JobAppStatus.Rejected));
    }

    [Fact]
    public void AddDocument_WithSameUserId_AddsDocument()
    {
        var application = CreateValidJobApplication();
        var document = CreateValidDocument();
        var originalUpdatedAt = application.UpdatedAt;

        application.AddDocument(document);

        Assert.Contains(document, application.Documents);
        Assert.True(application.UpdatedAt >= originalUpdatedAt);
    }

    [Fact]
    public void AddDocument_WithDifferentUserId_ThrowsDomainException()
    {
        var application = CreateValidJobApplication();
        var document = CreateValidDocument(Guid.NewGuid());

        Assert.Throws<DomainException>(() => application.AddDocument(document));
    }

    [Fact]
    public void AddInterview_WithSameUserId_AddsInterview()
    {
        var application = CreateValidJobApplication();
        var interview = CreateValidInterview();
        var originalUpdatedAt = application.UpdatedAt;

        application.AddInterview(interview);

        Assert.Contains(interview, application.Interviews);
        Assert.True(application.UpdatedAt >= originalUpdatedAt);
    }

    [Fact]
    public void AddInterview_WithDifferentUserId_ThrowsDomainException()
    {
        var application = CreateValidJobApplication();
        var interview = CreateValidInterview(Guid.NewGuid());

        Assert.Throws<DomainException>(() => application.AddInterview(interview));
    }

    [Fact]
    public void AddNote_WithSameUserId_AddsNote()
    {
        var application = CreateValidJobApplication();
        var note = CreateValidNote();
        var originalUpdatedAt = application.UpdatedAt;

        application.AddNote(note);

        Assert.Contains(note, application.Notes);
        Assert.True(application.UpdatedAt >= originalUpdatedAt);
    }

    [Fact]
    public void AddNote_WithDifferentUserId_ThrowsDomainException()
    {
        var application = CreateValidJobApplication();
        var note = CreateValidNote(Guid.NewGuid());

        Assert.Throws<DomainException>(() => application.AddNote(note));
    }
}
