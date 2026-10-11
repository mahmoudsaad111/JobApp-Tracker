using System;
using System.Collections.Generic;
using System.Text;

namespace JobAppTracker.Application.Common.Interfaces
{
    public interface ICurrentUserService
    {
        Guid UserId { get; }
        Guid? UserIdOrNull { get; }
    }
}
