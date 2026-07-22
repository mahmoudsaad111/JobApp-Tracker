using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Domain.Entities;
using JobAppTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobAppTracker.Infrastructure.Repositories
{
    public class JobAppRepository : BaseRepository<JobApplication>, IJobAppRepository
    {
        private readonly AppDbContext _appDbContext;

        public JobAppRepository(AppDbContext Context)
            : base(Context)
        {
            _appDbContext = Context;
        }

        public IQueryable<JobApplication> GetJobAppsForUser(Guid UserId)
        {
            return _appDbContext.JobApplications.Where(j => j.UserId == UserId);
        }

        public override async Task<JobApplication> GetByIdAsync(Guid id)
        {
            var result = await _appDbContext.JobApplications
                .Include(j => j.Interviews)
                .Include(j => j.Notes)
                .Include(j => j.Documents)
                .AsSplitQuery()
                .FirstOrDefaultAsync(j => j.Id == id);
            return result!;
        }
    }
}
