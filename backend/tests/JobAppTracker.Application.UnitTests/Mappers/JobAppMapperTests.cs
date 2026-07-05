using System;
using System.Collections.Generic;
using JobAppTracker.Application.Mappers;
using JobAppTracker.Domain.Entities;
using JobAppTracker.Domain.Enums;
using Xunit;

namespace JobAppTracker.Application.UnitTests.Mappers;

public class JobAppMapperTests
{
    [Fact]
    public void ToGetJobAppByIdDto_Maps_All_Fields_Including_Interviews()
    {
        var jobApp = JobApplication.Create(Guid.NewGuid(), "ACME", "Developer", DateTime.UtcNow);
        var interview = Interview.Create(jobApp.Id, jobApp.UserId, InterviewType.Phone, DateTime.UtcNow);
        jobApp.AddInterview(interview);

        var dto = JobAppMapper.ToGetJobAppByIdDto(jobApp);

        Assert.Equal(jobApp.Id, dto.JobAppId);
        Assert.Equal(jobApp.CompanyName, dto.CompanyName);
        Assert.Equal(jobApp.Title, dto.Title);
        Assert.NotNull(dto.Interviews);
        Assert.Contains(dto.Interviews, i => i.InterviewId == interview.Id);
    }

    [Fact]
    public void ToGetJobAppForUserDto_Maps_Summary()
    {
        var jobApp = JobApplication.Create(Guid.NewGuid(), "ACME", "Developer", DateTime.UtcNow);

        var dto = JobAppMapper.ToGetJobAppForUserDto(jobApp);

        Assert.Equal(jobApp.Id, dto.JobAppId);
        Assert.Equal(jobApp.CompanyName, dto.CompanyName);
        Assert.Equal(jobApp.Title, dto.Title);
    }
}
