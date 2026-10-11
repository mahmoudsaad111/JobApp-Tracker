using JobAppTracker.Application.Interfaces.Services;
using JobAppTracker.Domain.Common.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace JobAppTracker.Infrastructure.Services.FileStorage
{
    /// <summary>
    /// Stores uploads on disk OUTSIDE wwwroot, so the static-file middleware can never
    /// serve them. Files are only reachable through an authenticated, ownership-checked endpoint.
    /// The value stored in the database stays the logical path "/uploads/{folder}/{file}".
    /// </summary>
    public class LocalFileStorageService : IFileStorageService
    {
        private const string LogicalPrefix = "/uploads/";

        // Allowed extensions and the first bytes a genuine file of that type starts with.
        private static readonly Dictionary<string, byte[]> Signatures = new(
            StringComparer.OrdinalIgnoreCase
        )
        {
            [".pdf"] = "%PDF-"u8.ToArray(),
            [".docx"] = [0x50, 0x4B, 0x03, 0x04], // zip container
            [".doc"] = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // OLE2 container
        };

        private readonly string _root;

        public LocalFileStorageService(IConfiguration config)
        {
            // Optional override in config/env: FileStorage:LocalPath
            var configured = config["FileStorage:LocalPath"];
            _root = Path.GetFullPath(
                string.IsNullOrWhiteSpace(configured)
                    ? Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "uploads")
                    : configured
            );

            Directory.CreateDirectory(_root);
        }

        public async Task<string> SaveAsync(IFormFile file, string folder)
        {
            if (file is null || file.Length == 0)
                throw new DomainException("The file is empty.");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!Signatures.TryGetValue(ext, out var signature))
                throw new DomainException("Only PDF, DOC and DOCX files are allowed.");

            // Check the real content, not just the name the client sent.
            await using (var input = file.OpenReadStream())
            {
                var header = new byte[signature.Length];
                var read = await input.ReadAtLeastAsync(
                    header,
                    header.Length,
                    throwOnEndOfStream: false
                );
                if (read < signature.Length || !header.AsSpan().SequenceEqual(signature))
                    throw new DomainException("The file content does not match its extension.");
            }

            var dir = Path.Combine(_root, folder);
            Directory.CreateDirectory(dir);

            var fileName = $"{Guid.NewGuid()}{ext}";
            var fullPath = Path.Combine(dir, fileName);

            await using var stream = File.Create(fullPath);
            await file.CopyToAsync(stream);

            return $"{LogicalPrefix}{folder}/{fileName}";
        }

        public string GetPhysicalPath(string filePath)
        {
            var relative = filePath.StartsWith(LogicalPrefix, StringComparison.OrdinalIgnoreCase)
                ? filePath[LogicalPrefix.Length..]
                : filePath.TrimStart('/');

            var fullPath = Path.GetFullPath(
                Path.Combine(_root, relative.Replace('/', Path.DirectorySeparatorChar))
            );

            // Block "../" tricks: the result must stay inside the uploads root.
            if (!fullPath.StartsWith(_root + Path.DirectorySeparatorChar, StringComparison.Ordinal))
                throw new DomainException("Invalid file path.");

            return fullPath;
        }

        public Task DeleteAsync(string filePath)
        {
            var fullPath = GetPhysicalPath(filePath);

            if (File.Exists(fullPath))
                File.Delete(fullPath);

            return Task.CompletedTask;
        }
    }
}
