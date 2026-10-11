using System;
using System.Collections.Generic;
using System.Text;
using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Common.Interfaces;
using JobAppTracker.Application.Features.Notes.Commands;
using JobAppTracker.Application.Features.Notes.Dtos;
using JobAppTracker.Application.Interfaces.Repositories;
using JobAppTracker.Application.Mappers;
using JobAppTracker.Domain.Entities;
using MediatR;

namespace JobAppTracker.Application.Features.Notes.Handlers
{
    public class CreateNoteHandler : IRequestHandler<CreateNoteCommand, CreateNoteDto>
    {
        private readonly ICurrentUserService _currentUserService;
        private readonly IJobAppRepository _jobAppRepository;
        private readonly INoteRepository _noteRepository;

        public CreateNoteHandler(
            ICurrentUserService currentUserService,
            IJobAppRepository jobAppRepository,
            INoteRepository noteRepository
        )
        {
            _currentUserService = currentUserService;
            _noteRepository = noteRepository;
            _jobAppRepository = jobAppRepository;
        }

        public async Task<CreateNoteDto> Handle(
            CreateNoteCommand request,
            CancellationToken cancellationToken
        )
        {
            var userId = _currentUserService.UserId;
            if (request.JobAppId is Guid jobAppId)
            {
                _ = await _jobAppRepository.GetByIdAsync(jobAppId)
                    ?? throw new NotFoundException("Job application not found.");
            }
            var note = Note.Create(
                content: request.Content,
                userId: userId,
                jobAppId: request.JobAppId
            );
            var NewNote = await _noteRepository.AddAsync(note);

            await _noteRepository.SaveChangesAsync();

            return NotesMapper.ToCreateNoteDto(NewNote);
        }
    }
}
