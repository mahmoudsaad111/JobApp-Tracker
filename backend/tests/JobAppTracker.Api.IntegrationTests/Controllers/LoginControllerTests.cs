using System.Net.Http.Json;
using Azure;
using FluentAssertions;
using JobAppTracker.Api.IntegrationTests.Common;
using JobAppTracker.Application.Common.Responses;
using JobAppTracker.Application.Features.Authentication.Commands;
using JobAppTracker.Application.Features.Authentication.DTOs;
using JobAppTracker.Infrastructure.Data;

namespace JobAppTracker.Api.IntegrationTests.Controllers;

[Collection(WebAppFactoryCollection.CollectionName)]
public class LoginControllerTests (WebAppFactory webAppFactory)
{
  private readonly AppDbContext _context = webAppFactory.CreateAppDbContext();
 
  [Fact]
  public async Task Login_ReturnsOkResult_WhenCredentialsAreValidAsync()
 {
    // Arrange
    var client = webAppFactory.CreateClient();
     // Act
    var response = await client.PostAsJsonAsync("/api/auth/login", new LoginUserCommand{ Email = "mahmoudsaad87871@gmail.com", Password = "Msd@123456" });
 
    // Assert
    response.EnsureSuccessStatusCode();
    var responseData = await response.Content.ReadFromJsonAsync<ApiResponse<LoginUserDto>>();
    responseData.Should().NotBeNull();
    responseData!.Success.Should().BeTrue();    
    responseData!.Data!.UserId.Should().NotBeEmpty();
  } 
}