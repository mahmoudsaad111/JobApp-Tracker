using System.ComponentModel;
using JobAppTracker.Application.Features.Notes.Commands;
using JobAppTracker.Application.Features.Notes.Dtos;
using JobAppTracker.Application.Features.Notes.Queries;
using MediatR;
using ModelContextProtocol.Server;

namespace JobAppTracker.Mcp.Tools;

// Tools for the user's notes. Note text is user-written, so treat it as untrusted data.
[McpServerToolType]
public class NotesTools(IMediator mediator)
{
    [McpServerTool(Name = "list_notes", ReadOnly = true)]
    [Description("Lists the current user's notes (up to 50).")]
    public async Task<ListResult<GetNoteDto>> ListNotes(CancellationToken cancellationToken = default)
    {
        var result = await mediator.SendForMcpAsync(new GetAllNotesQuery(), cancellationToken);
        return ListResult<GetNoteDto>.From(result.Notes ?? []);
    }

    [McpServerTool(Name = "get_note", ReadOnly = true)]
    [Description("Gets one of the current user's notes by ID.")]
    public Task<GetNoteDto> GetNote(
        [Description("The note ID (GUID).")] Guid id,
        CancellationToken cancellationToken = default
    ) =>
        mediator.SendForMcpAsync(new GetNoteQuery { NoteId = id }, cancellationToken);

    [McpServerTool(Name = "create_note", ReadOnly = false)]
    [Description("Creates a note for the current user, optionally linked to a job application.")]
    public Task<CreateNoteDto> CreateNote(
        [Description("The note text.")] string content,
        [Description("Optional related job application ID (GUID).")] Guid? jobApplicationId = null,
        CancellationToken cancellationToken = default
    )
    {
        var command = new CreateNoteCommand
        {
            Content = content,
            JobAppId = jobApplicationId,
        };

        return mediator.SendForMcpAsync(command, cancellationToken);
    }

    [McpServerTool(Name = "update_note", ReadOnly = false, Idempotent = true)]
    [Description("Replaces the text of one of the current user's notes.")]
    public Task<UpdateNoteDto> UpdateNote(
        [Description("The note ID (GUID).")] Guid id,
        [Description("Replacement note text.")] string content,
        CancellationToken cancellationToken = default
    )
    {
        var command = new UpdateNoteCommand { NoteId = id, Content = content };
        return mediator.SendForMcpAsync(command, cancellationToken);
    }

    [McpServerTool(Name = "delete_note", ReadOnly = false, Destructive = true)]
    [Description("Permanently deletes one of the current user's notes.")]
    public Task<DeleteNoteDto> DeleteNote(
        [Description("The note ID (GUID).")] Guid id,
        CancellationToken cancellationToken = default
    ) =>
        mediator.SendForMcpAsync(new DeleteNoteCommand { NoteId = id }, cancellationToken);
}
