using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.Extensions.Logging;

namespace JobAppTracker.Application.Behaviours
{
    public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
        where TRequest : IRequest<TResponse>
    {
        private readonly ILogger<TRequest> _logger;

        public LoggingBehavior(ILogger<TRequest> logger)
        {
            _logger = logger;
        }

        public async Task<TResponse> Handle(
            TRequest request,
            RequestHandlerDelegate<TResponse> next,
            CancellationToken cancellationToken
        )
        {
            _logger.LogInformation("Handling request {RequestName} {@Request}", typeof(TRequest).Name, request);

            var response = await next();

            _logger.LogInformation("Handled request {RequestName} {@Response}", typeof(TRequest).Name, response);

            return response;
        }
    }
}
