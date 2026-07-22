using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Domain.Entities;
using JobAppTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobAppTracker.Infrastructure.Repositories
{
    public class InterviewRepository : BaseRepository<Interview>, IInterviewRepository
    {
        private readonly AppDbContext _appDbContext;

        public InterviewRepository(AppDbContext Context)
            : base(Context)
        {
            _appDbContext = Context;
        }

        public async Task<IEnumerable<Interview>> GetInterviewsForUserAsync(Guid userId)
        {
            return await _appDbContext.Interviews
                .AsNoTracking()
                .Where(i => i.UserId == userId)
                .Include(i => i.JobApplication)
                .ToListAsync();
        }

        public async Task<IEnumerable<Interview>> GetInterviewsForJobAppAsync(Guid jobAppId)
        {
            return await _appDbContext.Interviews
                .AsNoTracking()
                .Where(i => i.JobAppId == jobAppId)
                .ToListAsync();
        }
    }
}
