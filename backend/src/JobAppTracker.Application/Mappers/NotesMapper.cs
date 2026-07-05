using System.Collections.Generic;
using System.Linq;
using JobAppTracker.Application.Features.Notes.Dtos;
using JobAppTracker.Domain.Entities;

namespace JobAppTracker.Application.Mappers
{
    public static class NotesMapper
    {
        public static GetNoteDto ToGetNoteDto(Note note)
        {
            return new GetNoteDto
            {
                NoteId = note.Id,
                Content = note.Content,
                CreatedAt = note.CreatedAt,
                UpdatedAt = note.UpdatedAt,
                JobAppId = note.JobAppId,
            };
        }

        public static GetAllNotesDto ToGetAllNotesDto(IEnumerable<Note> notes)
        {
            return new GetAllNotesDto
            {
                Notes = notes.Select(ToGetNoteDto).ToList(),
            };
        }

        public static CreateNoteDto ToCreateNoteDto(Note note)
        {
            return new CreateNoteDto
            {
                NoteId = note.Id,
                NoteContent = note.Content,
                CreatedAt = note.CreatedAt,
                UpdatedAt = note.UpdatedAt,
            };
        }

        public static UpdateNoteDto ToUpdateNoteDto(Note note)
        {
            return new UpdateNoteDto
            {
                NoteId = note.Id,
                NoteContent = note.Content,
                CreatedAt = note.CreatedAt,
                UpdatedAt = note.UpdatedAt,
            };
        }
    }
}
