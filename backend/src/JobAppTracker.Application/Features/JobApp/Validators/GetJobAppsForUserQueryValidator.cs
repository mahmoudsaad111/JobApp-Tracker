using FluentValidation;
using JobAppTracker.Application.Features.JobApp.Queries;

namespace JobAppTracker.Application.Features.JobApp.Validators
{
    public class GetJobAppsForUserQueryValidator : AbstractValidator<GetJobAppsForUserQuery>
    {
        public const int MaxPageSize = 100;

        public GetJobAppsForUserQueryValidator()
        {
            RuleFor(x => x.Page)
                .GreaterThanOrEqualTo(1).WithMessage("Page must be 1 or higher");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, MaxPageSize)
                .WithMessage($"PageSize must be between 1 and {MaxPageSize}");

            RuleFor(x => x.Search)
                .MaximumLength(100).WithMessage("Search text is too long (max 100 chars)");
        }
    }
}
