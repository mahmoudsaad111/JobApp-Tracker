using JobAppTracker.Application.Common.Responses;
using JobAppTracker.Application.Features.Interviews.Commands;
using JobAppTracker.Application.Features.Interviews.Dtos;
using JobAppTracker.Application.Features.Interviews.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace JobAppTracker.API.Controllers
{
    [Authorize]
    [Route("api/Interview")]
    [ApiController]
    public class InterviewController : ControllerBase
    {
        private readonly IMediator _mediator;

        public InterviewController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost]
        public async Task<IActionResult> CreateInterview([FromBody] CreateInterviewCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(ApiResponse<CreateInterviewDto>.SuccessResult(result, "success"));
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetInterview([FromRoute] Guid id)
        {
            var result = await _mediator.Send(
                new GetInterviewQuery { InterviewId = id }
            );
            return Ok(ApiResponse<GetInterviewDto>.SuccessResult(result, "success"));
        }

        [HttpGet]
        public async Task<IActionResult> GetAllInterviews()
        {
            var result = await _mediator.Send(new GetAllInterviewsQuery());
            return Ok(
                ApiResponse<IEnumerable<GetAllInterviewsDto>>.SuccessResult(result, "success")
            );
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInterview(Guid id)
        {
            var result = await _mediator.Send(new DeleteInterviewCommand { InterviewId = id });
            return Ok(ApiResponse<bool>.SuccessResult(result, "success"));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInterview(
            Guid id,
            [FromBody] UpdateInterviewCommand command
        )
        {
            command.InterviewId = id;
            var result = await _mediator.Send(command);
            return Ok(ApiResponse<UpdateInterviewDto>.SuccessResult(result, "success"));
        }
    }
}
