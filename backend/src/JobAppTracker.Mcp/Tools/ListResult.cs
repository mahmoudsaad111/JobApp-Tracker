namespace JobAppTracker.Mcp.Tools;

// Wraps a capped list so the AI model knows when results were cut off.
public sealed record ListResult<T>(int Total, int Returned, List<T> Items)
{
    public const int MaxItems = 50;

    public static ListResult<T> From(IEnumerable<T> source)
    {
        var all = source.ToList();
        var items = all.Take(MaxItems).ToList();
        return new ListResult<T>(all.Count, items.Count, items);
    }
}
