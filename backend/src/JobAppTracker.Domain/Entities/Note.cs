using System;
using JobAppTracker.Domain.Common;

namespace JobAppTracker.Domain.Entities
{
    public class Note
    {
        private const int ContentMaxLength = 2000;

        public Guid Id { get; private set; }
        public string Content { get; private set; } = string.Empty;
        public DateTime CreatedAt { get; private set; }
        public DateTime UpdatedAt { get; private set; }

        /// foreign key to the Users table, indicating which user this note belongs to. A user can have multiple notes, but a note belongs to only one user. This allows users to write multiple notes under their account.
        public Guid UserId { get; private set; }

        // foreign key to the JobApplications table, indicating which job application this note is associated with. A note can optionally be linked to a job application.
        public Guid? JobAppId { get; private set; }

        // Navigation properties
        public User User { get; private set; } = null!;
        public JobApplication? JobApplication { get; private set; }

        // EF Core materialization constructor
        private Note() { }

        public static Note Create(string content, Guid userId, Guid? jobAppId = null)
        {
            Guard.AgainstNullOrWhiteSpace(content, nameof(content));
            Guard.AgainstExceedingLength(content, ContentMaxLength, nameof(content));
            Guard.AgainstEmptyGuid(userId, nameof(userId));
            if (jobAppId is Guid appId)
                Guard.AgainstEmptyGuid(appId, nameof(jobAppId));

            var now = DateTime.UtcNow;

            return new Note
            {
                Id = Guid.NewGuid(),
                Content = content.Trim(),
                UserId = userId,
                JobAppId = jobAppId,
                CreatedAt = now,
                UpdatedAt = now,
            };
        }

        public void UpdateContent(string content)
        {
            Guard.AgainstNullOrWhiteSpace(content, nameof(content));
            Guard.AgainstExceedingLength(content, ContentMaxLength, nameof(content));

            Content = content.Trim();
            UpdatedAt = DateTime.UtcNow;
        }

        public void LinkToJobApplication(Guid jobAppId)
        {
            Guard.AgainstEmptyGuid(jobAppId, nameof(jobAppId));

            JobAppId = jobAppId;
            UpdatedAt = DateTime.UtcNow;
        }

        public void UnlinkFromJobApplication()
        {
            JobAppId = null;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
