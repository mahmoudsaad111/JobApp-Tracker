using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;

namespace JobAppTracker.Infrastructure.Repositories
{
    public class BaseRepository<T> : IBaseRepository<T>
        where T : class
    {
        private readonly AppDbContext _appDbContext;
        private readonly DbSet<T> _dbSet;

        public BaseRepository(AppDbContext Context)
        {
            _appDbContext = Context;
            _dbSet = _appDbContext.Set<T>();
        }

        public async Task<T> AddAsync(T entity)
        {
            await _dbSet.AddAsync(entity);
            return entity;
        }


        public async Task<List<T>> GetAllAsync()
        {
            List<T> entities = await _dbSet.AsNoTracking().ToListAsync();
            return entities;
        }

        public virtual async Task<T> GetByIdAsync(Guid id)
        {
            return await _dbSet.FirstOrDefaultAsync(e => EF.Property<Guid>(e, "Id") == id);
        }


        public void Delete(T entity)
        {
            _dbSet.Remove(entity);
        }

        public async Task SaveChangesAsync()
        {
            await _appDbContext.SaveChangesAsync();
        }

        public T Update(T entity)
        {
            return _dbSet.Update(entity).Entity;
        }
    }
}
