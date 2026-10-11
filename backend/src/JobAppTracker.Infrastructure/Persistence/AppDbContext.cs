using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Common.Interfaces;
using JobAppTracker.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace JobAppTracker.Infrastructure.Data
{
    public class AppDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
    {
        private readonly ICurrentUserService _currentUser;
        public AppDbContext(DbContextOptions<AppDbContext> options,ICurrentUserService currentUser) 
            : base(options) {_currentUser = currentUser; }

        public DbSet<JobApplication> JobApplications { get; set; }
        public DbSet<Note> Notes { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<Interview> Interviews { get; set; }

        private Guid? CurrentUserId => _currentUser.UserIdOrNull;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
            ApplyOwnershipFilters(modelBuilder);
        }
        private void ApplyOwnershipFilters(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<JobApplication>().HasQueryFilter(x => x.UserId == CurrentUserId);
            modelBuilder.Entity<Interview>().HasQueryFilter(x => x.UserId == CurrentUserId);
            modelBuilder.Entity<Note>().HasQueryFilter(x => x.UserId == CurrentUserId);
            modelBuilder.Entity<Document>().HasQueryFilter(x => x.UserId == CurrentUserId);
        }
    }
}
