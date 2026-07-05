using System;
using JobAppTracker.Domain.Common.Exceptions;
using JobAppTracker.Domain.Enums;
using JobAppTracker.Domain.ValueObjects;
using UserEntity = JobAppTracker.Domain.Entities.User;

namespace JobAppTracker.Domain.UnitTests.User;

public class UserTests
{
    private static readonly DateTime ValidDob = new DateTime(1990, 1, 15, 0, 0, 0, DateTimeKind.Utc);
    private static readonly Location ValidLocation = new Location("USA", "Seattle", "1 Main St", 98101);

    private static UserEntity CreateValidUser(
        string email = "jane.doe@example.com",
        string firstName = "Jane",
        string lastName = "Doe",
        DateTime? dateOfBirth = null,
        Gender? gender = null,
        Location? location = null,
        string? currentJobTitle = "Developer",
        int? yearsOfExperience = 5,
        string? currentCompany = "Contoso"
    )
    {
        return UserEntity.Create(
            email,
            firstName,
            lastName,
            dateOfBirth,
            gender,
            location,
            currentJobTitle,
            yearsOfExperience,
            currentCompany
        );
    }

    [Fact]
    public void Create_WithValidData_ReturnsUserWithExpectedValues()
    {
        var user = CreateValidUser(dateOfBirth: ValidDob, gender: Gender.Female, location: ValidLocation);

        Assert.Equal("jane.doe@example.com", user.Email);
        Assert.Equal("jane.doe@example.com", user.UserName);
        Assert.Equal("Jane", user.FirstName);
        Assert.Equal("Doe", user.LastName);
        Assert.Equal(ValidDob, user.DateOfBirth);
        Assert.Equal(Gender.Female, user.Gender);
        Assert.Equal(ValidLocation, user.Location);
        Assert.Equal("Developer", user.CurrentJobTitle);
        Assert.Equal(5, user.YearsOfExperience);
        Assert.Equal("Contoso", user.CurrentCompany);
    }

    [Fact]
    public void Create_TrimsTextProperties()
    {
        var user = CreateValidUser(
            email: "  jane.doe@example.com  ",
            firstName: "  Jane  ",
            lastName: "  Doe  ",
            currentJobTitle: "  Developer  ",
            currentCompany: "  Contoso  "
        );

        Assert.Equal("jane.doe@example.com", user.Email);
        Assert.Equal("jane.doe@example.com", user.UserName);
        Assert.Equal("Jane", user.FirstName);
        Assert.Equal("Doe", user.LastName);
        Assert.Equal("Developer", user.CurrentJobTitle);
        Assert.Equal("Contoso", user.CurrentCompany);
    }

    [Fact]
    public void Create_SetsCreatedAt()
    {
        var before = DateTime.UtcNow;

        var user = CreateValidUser();

        var after = DateTime.UtcNow;

        Assert.InRange(user.CreatedAt, before, after);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithInvalidEmail_ThrowsDomainException(string? invalidEmail)
    {
        Assert.Throws<DomainException>(() => UserEntity.Create(invalidEmail!, "Jane", "Doe"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithInvalidFirstName_ThrowsDomainException(string? invalidFirstName)
    {
        Assert.Throws<DomainException>(() => UserEntity.Create("jane.doe@example.com", invalidFirstName!, "Doe"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithInvalidLastName_ThrowsDomainException(string? invalidLastName)
    {
        Assert.Throws<DomainException>(() => UserEntity.Create("jane.doe@example.com", "Jane", invalidLastName!));
    }

    [Fact]
    public void Create_WithFutureDateOfBirth_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => CreateValidUser(dateOfBirth: DateTime.UtcNow.AddDays(1)));
    }

    [Fact]
    public void Create_WithNegativeYearsOfExperience_ThrowsDomainException()
    {
        Assert.Throws<DomainException>(() => CreateValidUser(yearsOfExperience: -1));
    }

    [Fact]
    public void UpdateProfile_WithValidData_UpdatesFieldsAndTimestamp()
    {
        var user = CreateValidUser();

        Assert.Null(user.UpdatedAt);

        user.UpdateProfile(
            "John",
            "Smith",
            dateOfBirth: new DateTime(1985, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            gender: Gender.Male,
            location: ValidLocation,
            currentJobTitle: "Senior Developer",
            yearsOfExperience: 10,
            currentCompany: "Fabrikam"
        );

        Assert.Equal("John", user.FirstName);
        Assert.Equal("Smith", user.LastName);
        Assert.Equal(Gender.Male, user.Gender);
        Assert.Equal(ValidLocation, user.Location);
        Assert.Equal("Senior Developer", user.CurrentJobTitle);
        Assert.Equal(10, user.YearsOfExperience);
        Assert.Equal("Fabrikam", user.CurrentCompany);
        Assert.True(user.UpdatedAt.HasValue);
        Assert.True(user.UpdatedAt.Value > user.CreatedAt);
    }

    [Fact]
    public void UpdateProfile_WithInvalidFirstName_ThrowsDomainException()
    {
        var user = CreateValidUser();

        Assert.Throws<DomainException>(() => user.UpdateProfile("", "Doe"));
    }

    [Fact]
    public void UpdateProfile_WithFutureDateOfBirth_ThrowsDomainException()
    {
        var user = CreateValidUser();

        Assert.Throws<DomainException>(() => user.UpdateProfile("Jane", "Doe", dateOfBirth: DateTime.UtcNow.AddDays(1)));
    }
}
