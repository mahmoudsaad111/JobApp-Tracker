using System.Text;
using JobAppTracker.Application.Common.Interfaces;
using JobAppTracker.Application.Common.Settings;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Application.Interfaces.Services;
using JobAppTracker.Application.Interfaces.Services.AI;
using JobAppTracker.Application.Interfaces.Services.Email;
using JobAppTracker.Application.Interfaces.Services.Frontend;
using JobAppTracker.Domain.Entities;
using JobAppTracker.Infrastructure.Data;
using JobAppTracker.Infrastructure.Repositories;
using JobAppTracker.Infrastructure.Services;
using JobAppTracker.Infrastructure.Services.AI;
using JobAppTracker.Infrastructure.Services.Documents;
using JobAppTracker.Infrastructure.Services.Email;
using JobAppTracker.Infrastructure.Services.FileStorage;
using JobAppTracker.Infrastructure.Services.Frontend;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace JobAppTracker.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(
            this IServiceCollection services,
            IConfiguration configuration
        )
        {
            services
                .AddIdentity<User, IdentityRole<Guid>>(Options =>
                {
                    Options.User.RequireUniqueEmail = true;
                    Options.SignIn.RequireConfirmedEmail = true;
                })
                .AddEntityFrameworkStores<AppDbContext>()
                .AddDefaultTokenProviders();

            // Adding the database context to the service collection and configuring it to use SQL Server with the connection string from the configuration
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("SQLServer"))
            );
            services.Configure<EmailSettings>(configuration.GetSection("Email"));

            services.AddTransient<IEmailService, EmailService>();
            // Add HttpContextAccessor to the service collection to allow access to the current HTTP context in services
            services.AddHttpContextAccessor();

            services.AddScoped<IJobAppRepository, JobAppRepository>();
            services.AddScoped<IDashboardRepository, DashboardRepository>();
            services.AddScoped<IInterviewRepository, InterviewRepository>();
            services.AddScoped<INoteRepository, NoteRepository>();

            services.AddScoped<IDocumentRepository, DocumentRespository>();
            services.AddScoped<IFileStorageService, LocalFileStorageService>();

            services.AddScoped<IFrontendUrlService, FrontendUrlService>();
            services.AddScoped<ICurrentUserService, CurrentUserService>();

            services.Configure<GeminiOptions>(configuration.GetSection(GeminiOptions.SectionName));
            services.AddHttpClient<IGeminiClient, GeminiClient>(client =>
                {
                 client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
              });
            services.AddScoped<IJobPostingParserService, GeminiJobPostingParserService>();
            services.AddScoped<ICoverLetterGeneratorService, GeminiCoverLetterGeneratorService>();
            services.AddScoped<IResumeMatchService, GeminiResumeMatchService>();
            services.AddScoped<IDocumentTextExtractorService,DocumentTextExtractorService>();

            

            return services;
        }
    }
}
