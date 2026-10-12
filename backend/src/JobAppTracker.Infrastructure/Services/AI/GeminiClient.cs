// Infrastructure/Services/AI/GeminiClient.cs
using System.Net.Http.Json;
using System.Text.Json;
using JobAppTracker.Application.Common.Exceptions;
using JobAppTracker.Application.Interfaces.Services.AI;
using Microsoft.Extensions.Options;

namespace JobAppTracker.Infrastructure.Services.AI;

public class GeminiClient : IGeminiClient
{
    private readonly HttpClient _httpClient;
    private readonly GeminiOptions _options;

    public GeminiClient(HttpClient httpClient, IOptions<GeminiOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public async Task<string> GenerateTextAsync(string prompt, CancellationToken ct = default)
        => await SendAsync(prompt, systemInstruction: null, jsonMode: false, ct);

    public async Task<string> GenerateJsonAsync(string prompt, string? systemInstruction = null, CancellationToken ct = default)
        => await SendAsync(prompt, systemInstruction, jsonMode: true, ct);

    private async Task<string> SendAsync(string prompt, string? systemInstruction, bool jsonMode, CancellationToken ct)
    {
        var url = $"v1beta/models/{_options.Model}:generateContent";

        object payload = systemInstruction is null
            ? new
            {
                contents = new[] { new { role = "user", parts = new[] { new { text = prompt } } } },
                generationConfig = jsonMode ? new { responseMimeType = "application/json" } : null
            }
            : new
            {
                system_instruction = new { parts = new[] { new { text = systemInstruction } } },
                contents = new[] { new { role = "user", parts = new[] { new { text = prompt } } } },
                generationConfig = jsonMode ? new { responseMimeType = "application/json" } : null
            };

        var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = JsonContent.Create(payload)
        };
        request.Headers.Add("x-goog-api-key", _options.ApiKey);

        try
        {
            var response = await _httpClient.SendAsync(request, ct);
            response.EnsureSuccessStatusCode();

            var body = await response.Content.ReadFromJsonAsync<GeminiResponse>(cancellationToken: ct);
            var text = body?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;

            if (string.IsNullOrWhiteSpace(text))
                throw new ExternalServiceException("The AI service returned an empty answer. Please try again.");

            return text.Trim();
        }
        catch (HttpRequestException)
        {
            // Provider down, quota/rate limit, bad key, network error...
            throw new ExternalServiceException("The AI service is unavailable right now. Please try again in a moment.");
        }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested)
        {
            // HttpClient timeout (not the user cancelling the request)
            throw new ExternalServiceException("The AI service took too long to respond. Please try again.");
        }
        catch (JsonException)
        {
            throw new ExternalServiceException("The AI service sent an unreadable answer. Please try again.");
        }
    }

    private record GeminiResponse(List<Candidate>? Candidates);
    private record Candidate(GeminiContent? Content);
    private record GeminiContent(List<GeminiPart>? Parts);
    private record GeminiPart(string? Text);
}
