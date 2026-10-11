using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Common.Interfaces;
using JobAppTracker.Application.Features.Notes.Commands;
using JobAppTracker.Application.Features.Notes.Dtos;
using JobAppTracker.Application.Interfaces.Repositories;
using MediatR;

namespace JobAppTracker.Application.Features.Notes.Handlers
{
    public class DeleteNoteHandler : IRequestHandler<DeleteNoteCommand, DeleteNoteDto>
    {
        private readonly INoteRepository _noteRepository;
        private readonly ICurrentUserService _currentUserService;

        public DeleteNoteHandler(
            INoteRepository noteRepository,
            ICurrentUserService currentUserService
        )
        {
            _noteRepository = noteRepository;
            _currentUserService = currentUserService;
        }

        public async Task<DeleteNoteDto> Handle(
            DeleteNoteCommand request,
            CancellationToken cancellationToken
        )
        {
            var userId = _currentUserService.UserId;
            var note = await _noteRepository.GetByIdAsync(request.NoteId);

            if (note == null || note.UserId != userId)
            {
                throw new NotFoundException("Note not found or access denied.");
            }

            _noteRepository.Delete(note);
            await _noteRepository.SaveChangesAsync();
            return new DeleteNoteDto { IsDeleted = true, Message = "Note deleted successfully." };
        }
    }
}
