using System.Collections.Generic;
using System.Linq;
using JobAppTracker.Domain.Entities;
using JobAppTracker.Application.Features.Documents.Dtos;
using JobAppTracker.Application.Features.Notes.Dtos;
using JobAppTracker.Application.Features.Interviews.Dtos;
using JobAppTracker.Application.Features.JobApp.Dtos;
using JobAppTracker.Application.Features.Authentication.DTOs;

namespace JobAppTracker.Application.Mappers
{
    public static class MapperExtensions
    {
        public static IEnumerable<GetUserDocumentsDto> ToGetUserDocumentsDto(this IEnumerable<Document> documents)
        {
            return new List<GetUserDocumentsDto> { DocumentsMapper.ToGetUserDocumentsDto(documents) };
        }
    }
}
