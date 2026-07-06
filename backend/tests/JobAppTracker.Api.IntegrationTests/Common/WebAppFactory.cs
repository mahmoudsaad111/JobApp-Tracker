using System.Reflection.Emit;
using JobAppTracker.Domain.Entities;
using JobAppTracker.Infrastructure.Data;
using MediatR;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Testcontainers.MsSql;

namespace JobAppTracker.Api.IntegrationTests.Common;
public class WebAppFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly MsSqlContainer _dbContainer = new MsSqlBuilder()
    .Build();


    public AppDbContext CreateAppDbContext()
    {
        var serviceScope = Services.CreateScope();

        return serviceScope.ServiceProvider.GetRequiredService<AppDbContext>();
    }

    public async Task InitializeAsync()
    {
        await _dbContainer.StartAsync();
        var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await context.Database.MigrateAsync();
       // Seed a test user  
        UserManager<User> userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var user = User.Create(
                email: "mahmoudsaad87871@gmail.com",
                firstName: "Mahmoud",
                lastName: "Saad"    
            );
        user.EmailConfirmed=true; 

           var result = await userManager.CreateAsync(user, "Msd@123456");

            if (!result.Succeeded)
            {
                throw new Exception(string.Join(", ", result.Errors.Select(e => e.Description)));
            }
     

        // SAve changes to the database
        await context.SaveChangesAsync();

    }

    public async Task DisposeAsync() => await _dbContainer.StopAsync();


    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IHostedService>();

            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(( options) =>
            {
                options.UseSqlServer(_dbContainer.GetConnectionString());
            });
        });
    }

}