using System;
using System.Collections.Generic;
using JobAppTracker.Domain.Common;
using JobAppTracker.Domain.Enums;
using JobAppTracker.Domain.ValueObjects;
using Microsoft.AspNetCore.Identity;

namespace JobAppTracker.Domain.Entities
{
    public class User : IdentityUser<Guid>
    {
        private const int NameMaxLength = 50;
        private const int JobTitleMaxLength = 100;
        private const int CompanyMaxLength = 100;

        public string FirstName { get; private set; } = string.Empty;
        public string LastName { get; private set; } = string.Empty;
        public DateTime? DateOfBirth { get; private set; }
        public Gender? Gender { get; private set; }
        public Location? Location { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }
        public string? CurrentJobTitle { get; private set; }
        public int? YearsOfExperience { get; private set; }
        public string? CurrentCompany { get; private set; }

        // navigation properties
        public ICollection<JobApplication> JobApplications { get; private set; } =
            new List<JobApplication>();
        public ICollection<Note> Notes { get; private set; } = new List<Note>();
        public ICollection<Document> Documents { get; private set; } = new List<Document>();
        public ICollection<Interview> Interviews { get; private set; } = new List<Interview>();

        // Identity's UserStore / SignInManager create instances via
        // Activator.CreateInstance<TUser>() in some flows, so this must stay
        // public and parameterless.
        public User()
        {
            CreatedAt = DateTime.UtcNow;
        }

        public static User Create(
            string email,
            string firstName,
            string lastName,
            DateTime? dateOfBirth = null,
            Gender? gender = null,
            Location? location = null,
            string? currentJobTitle = null,
            int? yearsOfExperience = null,
            string? currentCompany = null
        )
        {
            Guard.AgainstNullOrWhiteSpace(email, nameof(email));
            Guard.AgainstNullOrWhiteSpace(firstName, nameof(firstName));
            Guard.AgainstExceedingLength(firstName, NameMaxLength, nameof(firstName));
            Guard.AgainstNullOrWhiteSpace(lastName, nameof(lastName));
            Guard.AgainstExceedingLength(lastName, NameMaxLength, nameof(lastName));
            Guard.AgainstExceedingLength(currentJobTitle, JobTitleMaxLength, nameof(currentJobTitle));
            Guard.AgainstExceedingLength(currentCompany, CompanyMaxLength, nameof(currentCompany));
            if (gender is Enums.Gender g)
                Guard.AgainstInvalidEnum(g, nameof(gender));
            if (dateOfBirth is DateTime dob)
                Guard.AgainstFutureDate(dob, nameof(dateOfBirth));
            if (yearsOfExperience is int years)
                Guard.AgainstNegative(years, nameof(yearsOfExperience));

            return new User
            {
                Email = email.Trim(),
                UserName = email.Trim(),
                FirstName = firstName.Trim(),
                LastName = lastName.Trim(),
                DateOfBirth = dateOfBirth,
                Gender = gender,
                Location = location,
                CurrentJobTitle = NormalizeOptional(currentJobTitle),
                YearsOfExperience = yearsOfExperience,
                CurrentCompany = NormalizeOptional(currentCompany),
                CreatedAt = DateTime.UtcNow,
            };
        }

        public void UpdateProfile(
            string firstName,
            string lastName,
            DateTime? dateOfBirth = null,
            Gender? gender = null,
            Location? location = null,
            string? currentJobTitle = null,
            int? yearsOfExperience = null,
            string? currentCompany = null
        )
        {
            Guard.AgainstNullOrWhiteSpace(firstName, nameof(firstName));
            Guard.AgainstExceedingLength(firstName, NameMaxLength, nameof(firstName));
            Guard.AgainstNullOrWhiteSpace(lastName, nameof(lastName));
            Guard.AgainstExceedingLength(lastName, NameMaxLength, nameof(lastName));
            Guard.AgainstExceedingLength(currentJobTitle, JobTitleMaxLength, nameof(currentJobTitle));
            Guard.AgainstExceedingLength(currentCompany, CompanyMaxLength, nameof(currentCompany));
            if (gender is Enums.Gender g)
                Guard.AgainstInvalidEnum(g, nameof(gender));
            if (dateOfBirth is DateTime dob)
                Guard.AgainstFutureDate(dob, nameof(dateOfBirth));
            if (yearsOfExperience is int years)
                Guard.AgainstNegative(years, nameof(yearsOfExperience));

            FirstName = firstName.Trim();
            LastName = lastName.Trim();
            DateOfBirth = dateOfBirth;
            Gender = gender;
            Location = location;
            CurrentJobTitle = NormalizeOptional(currentJobTitle);
            YearsOfExperience = yearsOfExperience;
            CurrentCompany = NormalizeOptional(currentCompany);
            UpdatedAt = DateTime.UtcNow;
        }

        private static string? NormalizeOptional(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
