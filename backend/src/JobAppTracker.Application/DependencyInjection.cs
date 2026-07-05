using JobAppTracker.Application.Common.Settings;
using JobAppTracker.Application.Behaviours;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MediatR;
using FluentValidation;

namespace JobAppTracker.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            services.AddMediatR(cfg =>
                cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly)
            );

            services.AddTransient(
                typeof(IPipelineBehavior<,>),
                typeof(ExceptionHandlingBehavior<,>)
            );
            services.AddTransient(
                typeof(IPipelineBehavior<,>),
                typeof(LoggingBehavior<,>)
            );
            services.AddTransient(
                typeof(IPipelineBehavior<,>),
                typeof(PerformanceBehavior<,>)
            );

            // FluentValidation
            services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

            return services;
        }
    }
}
