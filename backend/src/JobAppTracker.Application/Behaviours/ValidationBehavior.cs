using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using AppValidationException = JobAppTracker.Application.Common.Exceptions.ValidationException;
using MediatR;
using JobAppTracker.Application.Common.Exceptions;

namespace JobAppTracker.Application.Behaviours
{
    public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
        where TRequest : IRequest<TResponse>
    {
        private readonly IEnumerable<IValidator<TRequest>> _validators;

        public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
        {
            _validators = validators;
        }

        public async Task<TResponse> Handle(
            TRequest request,
            RequestHandlerDelegate<TResponse> next,
            CancellationToken cancellationToken
        )
        {
            if (_validators.Any())
            {
                var context = new ValidationContext<TRequest>(request);
                var failures = (await Task.WhenAll(_validators.Select(v => v.ValidateAsync(context, cancellationToken))))
                    .SelectMany(r => r.Errors)
                    .Where(f => f != null)
                    .Select(f => f.ErrorMessage)
                    .ToList();

                if (failures.Any())
                {
                    throw new AppValidationException("Validation failed", failures);
                }
            }

            return await next();
        }
    }
}
