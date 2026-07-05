using System;
using JobAppTracker.Domain.Common.Exceptions;
using JobAppTracker.Domain.Enums;
using InterviewEntity = JobAppTracker.Domain.Entities.Interview;

namespace JobAppTracker.Domain.UnitTests.Interview;

public class InterviewTests
{
    private static readonly Guid ValidJobAppId = Guid.NewGuid();
    private static readonly Guid ValidUserId = Guid.NewGuid();
    private static readonly DateTime ValidInterviewDate = new DateTime(2025, 12, 1, 14, 0, 0, DateTimeKind.Utc);

    private static InterviewEntity CreateValidInterview(
        Guid? jobAppId = null,
        Guid? userId = null,
        InterviewType interviewType = InterviewType.Phone,
        DateTime? interviewDate = null,
        string? interviewerName = "Alice Smith",
        string? note = "Discussed role expectations",
        string? feedback = "Strong communication skills"
    )
    {
        return InterviewEntity.Create(
            jobAppId ?? ValidJobAppId,
            userId ?? ValidUserId,
            interviewType,
            interviewDate ?? ValidInterviewDate,
            interviewerName,
            note,
            feedback
        );
    }

    [Fact]
    public void Create_WithValidData_ReturnsInterviewWithExpectedValues()
    {
        var interview = CreateValidInterview();

        Assert.NotEqual(Guid.Empty, interview.Id);
        Assert.Equal(ValidJobAppId, interview.JobAppId);
        Assert.Equal(ValidUserId, interview.UserId);
        Assert.Equal(InterviewType.Phone, interview.InterviewType);
        Assert.Equal(ValidInterviewDate, interview.InterviewDate);
        Assert.Equal("Alice Smith", interview.InterviewerName);
        Assert.Equal("Discussed role expectations", interview.Note);
        Assert.Equal("Strong communication skills", interview.Feedback);
    }

    [Fact]
    public void Create_SetsCreatedAtAndUpdatedAtToTheSameUtcTimestamp()
    {
        var before = DateTime.UtcNow;

        var interview = CreateValidInterview();

        var after = DateTime.UtcNow;

        Assert.Equal(interview.CreatedAt, interview.UpdatedAt);
        Assert.InRange(interview.CreatedAt, before, after);
    }

    [Fact]
    public void Create_TrimsOptionalValuesAndNormalizesMissingText()
    {
        var interview = CreateValidInterview(
            interviewerName: "  Alice Smith  ",
            note: "  Discussed role expectations  ",
            feedback: "  Strong communication skills  "
        );

        Assert.Equal("Alice Smith", interview.InterviewerName);
        Assert.Equal("Discussed role expectations", interview.Note);
        Assert.Equal("Strong communication skills", interview.Feedback);
    }

    [Fact]
    public void Create_WithEmptyJobAppId_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => CreateValidInterview(jobAppId: Guid.Empty));
    }

    [Fact]
    public void Create_WithEmptyUserId_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => CreateValidInterview(userId: Guid.Empty));
    }

    [Fact]
    public void Create_WithInvalidInterviewType_ThrowsDomainException()
    {
        var invalidType = (InterviewType)999;

        Assert.Throws<DomainException>(() => CreateValidInterview(interviewType: invalidType));
    }

    [Fact]
    public void Create_WithDefaultInterviewDate_ThrowsDomainException()
    {
        var defaultInterviewDate = default(DateTime);

        Assert.Throws<DomainException>(() => CreateValidInterview(interviewDate: defaultInterviewDate));
    }

    [Fact]
    public void Create_WithInterviewerNameExceedingMaxLength_ThrowsDomainException()
    {
        var tooLongName = new string('a', 101);

        Assert.Throws<DomainException>(() => CreateValidInterview(interviewerName: tooLongName));
    }

    [Fact]
    public void Create_WithNoteExceedingMaxLength_ThrowsDomainException()
    {
        var tooLongNote = new string('a', 2001);

        Assert.Throws<DomainException>(() => CreateValidInterview(note: tooLongNote));
    }

    [Fact]
    public void Create_WithFeedbackExceedingMaxLength_ThrowsDomainException()
    {
        var tooLongFeedback = new string('a', 2001);

        Assert.Throws<DomainException>(() => CreateValidInterview(feedback: tooLongFeedback));
    }

    [Fact]
    public void UpdateDetails_WithValidData_UpdatesPropertiesAndTimestamp()
    {
        var interview = CreateValidInterview();
        var originalUpdatedAt = interview.UpdatedAt;
        var newDate = new DateTime(2025, 12, 15, 10, 0, 0, DateTimeKind.Utc);

        interview.UpdateDetails(InterviewType.Video, newDate, "Bob Jones", "Updated note");

        Assert.Equal(InterviewType.Video, interview.InterviewType);
        Assert.Equal(newDate, interview.InterviewDate);
        Assert.Equal("Bob Jones", interview.InterviewerName);
        Assert.Equal("Updated note", interview.Note);
        Assert.True(interview.UpdatedAt >= originalUpdatedAt);
    }

    [Fact]
    public void UpdateDetails_TrimsOptionalValuesAndNormalizesMissingText()
    {
        var interview = CreateValidInterview();

        interview.UpdateDetails(InterviewType.Video, ValidInterviewDate, "  ", "  ");

        Assert.Null(interview.InterviewerName);
        Assert.Equal(string.Empty, interview.Note);
    }

    [Fact]
    public void UpdateDetails_WithInvalidInterviewType_ThrowsDomainException()
    {
        var interview = CreateValidInterview();
        var invalidType = (InterviewType)999;

        Assert.Throws<DomainException>(() => interview.UpdateDetails(invalidType, ValidInterviewDate));
    }

    [Fact]
    public void UpdateDetails_WithDefaultInterviewDate_ThrowsDomainException()
    {
        var interview = CreateValidInterview();

        Assert.Throws<DomainException>(() => interview.UpdateDetails(InterviewType.Video, default));
    }

    [Fact]
    public void Reschedule_WithValidDate_UpdatesInterviewDateAndTimestamp()
    {
        var interview = CreateValidInterview();
        var originalUpdatedAt = interview.UpdatedAt;
        var newDate = new DateTime(2025, 12, 25, 09, 0, 0, DateTimeKind.Utc);

        interview.Reschedule(newDate);

        Assert.Equal(newDate, interview.InterviewDate);
        Assert.True(interview.UpdatedAt >= originalUpdatedAt);
    }

    [Fact]
    public void Reschedule_WithDefaultDate_ThrowsDomainException()
    {
        var interview = CreateValidInterview();

        Assert.Throws<DomainException>(() => interview.Reschedule(default));
    }

    [Fact]
    public void AddFeedback_WithValidFeedback_UpdatesFeedbackAndTimestamp()
    {
        var interview = CreateValidInterview();
        var originalUpdatedAt = interview.UpdatedAt;

        interview.AddFeedback("Excellent problem solving.");

        Assert.Equal("Excellent problem solving.", interview.Feedback);
        Assert.True(interview.UpdatedAt >= originalUpdatedAt);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void AddFeedback_WithNullOrWhitespaceFeedback_ThrowsDomainException(string? feedback)
    {
        var interview = CreateValidInterview();

        Assert.Throws<DomainException>(() => interview.AddFeedback(feedback!));
    }

    [Fact]
    public void AddFeedback_WithFeedbackExceedingMaxLength_ThrowsDomainException()
    {
        var interview = CreateValidInterview();
        var tooLongFeedback = new string('a', 2001);

        Assert.Throws<DomainException>(() => interview.AddFeedback(tooLongFeedback));
    }
}
