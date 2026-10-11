using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Text;

namespace JobAppTracker.Application.Features.Authentication.DTOs
{
    public record RegisterResultDto
    {
        public string Email { get; set; }

        public string? Message { get; set; }

        /// <summary>False when the account was created but the confirmation email could not be sent.</summary>
        public bool EmailSent { get; set; } = true;
    }
}
