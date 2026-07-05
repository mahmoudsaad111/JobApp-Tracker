using JobAppTracker.Application.Mappers;
using JobAppTracker.Domain.Entities;

namespace JobAppTracker.Application.UnitTests.Mappers;
public class NotesMapperTests
{
    [Fact]
    public void ToGetNoteDto_Maps_All_Fields()
    {
        var userId = Guid.NewGuid();
        var jobApp = JobApplication.Create(userId, "ACME", "Dev", DateTime.UtcNow);
        var note = Note.Create("This is a test note.",userId,jobApp.Id);
        
        var prop = typeof(Note).GetProperty("JobApplication");
        Assert.NotNull(prop);
        prop.SetValue(note, jobApp);

        var dto = NotesMapper.ToGetNoteDto(note);

        Assert.Equal(note.Id, dto.NoteId);
        Assert.Equal(note.JobAppId, dto.JobAppId);
        Assert.Equal(note.Content, dto.Content);
        Assert.Equal(note.CreatedAt, dto.CreatedAt);
        Assert.Equal(note.UpdatedAt, dto.UpdatedAt);
    }
}
