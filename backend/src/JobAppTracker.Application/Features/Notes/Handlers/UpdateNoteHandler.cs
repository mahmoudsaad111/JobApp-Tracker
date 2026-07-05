using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Common.Interfaces;
using JobAppTracker.Application.Features.Notes.Commands;
using JobAppTracker.Application.Features.Notes.Dtos;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Application.Mappers;
using MediatR;

namespace JobAppTracker.Application.Features.Notes.Handlers
{
    public class UpdateNoteHandler : IRequestHandler<UpdateNoteCommand, UpdateNoteDto>
    {
        private readonly ICurrentUserService _currentUserService;
        private readonly INoteRepository _noteRepository;

        public UpdateNoteHandler(
            ICurrentUserService currentUserService,
            INoteRepository noteRepository
        )
        {
            _currentUserService = currentUserService;
            _noteRepository = noteRepository;
        }

        public async Task<UpdateNoteDto> Handle(
            UpdateNoteCommand request,
            CancellationToken cancellationToken
        )
        {
            var userId = _currentUserService.UserId;
            var note = await _noteRepository.GetByIdAsync(request.NoteId);
            if (note == null || note.UserId != userId)
            {
                throw new NotFoundException("Note not found or access denied.");
            }

            note.UpdateContent(request.Content);
            _noteRepository.Update(note);
            await _noteRepository.SaveChangesAsync();

            return NotesMapper.ToUpdateNoteDto(note);
        }
    }
}
