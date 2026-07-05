using System.Threading.Tasks;
using JobAppTracker.Application.Features.Authentication.Commands;
using JobAppTracker.Application.Features.Authentication.Validators;
using Xunit;

namespace JobAppTracker.Application.UnitTests.Authentication;

public class RegisterUserCommandValidatorTests
{
    [Fact]
    public void Validator_Fails_When_Required_Fields_Missing()
    {
        var validator = new RegisterUserCommandValidator();
        var command = new RegisterUserCommand();

        var result = validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Password");
        Assert.Contains(result.Errors, e => e.PropertyName == "Email");
    }

    [Fact]
    public void Validator_Succeeds_With_Valid_Input()
    {
        var validator = new RegisterUserCommandValidator();
        var command = new RegisterUserCommand
        {
            UserName = "jdoe",
            Password = "Password1",
            Email = "jdoe@example.com",
            FirstName = "John",
            LastName = "Doe"
        };

        var result = validator.Validate(command);

        Assert.True(result.IsValid);
    }
}
