using System.Text;
using JobAppTracker.Application.Common.Interfaces;
using JobAppTracker.Application.Common.Settings;
using JobAppTracker.Application.Common.Templates;
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
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
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
                .AddIdentity<User, IdentityRole<Guid>>(options =>
                    {
                        options.User.RequireUniqueEmail = true;
                        options.SignIn.RequireConfirmedEmail = true;

                        options.Lockout.AllowedForNewUsers = true;
                        options.Lockout.MaxFailedAccessAttempts = 5;
                        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                    })
                .AddEntityFrameworkStores<AppDbContext>()
                .AddDefaultTokenProviders();

            // How long email-confirmation and password-reset links stay valid.
            // Uses the same value the email text shows, so they can't disagree.
            services.Configure<DataProtectionTokenProviderOptions>(options =>
                options.TokenLifespan = TimeSpan.FromHours(EmailTemplates.LinkValidHours)
            );

            // Typed login-cookie settings (Auth section) instead of reading string keys
            services.Configure<AuthSettings>(configuration.GetSection(AuthSettings.SectionName));
            services
                .AddOptions<CookieAuthenticationOptions>(IdentityConstants.ApplicationScheme)
                .Configure<IOptions<AuthSettings>>(ConfigureAuthCookie);

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

        private static void ConfigureAuthCookie(
            CookieAuthenticationOptions options,
            IOptions<AuthSettings> authOptions
        )
        {
            var auth = authOptions.Value;

            var sameSite = Enum.TryParse<SameSiteMode>(auth.SameSite, ignoreCase: true, out var parsed)
                ? parsed
                : SameSiteMode.Lax;

            options.Cookie.Name = "jobtracker.auth";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = sameSite;
            options.Cookie.SecurePolicy = auth.SecureCookie
                ? CookieSecurePolicy.Always
                : CookieSecurePolicy.SameAsRequest;

            // Idle timeout: renewed on activity
            options.ExpireTimeSpan = TimeSpan.FromHours(auth.SlidingSessionExpireHours);
            options.SlidingExpiration = true;

            // Keep Identity's own security-stamp check, add the absolute limit before it
            var identityCheck = options.Events.OnValidatePrincipal;
            options.Events.OnValidatePrincipal = async context =>
            {
                if (
                    context.Properties.Items.TryGetValue(AuthSettings.SessionStartKey, out var started)
                    && DateTimeOffset.TryParse(started, out var startedAt)
                    && DateTimeOffset.UtcNow - startedAt > TimeSpan.FromDays(auth.AbsoluteSessionDays)
                )
                {
                    context.RejectPrincipal();
                    await context.HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
                    return;
                }

                if (identityCheck is not null)
                {
                    await identityCheck(context);
                }
            };
        }
    }
}
