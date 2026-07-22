using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Domain.Entities;
using JobAppTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobAppTracker.Infrastructure.Repositories
{
    public class NoteRepository : BaseRepository<Note>, INoteRepository
    {
        private readonly AppDbContext _appDbContext;

        public NoteRepository(AppDbContext appDbContext)
            : base(appDbContext)
        {
            _appDbContext = appDbContext;
        }

        public async Task<IEnumerable<Note>> GetNotesForJobApp(Guid jobAppId)
        {
            return await _appDbContext.Notes
                .AsNoTracking()
                .Where(n => n.JobAppId == jobAppId)
                .ToListAsync();
        }

        public async Task<IEnumerable<Note>> GetNotesForUser(Guid userId)
        {
            return await _appDbContext.Notes
                .AsNoTracking()
                .Where(n => n.UserId == userId)
                .ToListAsync();
        }
    }
}
