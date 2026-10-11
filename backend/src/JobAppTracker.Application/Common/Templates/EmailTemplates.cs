using System.Net;

namespace JobAppTracker.Application.Common.Templates
{
    /// <summary>
    /// HTML emails that match the app's look: Inter font, indigo primary, the
    /// indigo-violet-fuchsia accent, slate text, rounded cards, and a dark mode.
    /// Built with tables and inline styles because email clients ignore most modern CSS.
    /// Every value that comes from a user or a URL is HTML-encoded before it is inserted.
    /// </summary>
    public static class EmailTemplates
    {
        private const string AppName = "JobTracker";

        /// <summary>How long confirm/reset links work. Identity is configured with the same value.</summary>
        public const int LinkValidHours = 24;

        public const string ConfirmEmailSubject = "Confirm your email for JobTracker";
        public const string ResetPasswordSubject = "Reset your JobTracker password";

        public static string ConfirmEmail(string? firstName, string link) =>
            Render(
                preheader: "Confirm your email address to start tracking your applications.",
                heading: "Confirm your email",
                intro: $"{Greeting(firstName)} Welcome to {AppName}. Confirm your email address to activate your account and start tracking your applications.",
                buttonText: "Confirm email",
                link: link,
                note: $"This link expires in {LinkValidHours} hours. If you didn't create an account, you can ignore this email."
            );

        public static string ResetPassword(string? firstName, string link) =>
            Render(
                preheader: "Use this link to choose a new password.",
                heading: "Reset your password",
                intro: $"{Greeting(firstName)} We received a request to reset the password for your {AppName} account. Choose a new one with the button below.",
                buttonText: "Reset password",
                link: link,
                note: $"This link expires in {LinkValidHours} hours. If you didn't ask for this, you can ignore this email. Your password won't change."
            );

        private static string Greeting(string? firstName) =>
            string.IsNullOrWhiteSpace(firstName)
                ? "Hi there,"
                : $"Hi {WebUtility.HtmlEncode(firstName.Trim())},";

        private static string Render(
            string preheader,
            string heading,
            string intro,
            string buttonText,
            string link,
            string note
        )
        {
            var safeLink = WebUtility.HtmlEncode(link);

            return $$"""
                <!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta name="color-scheme" content="light dark">
                <meta name="supported-color-schemes" content="light dark">
                <title>{{heading}}</title>
                <style>
                  @media (prefers-color-scheme: dark) {
                    .bg { background-color: #0a0f1e !important; }
                    .card { background-color: #131b2e !important; border-color: #263047 !important; }
                    .title { color: #f1f5f9 !important; }
                    .text { color: #cbd5e1 !important; }
                    .muted { color: #94a3b8 !important; }
                    .divider { border-top-color: #263047 !important; }
                  }
                  @media only screen and (max-width: 520px) {
                    .container { width: 100% !important; }
                    .pad { padding: 28px 20px !important; }
                  }
                </style>
                </head>
                <body class="bg" style="margin:0;padding:0;background-color:#f8fafc;">
                <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{{preheader}}</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg" style="background-color:#f8fafc;">
                  <tr>
                    <td align="center" style="padding:32px 16px;">
                      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" class="container" style="width:560px;max-width:560px;">

                        <!-- Brand -->
                        <tr>
                          <td style="padding:0 4px 20px 4px;font-family:Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="36" height="36" align="center" valign="middle" bgcolor="#6366f1" style="width:36px;height:36px;border-radius:10px;background-color:#6366f1;background-image:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;font-size:18px;font-weight:700;font-family:Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">J</td>
                                <td style="padding-left:10px;font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#4f46e5;font-family:Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">{{AppName}}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Card -->
                        <tr>
                          <td class="card" style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td height="4" bgcolor="#7c3aed" style="height:4px;line-height:4px;font-size:0;background-color:#7c3aed;background-image:linear-gradient(90deg,#4f46e5,#7c3aed,#d946ef);">&nbsp;</td>
                              </tr>
                              <tr>
                                <td class="pad" style="padding:36px 36px 32px 36px;font-family:Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                                  <h1 class="title" style="margin:0 0 14px 0;font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:#0f172a;">{{heading}}</h1>
                                  <p class="text" style="margin:0 0 28px 0;font-size:15px;line-height:1.6;color:#475569;">{{intro}}</p>

                                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                      <td align="center" bgcolor="#6366f1" style="border-radius:10px;background-color:#6366f1;">
                                        <a href="{{safeLink}}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;font-family:Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">{{buttonText}}</a>
                                      </td>
                                    </tr>
                                  </table>

                                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
                                    <tr>
                                      <td class="divider" style="border-top:1px solid #e2e8f0;padding-top:18px;">
                                        <p class="muted" style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">{{note}}</p>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td align="center" class="muted" style="padding:20px 8px 0 8px;font-size:12px;line-height:1.6;color:#94a3b8;font-family:Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            {{AppName}} &middot; Track applications, interviews and documents in one place.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                </body>
                </html>
                """;
        }
    }
}
