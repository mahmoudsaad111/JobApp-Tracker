using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using JobAppTracker.API.Middlewares;
using JobAppTracker.Application;
using JobAppTracker.Domain.Entities;
using JobAppTracker.Infrastructure;
using JobAppTracker.Infrastructure.Data;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder
    .Services.AddInfrastructure(builder.Configuration)
    .AddApplication()
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()); // ← teaches JSON serializer to convert enums to/from strings
    });
;
builder.Services.AddAuthorization();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var FrontendUrl = builder.Configuration.GetValue<string>("Frontend:BaseUrl");

// Configure CORS to allow requests from the Angular frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AngularPolicy",
        policy =>
        {
            policy.WithOrigins(FrontendUrl).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
        }
    );
});
// Add Response compression for better performance
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
});

// Behind a reverse proxy (nginx in Docker) the real client IP arrives in X-Forwarded-For.
// Off by default: on IIS a client could fake that header and dodge the rate limiter.
var useForwardedHeaders = builder.Configuration.GetValue<bool>("ForwardedHeaders:Enabled");
if (useForwardedHeaders)
{
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        // The proxy is our own nginx container, so its address is not known in advance.
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });
}

// Add Rate limiter For better performance
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    static string Ip(HttpContext c) => c.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    // Safety net for everything: 300 requests/min per IP
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
        RateLimitPartition.GetFixedWindowLimiter(Ip(ctx), _ =>
            new FixedWindowRateLimiterOptions { PermitLimit = 300, Window = TimeSpan.FromMinutes(1) }));

    // Login/register/etc.: 10 per minute per IP
    options.AddPolicy("auth", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(Ip(ctx), _ =>
            new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));

    // Endpoints that send email: 5 per 15 minutes per IP
    options.AddPolicy("email", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(Ip(ctx), _ =>
            new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(15) }));
});

var app = builder.Build();

if (useForwardedHeaders)
{
    app.UseForwardedHeaders();
}


app.UseMiddleware<ExceptionMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHsts(); // tells browsers: always use https for this site (sent only over https)
    app.UseHttpsRedirection();
}

// Security headers on every response (including static files)
app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["Content-Security-Policy"] = "frame-ancestors 'none'";
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    await next();
});

app.UseStaticFiles();
app.UseRouting();

app.UseCors("AngularPolicy");

app.UseResponseCompression();

app.UseAuthentication();
app.UseAuthorization();

app.UseRateLimiter(); 

app.MapControllers();
app.MapFallbackToFile("index.html");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // ADD THIS ↓
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    
    string[] roles = ["User", "Admin"];
    
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new IdentityRole<Guid>(role));
            Console.WriteLine($"ROLE CREATED: {role}");
        }
    }
}


app.Run();

// Make the implicit Program class public so integration tests can access it
public partial class Program { }