using System;
using System.Collections.Generic;
using JobAppTracker.Application.Mappers;
using JobAppTracker.Domain.Entities;
using JobAppTracker.Domain.Enums;
using Xunit;

namespace JobAppTracker.Application.UnitTests.Mappers;

public class InterviewsMapperTests
{
    [Fact]
    public void ToGetAllInterviewsDto_Includes_JobApplication_Summary()
    {
        var userId = Guid.NewGuid();
        var jobApp = JobApplication.Create(userId, "ACME", "Dev", DateTime.UtcNow);
        var interview = Interview.Create(jobApp.Id, userId, InterviewType.OnSite, DateTime.UtcNow);
        // set navigation manually for mapper path
        var prop = typeof(Interview).GetProperty("JobApplication");
        Assert.NotNull(prop);
        prop.SetValue(interview, jobApp);

        var dto = InterviewsMapper.ToGetAllInterviewsDto(interview);

        Assert.Equal(interview.Id, dto.InterviewId);
        Assert.NotNull(dto.JobApplication);
        Assert.Equal(jobApp.Id, dto.JobApplication.JobAppId);
    }
}
