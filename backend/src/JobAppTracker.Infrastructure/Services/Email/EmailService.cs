using JobAppTracker.Application.Common.Settings;
using JobAppTracker.Application.Interfaces.Services.Email;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace JobAppTracker.Infrastructure.Services.Email
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;

        public EmailService(IOptions<EmailSettings> emailSettings)
        {
            _emailSettings = emailSettings.Value;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
            email.To.Add(MailboxAddress.Parse(to));
            email.Subject = subject;
            email.Body = new TextPart("html") { Text = body };

            using var smtp = new SmtpClient();
            smtp.Timeout = 10000; // 10 seconds timeout

            await smtp.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.Port, SecureSocketOptions.StartTls);
            Console.WriteLine("EMAIL: Connected to SMTP");

            await smtp.AuthenticateAsync(_emailSettings.SenderEmail, _emailSettings.Password);
            Console.WriteLine("EMAIL: Authenticated");

            await smtp.SendAsync(email);
            Console.WriteLine("EMAIL: Sent successfully");

            await smtp.DisconnectAsync(true);
        }
    }
}