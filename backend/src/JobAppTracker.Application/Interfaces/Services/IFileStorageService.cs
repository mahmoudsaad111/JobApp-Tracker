using Microsoft.AspNetCore.Http;

namespace JobAppTracker.Application.Interfaces.Services
{
    public interface IFileStorageService
    {
        /// <summary>Validates and saves the file, returns the stored logical path.</summary>
        Task<string> SaveAsync(IFormFile file, string folder);

        /// <summary>Resolves a stored logical path to a safe absolute path on disk.</summary>
        string GetPhysicalPath(string filePath);

        /// <summary>Deletes the file at the given stored path.</summary>
        Task DeleteAsync(string filePath);
    }
}
