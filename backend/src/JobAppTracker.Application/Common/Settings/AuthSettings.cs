namespace JobAppTracker.Application.Common.Settings
{
    /// <summary>
    /// Login-cookie settings. Bound from the "Auth" section of appsettings.json
    /// (or environment variables like Auth__SecureCookie).
    /// </summary>
    public class AuthSettings
    {
        public const string SectionName = "Auth";

        /// <summary>Hard limit: after this many days the user must log in again, even if active.</summary>
        public double AbsoluteSessionDays { get; set; } = 7;

        /// <summary>Idle limit: logged out after this many hours without any request.</summary>
        public double SlidingSessionExpireHours { get; set; } = 2;

        /// <summary>true = cookie is only sent over HTTPS. Keep false for local http, true in production.</summary>
        public bool SecureCookie { get; set; } = false;

        /// <summary>Lax, Strict or None. "None" requires SecureCookie = true.</summary>
        public string SameSite { get; set; } = "Lax";

        /// <summary>Name of the key stored inside the cookie to remember when the login started.</summary>
        public const string SessionStartKey = "session_start";
    }
}
