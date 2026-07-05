using System;
using JobAppTracker.Domain.Common;
using JobAppTracker.Domain.Enums;

namespace JobAppTracker.Domain.Entities
{
    public class Document
    {
        private const int FileNameMaxLength = 255;
        private const int FilePathMaxLength = 500;

        public Guid Id { get; private set; }
        public string FileName { get; private set; } = string.Empty;
        public string FilePath { get; private set; } = string.Empty;
        public long FileSize { get; private set; }
        public DocumentType Type { get; private set; }
        public ContentType ContentType { get; private set; }

        public DateTime CreatedAt { get; private set; }
        public DateTime UpdatedAt { get; private set; }

        // foreign key to the JobApplications table, indicating which job application this document is associated with. A document can be associated with one job application, but a job application can have multiple documents. This allows users to upload multiple documents (like resumes, cover letters, etc.) for each job application.
        public Guid? JobApplicationId { get; private set; }

        // foreign key to the Users table, indicating which user this document belongs to. A user can have multiple documents, but a document belongs to only one user. This allows users to upload multiple documents under their account.
        public Guid UserId { get; private set; }

        // Navigation properties
        public User User { get; private set; } = null!;
        public JobApplication? JobApplication { get; private set; }

        // EF Core materialization constructor
        private Document() { }

        public static Document Create(
            string fileName,
            string filePath,
            long fileSize,
            DocumentType type,
            ContentType contentType,
            Guid userId,
            Guid? jobApplicationId = null
        )
        {
            Guard.AgainstNullOrWhiteSpace(fileName, nameof(fileName));
            Guard.AgainstExceedingLength(fileName, FileNameMaxLength, nameof(fileName));
            Guard.AgainstNullOrWhiteSpace(filePath, nameof(filePath));
            Guard.AgainstExceedingLength(filePath, FilePathMaxLength, nameof(filePath));
            Guard.AgainstNegativeOrZero(fileSize, nameof(fileSize));
            Guard.AgainstInvalidEnum(type, nameof(type));
            Guard.AgainstInvalidEnum(contentType, nameof(contentType));
            Guard.AgainstEmptyGuid(userId, nameof(userId));
            if (jobApplicationId is Guid appId)
                Guard.AgainstEmptyGuid(appId, nameof(jobApplicationId));

            var now = DateTime.UtcNow;

            return new Document
            {
                Id = Guid.NewGuid(),
                FileName = fileName.Trim(),
                FilePath = filePath.Trim(),
                FileSize = fileSize,
                Type = type,
                ContentType = contentType,
                UserId = userId,
                JobApplicationId = jobApplicationId,
                CreatedAt = now,
                UpdatedAt = now,
            };
        }

        public void Rename(string newFileName)
        {
            Guard.AgainstNullOrWhiteSpace(newFileName, nameof(newFileName));
            Guard.AgainstExceedingLength(newFileName, FileNameMaxLength, nameof(newFileName));

            FileName = newFileName.Trim();
            UpdatedAt = DateTime.UtcNow;
        }

        public void Reclassify(DocumentType type)
        {
            Guard.AgainstInvalidEnum(type, nameof(type));

            Type = type;
            UpdatedAt = DateTime.UtcNow;
        }

        public void AssignToJobApplication(Guid jobApplicationId)
        {
            Guard.AgainstEmptyGuid(jobApplicationId, nameof(jobApplicationId));

            JobApplicationId = jobApplicationId;
            UpdatedAt = DateTime.UtcNow;
        }

        public void RemoveFromJobApplication()
        {
            JobApplicationId = null;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
