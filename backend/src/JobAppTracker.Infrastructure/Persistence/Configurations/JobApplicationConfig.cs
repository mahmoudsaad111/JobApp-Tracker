using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using JobAppTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace JobAppTracker.Infrastructure.Persistence.Configurations
{
    public class JobApplicationConfig : IEntityTypeConfiguration<JobApplication>
    {
        public void Configure(EntityTypeBuilder<JobApplication> builder)
        {
            builder.ToTable("JobApplications");
            builder.HasKey(j => j.Id);
            builder.Property(j => j.CompanyName).HasMaxLength(255);
            builder.Property(j => j.Title).HasMaxLength(255);
            builder.Property(j => j.Description).HasMaxLength(1000);
            builder.Property(j => j.Link).HasMaxLength(500);
            builder.Property(j => j.Type).HasMaxLength(100);
            builder.Property(j => j.Status).IsRequired();

            // Relationships
            builder
                .HasOne(j => j.User)
                .WithMany(u => u.JobApplications)
                .HasForeignKey(j => j.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Property<List<string>>("_requiredSkills")
       .HasColumnName("RequiredSkills")
       .HasConversion(
           v => JsonSerializer.Serialize(v ?? new List<string>(), (JsonSerializerOptions?)null),
           v => string.IsNullOrWhiteSpace(v) 
               ? new List<string>() 
               : JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) 
                 ?? new List<string>()
       )
                  .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                        (a, b) => a!.SequenceEqual(b!),
                        a => a.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
                        a => a.ToList()
                        ));
        }
    }
}
