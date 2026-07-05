using System;
using System.Collections.Generic;
using System.Linq;
using JobAppTracker.Domain.Common;
using JobAppTracker.Domain.Common.Exceptions;
using JobAppTracker.Domain.Enums;

namespace JobAppTracker.Domain.Entities
{
    public class JobApplication
    {
        private const int CompanyNameMaxLength = 255;
        private const int TitleMaxLength = 255;
        private const int LocationMaxLength = 255;
        private const int DescriptionMaxLength = 1000;
        private const int LinkMaxLength = 500;

        private static readonly JobAppStatus[] TerminalStatuses =
        {
            JobAppStatus.Accepted,
            JobAppStatus.Rejected,
            JobAppStatus.Withdrawn,
        };

        public Guid Id { get; private set; }
        public JobAppStatus Status { get; private set; }
        public string CompanyName { get; private set; } = string.Empty;
        public string Title { get; private set; } = string.Empty;
        public string? Location { get; private set; }
        public string? Description { get; private set; }
        public string? Link { get; private set; }
        public JobType Type { get; private set; }
        public WorkMode WorkMode { get; private set; }
        public DateTime AppliedAt { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime UpdatedAt { get; private set; }

        /// foreign key to the Users table, indicating which user this job application belongs to
        public Guid UserId { get; private set; }

        // navigation properties
        public User User { get; private set; } = null!;
        public ICollection<Document> Documents { get; private set; } = new List<Document>();
        public ICollection<Interview> Interviews { get; private set; } = new List<Interview>();
        public ICollection<Note> Notes { get; private set; } = new List<Note>();

        // EF Core materialization constructor
        private JobApplication() { }

        public static JobApplication Create(
            Guid userId,
            string companyName,
            string title,
            DateTime appliedAt,
            string? location = null,
            string? description = null,
            string? link = null,
            JobType type = JobType.FullTime,
            WorkMode workMode = WorkMode.Onsite,
            JobAppStatus status = JobAppStatus.Draft
        )
        {
            Guard.AgainstEmptyGuid(userId, nameof(userId));
            Guard.AgainstNullOrWhiteSpace(companyName, nameof(companyName));
            Guard.AgainstExceedingLength(companyName, CompanyNameMaxLength, nameof(companyName));
            Guard.AgainstNullOrWhiteSpace(title, nameof(title));
            Guard.AgainstExceedingLength(title, TitleMaxLength, nameof(title));
            Guard.AgainstExceedingLength(location, LocationMaxLength, nameof(location));
            Guard.AgainstExceedingLength(description, DescriptionMaxLength, nameof(description));
            Guard.AgainstExceedingLength(link, LinkMaxLength, nameof(link));
            Guard.AgainstInvalidEnum(type, nameof(type));
            Guard.AgainstInvalidEnum(workMode, nameof(workMode));
            Guard.AgainstInvalidEnum(status, nameof(status));
            Guard.AgainstDefaultDate(appliedAt, nameof(appliedAt));
            EnsureValidLink(link);

            var now = DateTime.UtcNow;

            return new JobApplication
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CompanyName = companyName.Trim(),
                Title = title.Trim(),
                Location = NormalizeOptional(location),
                Description = NormalizeOptional(description),
                Link = NormalizeOptional(link),
                Type = type,
                WorkMode = workMode,
                Status = status,
                AppliedAt = appliedAt,
                CreatedAt = now,
                UpdatedAt = now,
            };
        }

        public void UpdateDetails(
            string companyName,
            string title,
            DateTime appliedAt,
            JobType type,
            WorkMode workMode,
            string? location = null,
            string? description = null,
            string? link = null
        )
        {
            Guard.AgainstNullOrWhiteSpace(companyName, nameof(companyName));
            Guard.AgainstExceedingLength(companyName, CompanyNameMaxLength, nameof(companyName));
            Guard.AgainstNullOrWhiteSpace(title, nameof(title));
            Guard.AgainstExceedingLength(title, TitleMaxLength, nameof(title));
            Guard.AgainstExceedingLength(location, LocationMaxLength, nameof(location));
            Guard.AgainstExceedingLength(description, DescriptionMaxLength, nameof(description));
            Guard.AgainstExceedingLength(link, LinkMaxLength, nameof(link));
            Guard.AgainstInvalidEnum(type, nameof(type));
            Guard.AgainstInvalidEnum(workMode, nameof(workMode));
            Guard.AgainstDefaultDate(appliedAt, nameof(appliedAt));
            EnsureValidLink(link);

            CompanyName = companyName.Trim();
            Title = title.Trim();
            Location = NormalizeOptional(location);
            Description = NormalizeOptional(description);
            Link = NormalizeOptional(link);
            Type = type;
            WorkMode = workMode;
            AppliedAt = appliedAt;
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Moves the application to a new status. Idempotent (setting the same
        /// status is a no-op) and refuses to leave a terminal state once reached.
        /// </summary>
        public void ChangeStatus(JobAppStatus newStatus)
        {
            Guard.AgainstInvalidEnum(newStatus, nameof(newStatus));

            if (Status == newStatus)
                return;

            if (TerminalStatuses.Contains(Status))
                throw new DomainException(
                    $"Cannot change status from '{Status}' because it is a terminal state."
                );

            Status = newStatus;
            UpdatedAt = DateTime.UtcNow;
        }

        public void AddDocument(Document document)
        {
            ArgumentNullException.ThrowIfNull(document);
            if (document.UserId != UserId)
                throw new DomainException("Document belongs to a different user.");

            Documents.Add(document);
            UpdatedAt = DateTime.UtcNow;
        }

        public void AddInterview(Interview interview)
        {
            ArgumentNullException.ThrowIfNull(interview);
            if (interview.UserId != UserId)
                throw new DomainException("Interview belongs to a different user.");

            Interviews.Add(interview);
            UpdatedAt = DateTime.UtcNow;
        }

        public void AddNote(Note note)
        {
            ArgumentNullException.ThrowIfNull(note);
            if (note.UserId != UserId)
                throw new DomainException("Note belongs to a different user.");

            Notes.Add(note);
            UpdatedAt = DateTime.UtcNow;
        }

        private static void EnsureValidLink(string? link)
        {
            if (string.IsNullOrWhiteSpace(link))
                return;

            if (!Uri.TryCreate(link, UriKind.Absolute, out _))
                throw new DomainException("Link must be a valid absolute URL.");
        }

        private static string? NormalizeOptional(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
