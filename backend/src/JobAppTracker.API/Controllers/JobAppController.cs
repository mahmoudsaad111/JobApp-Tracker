using JobAppTracker.Application.Common.Responses;
using JobAppTracker.Application.Features.JobApp.Commands;
using JobAppTracker.Application.Features.JobApp.Dtos;
using JobAppTracker.Application.Features.JobApp.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobAppTracker.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/JobApp")]
    public class JobAppController : ControllerBase
    {
        private readonly IMediator _mediator;

        public JobAppController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost]
        public async Task<IActionResult> CreateJobApp([FromBody] CreateJobAppCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(
                ApiResponse<CreateJobAppDto>.SuccessResult(result, "JobApp Created Successfully")
            );
        }

        [HttpGet("{JobAppId:guid}")]
        public async Task<IActionResult> GetJobAppById([FromRoute] Guid JobAppId)
        {
            var result = await _mediator.Send(new GetJobAppByIdQuery { JobAppId = JobAppId });

            return Ok(
                ApiResponse<GetJobAppByIdDto>.SuccessResult(result, "JobApp Retrieved Successfully")
            );
        }

        // Guid route parameters: an invalid id is a clean 404/400 from routing, not a 500 from Guid.Parse.
        [HttpDelete("{JobAppId:guid}")]
        public async Task<IActionResult> DeleteJobAppById([FromRoute] Guid JobAppId)
        {
            var result = await _mediator.Send(
                new DeleteJobAppByIdCommand { JobAppId = JobAppId }
            );

            return Ok(ApiResponse<object>.SuccessResult(result, "JobApp Deleted Successfully"));
        }

        [HttpPut("{JobAppId:guid}")]
        public async Task<IActionResult> UpdateJobApp(
            [FromRoute] Guid JobAppId,
            [FromBody] UpdateJobAppCommand command
        )
        {
            command.JobAppId = JobAppId;
            var result = await _mediator.Send(command);

            return Ok(ApiResponse<object>.SuccessResult(result, "JobApp Updated Successfully"));
        }

        [HttpPatch("{JobAppId:guid}/status")]
        public async Task<IActionResult> UpdateJobAppStatus(
            [FromRoute] Guid JobAppId,
            [FromBody] UpdateJobAppStatusCommand command
        )
        {
            command.JobAppId = JobAppId;
            var result = await _mediator.Send(command);

            return Ok(
                ApiResponse<UpdateJobAppStatusDto>.SuccessResult(
                    result,
                    "JobApp Status Updated Successfully"
                )
            );
        }

        [HttpGet()]
        public async Task<IActionResult> GetJobAppsForUser([FromQuery] GetJobAppsForUserQuery Query)
        {
            var result = await _mediator.Send(Query);
            return Ok(result);
        }
    }
}
