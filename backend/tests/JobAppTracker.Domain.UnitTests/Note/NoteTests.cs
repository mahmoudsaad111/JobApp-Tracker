using System;
using JobAppTracker.Domain.Common.Exceptions;
using NoteEntity = JobAppTracker.Domain.Entities.Note;

namespace JobAppTracker.Domain.UnitTests.Note;

public class NoteTests
{
    private static readonly Guid ValidUserId = Guid.NewGuid();
    private static readonly Guid ValidJobAppId = Guid.NewGuid();

    private static NoteEntity CreateValidNote(
        string? content = "Initial note content",
        Guid? userId = null,
        Guid? jobAppId = null
    )
    {
        return NoteEntity.Create(
            content ?? string.Empty,
            userId ?? ValidUserId,
            jobAppId
        );
    }

    [Fact]
    public void Create_WithValidData_ReturnsNoteWithExpectedValues()
    {
        var note = CreateValidNote(jobAppId: ValidJobAppId);

        Assert.NotEqual(Guid.Empty, note.Id);
        Assert.Equal("Initial note content", note.Content);
        Assert.Equal(ValidUserId, note.UserId);
        Assert.Equal(ValidJobAppId, note.JobAppId);
    }

    [Fact]
    public void Create_SetsCreatedAtAndUpdatedAtToTheSameUtcTimestamp()
    {
        var before = DateTime.UtcNow;

        var note = CreateValidNote();

        var after = DateTime.UtcNow;

        Assert.Equal(note.CreatedAt, note.UpdatedAt);
        Assert.InRange(note.CreatedAt, before, after);
    }

    [Fact]
    public void Create_TrimsContent()
    {
        var note = CreateValidNote(content: "  Initial note content  ");

        Assert.Equal("Initial note content", note.Content);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithInvalidContent_ThrowsDomainException(string? invalidContent)
    {
        Assert.Throws<DomainException>(() => CreateValidNote(content: invalidContent!));
    }

    [Fact]
    public void Create_WithContentExceedingMaxLength_ThrowsDomainException()
    {
        var tooLongContent = new string('a', 2001);

        Assert.Throws<DomainException>(() => CreateValidNote(content: tooLongContent));
    }

    [Fact]
    public void Create_WithEmptyUserId_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => CreateValidNote(userId: Guid.Empty));
    }

    [Fact]
    public void Create_WithEmptyJobApplicationId_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => CreateValidNote(jobAppId: Guid.Empty));
    }

    [Fact]
    public void UpdateContent_WithValidData_UpdatesContentAndTimestamp()
    {
        var note = CreateValidNote();
        var originalUpdatedAt = note.UpdatedAt;

        note.UpdateContent("Updated content");

        Assert.Equal("Updated content", note.Content);
        Assert.True(note.UpdatedAt >= originalUpdatedAt);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void UpdateContent_WithInvalidContent_ThrowsDomainException(string? invalidContent)
    {
        var note = CreateValidNote();

        Assert.Throws<DomainException>(() => note.UpdateContent(invalidContent!));
    }

    [Fact]
    public void UpdateContent_WithContentExceedingMaxLength_ThrowsDomainException()
    {
        var note = CreateValidNote();
        var tooLongContent = new string('a', 2001);

        Assert.Throws<DomainException>(() => note.UpdateContent(tooLongContent));
    }

    [Fact]
    public void LinkToJobApplication_WithValidJobAppId_SetsJobAppIdAndTimestamp()
    {
        var note = CreateValidNote();
        var originalUpdatedAt = note.UpdatedAt;

        note.LinkToJobApplication(ValidJobAppId);

        Assert.Equal(ValidJobAppId, note.JobAppId);
        Assert.True(note.UpdatedAt >= originalUpdatedAt);
    }

    [Fact]
    public void LinkToJobApplication_WithEmptyJobAppId_ThrowsDomainException()
    {
        var note = CreateValidNote();

        Assert.Throws<DomainException>(() => note.LinkToJobApplication(Guid.Empty));
    }

    [Fact]
    public void UnlinkFromJobApplication_ClearsJobAppIdAndUpdatesTimestamp()
    {
        var note = CreateValidNote(jobAppId: ValidJobAppId);
        var originalUpdatedAt = note.UpdatedAt;

        note.UnlinkFromJobApplication();

        Assert.Null(note.JobAppId);
        Assert.True(note.UpdatedAt >= originalUpdatedAt);
    }
}
