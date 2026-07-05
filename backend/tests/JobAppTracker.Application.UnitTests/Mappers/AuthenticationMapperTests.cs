using System.Collections.Generic;
using JobAppTracker.Application.Mappers;
using JobAppTracker.Domain.Entities;
using Xunit;

namespace JobAppTracker.Application.UnitTests.Mappers;

public class AuthenticationMapperTests
{
    [Fact]
    public void ToLoginUserDto_Maps_Fields()
    {
        var user = User.Create("jdoe@example.com", "John", "Doe");
        var roles = new List<string> { "Admin", "User" };

        var dto = AuthenticationMapper.ToLoginUserDto(user, roles);

        Assert.True(dto.IsSuccess);
        Assert.Equal(user.Email, dto.Email);
        Assert.Equal(user.Id, dto.UserId);
        Assert.Equal("Admin", dto.Role);
        Assert.Equal(user.FirstName, dto.FirstName);
        Assert.Equal(user.LastName, dto.LastName);
    }

    [Fact]
    public void ToRegisterResultDto_Maps_Email()
    {
        var user = User.Create("jane@example.com", "Jane", "Roe");

        var dto = AuthenticationMapper.ToRegisterResultDto(user);

        Assert.Equal(user.Email, dto.Email);
    }
}
