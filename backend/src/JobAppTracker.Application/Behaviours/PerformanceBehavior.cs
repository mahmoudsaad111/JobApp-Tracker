using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.Extensions.Logging;

namespace JobAppTracker.Application.Behaviours
{
    public class PerformanceBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
        where TRequest : IRequest<TResponse>
    {
        private readonly ILogger<TRequest> _logger;
        private const int WarningThresholdMilliseconds = 500;

        public PerformanceBehavior(ILogger<TRequest> logger)
        {
            _logger = logger;
        }

        public async Task<TResponse> Handle(
            TRequest request,
            RequestHandlerDelegate<TResponse> next,
            CancellationToken cancellationToken
        )
        {
            var stopwatch = Stopwatch.StartNew();
            var response = await next();
            stopwatch.Stop();

            if (stopwatch.ElapsedMilliseconds > WarningThresholdMilliseconds)
            {
                _logger.LogWarning(
                    "Long running request {RequestName} took {ElapsedMilliseconds}ms {@Request}",
                    typeof(TRequest).Name,
                    stopwatch.ElapsedMilliseconds,
                    request
                );
            }
            else
            {
                _logger.LogDebug(
                    "Request {RequestName} completed in {ElapsedMilliseconds}ms",
                    typeof(TRequest).Name,
                    stopwatch.ElapsedMilliseconds
                );
            }

            return response;
        }
    }
}
