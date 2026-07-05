using System.Runtime.CompilerServices;
using Azure.Core;
using FluentValidation;
using JobAppTracker.Application.Behaviours;
using JobAppTracker.Application.Features.JobApp.Commands;
using JobAppTracker.Application.Features.JobApp.Dtos;
using MediatR;
using NSubstitute;

namespace JobAppTracker.Application.UnitTests.Behaviours;
 public class VlalidatorBehaviourTests
 {
     private readonly ValidationBehavior<CreateJobAppCommand, CreateJobAppDto> _validationBehavior;
     private readonly IValidator<CreateJobAppCommand> _validator;  
     private readonly RequestHandlerDelegate<CreateJobAppDto> _next; 

    public VlalidatorBehaviourTests()
    {
            _validator = Substitute.For<IValidator<CreateJobAppCommand>>();
            _next = Substitute.For<RequestHandlerDelegate<CreateJobAppDto>>();
            _validationBehavior = new ValidationBehavior<CreateJobAppCommand, CreateJobAppDto>(new List<IValidator<CreateJobAppCommand>> { _validator });
            
    }
    [Fact]
    public async Task Handle_Should_Call_Next_When_Validation_Passes()
    {

        // Arrange
        var command = new CreateJobAppCommand { CompanyName = "Test Company", Title = "Test Position" };
        _validator.ValidateAsync(Arg.Any<ValidationContext<CreateJobAppCommand>>(), Arg.Any<CancellationToken>())
            .Returns(new FluentValidation.Results.ValidationResult());

        // Act
        var result = await _validationBehavior.Handle(command, _next, CancellationToken.None);

        // Assert
        _next.Received(1)();
    }
}
   