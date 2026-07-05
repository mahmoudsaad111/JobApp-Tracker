using System;
using JobAppTracker.Domain.Common;
using JobAppTracker.Domain.Enums;

namespace JobAppTracker.Domain.Entities
{
    public class Interview
    {
        private const int InterviewerNameMaxLength = 100;
        private const int NoteMaxLength = 2000;
        private const int FeedbackMaxLength = 2000;

        public Guid Id { get; private set; }
        public string? InterviewerName { get; private set; }
        public InterviewType InterviewType { get; private set; }
        public DateTime InterviewDate { get; private set; }
        public string? Note { get; private set; } = string.Empty;
        public string? Feedback { get; private set; } = string.Empty;

        public DateTime CreatedAt { get; private set; }
        public DateTime UpdatedAt { get; private set; }

        //foreign key to the JobApplications table, indicating which job application this interview is associated with. A job application can have multiple interviews, but an interview can be associated with only one job application. This allows users to schedule multiple interviews for a single job application if needed.
        public Guid JobAppId { get; private set; }

        // foreign key to the Users table, indicating which user this interview belongs to. A user can have multiple interviews, but an interview belongs to only one user. This allows users to schedule multiple interviews under their account.
        public Guid UserId { get; private set; }

        // Navigation properties
        public User User { get; private set; } = null!;
        public JobApplication JobApplication { get; private set; } = null!;

        // EF Core materialization constructor
        private Interview() { }

        public static Interview Create(
            Guid jobAppId,
            Guid userId,
            InterviewType interviewType,
            DateTime interviewDate,
            string? interviewerName = null,
            string? note = null,
            string? feedback = null
        )
        {
            Guard.AgainstEmptyGuid(jobAppId, nameof(jobAppId));
            Guard.AgainstEmptyGuid(userId, nameof(userId));
            Guard.AgainstInvalidEnum(interviewType, nameof(interviewType));
            Guard.AgainstDefaultDate(interviewDate, nameof(interviewDate));
            Guard.AgainstExceedingLength(
                interviewerName,
                InterviewerNameMaxLength,
                nameof(interviewerName)
            );
            Guard.AgainstExceedingLength(note, NoteMaxLength, nameof(note));
            Guard.AgainstExceedingLength(feedback, FeedbackMaxLength, nameof(feedback));

            var now = DateTime.UtcNow;

            return new Interview
            {
                Id = Guid.NewGuid(),
                JobAppId = jobAppId,
                UserId = userId,
                InterviewType = interviewType,
                InterviewDate = interviewDate,
                InterviewerName = NormalizeOptional(interviewerName),
                Note = note?.Trim() ?? string.Empty,
                Feedback = feedback?.Trim() ?? string.Empty,
                CreatedAt = now,
                UpdatedAt = now,
            };
        }

        public void UpdateDetails(
            InterviewType interviewType,
            DateTime interviewDate,
            string? interviewerName = null,
            string? note = null
        )
        {
            Guard.AgainstInvalidEnum(interviewType, nameof(interviewType));
            Guard.AgainstDefaultDate(interviewDate, nameof(interviewDate));
            Guard.AgainstExceedingLength(
                interviewerName,
                InterviewerNameMaxLength,
                nameof(interviewerName)
            );
            Guard.AgainstExceedingLength(note, NoteMaxLength, nameof(note));

            InterviewType = interviewType;
            InterviewDate = interviewDate;
            InterviewerName = NormalizeOptional(interviewerName);
            Note = note?.Trim() ?? string.Empty;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Reschedule(DateTime newInterviewDate)
        {
            Guard.AgainstDefaultDate(newInterviewDate, nameof(newInterviewDate));

            InterviewDate = newInterviewDate;
            UpdatedAt = DateTime.UtcNow;
        }

        public void AddFeedback(string feedback)
        {
            Guard.AgainstNullOrWhiteSpace(feedback, nameof(feedback));
            Guard.AgainstExceedingLength(feedback, FeedbackMaxLength, nameof(feedback));

            Feedback = feedback.Trim();
            UpdatedAt = DateTime.UtcNow;
        }

        private static string? NormalizeOptional(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
