using JobAppTracker.Application.Common.Responses;
using JobAppTracker.Application.Features.Notes.Commands;
using JobAppTracker.Application.Features.Notes.Dtos;
using JobAppTracker.Application.Features.Notes.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobAppTracker.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/notes")]
    public class NotesController : ControllerBase
    {
        private readonly IMediator _mediator;

        public NotesController(IMediator mediator) => _mediator = mediator;

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateNoteCommand command)
        {
            var note = await _mediator.Send(command);
            return Ok(ApiResponse<CreateNoteDto>.SuccessResult(note, "Note created successfully."));
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] GetAllNotesQuery query)
        {
            var notes = await _mediator.Send(query);
            return Ok(
                ApiResponse<GetAllNotesDto>.SuccessResult(notes, "Notes retrieved successfully.")
            );
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteNote(Guid id)
        {
            var result = await _mediator.Send(new DeleteNoteCommand { NoteId = id });
            return Ok(
                ApiResponse<DeleteNoteDto>.SuccessResult(result, "Note deleted successfully.")
            );
        }

        // (The old GET api/notes/{id} endpoint was removed: it had no handler, so it always failed.
        //  The app loads notes through GET api/notes.)

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateNoteCommand command)
        {
            command.NoteId = id;
            var result = await _mediator.Send(command);
            return Ok(
                ApiResponse<UpdateNoteDto>.SuccessResult(result, "Note updated successfully.")
            );
        }
    }
}
