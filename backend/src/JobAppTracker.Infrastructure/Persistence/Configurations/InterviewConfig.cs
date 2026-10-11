using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JobAppTracker.Infrastructure.Persistence.Configurations
{
    public class InterviewConfig : IEntityTypeConfiguration<Interview>
    {
        public void Configure(EntityTypeBuilder<Interview> builder)
        {
            builder.ToTable("Interviews");
            builder.HasKey(i => i.Id);
            builder.Property(i => i.InterviewerName).HasMaxLength(100);

            // Relationships
            builder
                .HasOne(i => i.User)
                .WithMany(u => u.Interviews)
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.NoAction);
            builder
                .HasOne(i => i.JobApplication)
                .WithMany(j => j.Interviews)
                .HasForeignKey(i => i.JobAppId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
