using JobAppTracker.Application.Features.Authentication.Commands;
using JobAppTracker.Application.Features.Authentication.Validators;
using Xunit;

namespace JobAppTracker.Application.UnitTests.Authentication;

public class LoginUserCommandValidatorTests
{
    [Fact]
    public void Validator_Fails_On_Invalid_Email_Or_Password()
    {
        var validator = new LoginUserCommandValidator();
        var command = new LoginUserCommand { Email = "not-an-email", Password = "123" };

        var result = validator.Validate(command);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Email");
        Assert.Contains(result.Errors, e => e.PropertyName == "Password");
    }

    [Fact]
    public void Validator_Passes_With_Valid_Credentials()
    {
        var validator = new LoginUserCommandValidator();
        var command = new LoginUserCommand { Email = "jdoe@example.com", Password = "Password1" };

        var result = validator.Validate(command);

        Assert.True(result.IsValid);
    }
}
