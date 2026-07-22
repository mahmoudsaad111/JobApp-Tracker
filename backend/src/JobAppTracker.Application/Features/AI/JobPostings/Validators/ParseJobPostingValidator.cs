using FluentValidation;
using JobAppTracker.Application.Commands.ParseJobPosting;
using JobAppTracker.Application.Features.JobPostingParsing.Queries;

namespace JobAppTracker.Application.Features.JobPostings.Validators;
public class ParseJobPostingValidator : AbstractValidator<ParseJobPostingQuery>
{
    public ParseJobPostingValidator()
    {
        RuleFor(x => x.RawText)
            .NotEmpty().WithMessage("Job posting text cannot be empty.")
            .MaximumLength(10000).WithMessage("Job posting text is too long.");
    }
}