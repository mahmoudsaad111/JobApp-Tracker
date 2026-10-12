// Injected on demand by the popup (chrome.scripting.executeScript) — it is NOT
// loaded on every page. It reads the page once and returns the result.
(() => {
  const DESCRIPTION_MAX = 1000; // the backend rejects longer descriptions

  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const meta = (selector) => clean(document.querySelector(selector)?.content);
  const textOf = (selector) => {
    const el = document.querySelector(selector);
    return clean(el?.innerText || el?.textContent);
  };
  const first = (selectors) => selectors.map(textOf).find(Boolean) || '';
  // Same as textOf, but keeps the line breaks (needed to find "Requirements" etc.).
  const rawTextOf = (selectors) => {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      const text = (el?.innerText || '').trim();
      if (text.length > 80) return text;
    }
    return '';
  };

  const isLinkedIn = /linkedin\.com$/i.test(location.hostname);

  // Read the page text ONCE (innerText forces layout, so it is expensive).
  const bodyText = (document.body?.innerText || '').slice(0, 60000);
  const pick = (patterns) => {
    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match?.[1]) return clean(match[1]);
    }
    return '';
  };

  function findJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        const items = Array.isArray(data) ? data : data['@graph'] || [data];
        const job = items.find((v) => v && (v['@type'] === 'JobPosting' || v['@type']?.includes?.('JobPosting')));
        if (job) return job;
      } catch {
        /* ignore invalid JSON-LD */
      }
    }
    return null;
  }

  // HTML description -> plain text that still has one item per line.
  function htmlToLines(html) {
    return String(html || '')
      .replace(/<\s*li[^>]*>/gi, '\n- ')
      .replace(/<\s*(br|\/p|\/li|\/ul|\/ol|\/div|\/h\d)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&quot;/g, '"');
  }

  // LinkedIn: the text between "About the job" and the next block, line breaks kept.
  function linkedInSectionLines() {
    const startMatch = bodyText.match(/(?:^|\n)\s*about the job\s*(?:\n|$)/i);
    if (!startMatch || startMatch.index == null) return '';
    const remainder = bodyText.slice(startMatch.index + startMatch[0].length);
    const endMatch = remainder.match(
      /\n\s*(?:about the company|people you can reach out to|meet the hiring team|similar jobs|more jobs like this|report this job|set alert|show (?:more|less))\s*(?:\n|$)/i
    );
    return (endMatch ? remainder.slice(0, endMatch.index) : remainder).slice(0, 8000);
  }

  // ---------- Pick the important parts of a long description ----------
  const HEAD_REQ = /^(?:key\s+)?(?:requirements?|qualifications?|minimum qualifications?|basic qualifications?|preferred qualifications?|what you(?:'|’)ll need|what you need|what we(?:'|’)re looking for|who you are|you have|must[- ]haves?|skills?(?: (?:and|&) experience)?|experience|your profile|technical skills|nice to have)\s*:?\s*$/i;
  const HEAD_RESP = /^(?:key\s+)?(?:responsibilities|what you(?:'|’)ll do|what you will do|the role|your role|role overview|duties|your mission|day[- ]to[- ]day|about the role|overview|job (?:summary|description))\s*:?\s*$/i;
  const HEAD_SKIP = /^(?:benefits|perks|what we offer|we offer|about (?:us|the company|[\w .&-]{0,30})|equal opportunity.*|why join.*|compensation.*|our culture|how to apply|salary.*)\s*:?\s*$/i;
  const KEY_LINE = /\b(\d+\+?\s*(?:years?|yrs?)|experience|proficien\w*|knowledge|degree|bachelor|required|must|familiar\w*|ability|skills?)\b/i;

  const shorten = (line, n = 200) => (line.length > n ? line.slice(0, n - 1).trimEnd() + '…' : line);

  // Add bullet lines until the character budget is used up (never cuts mid-line).
  function take(lines, budget) {
    const out = [];
    let used = 0;
    for (const line of lines) {
      const item = `- ${shorten(line)}`;
      if (used + item.length + 1 > budget) {
        // Use the leftover space with a shortened last line instead of wasting it.
        const room = budget - used - 1;
        if (room > 60) out.push(item.slice(0, room - 1).trimEnd() + '…');
        break;
      }
      out.push(item);
      used += item.length + 1;
    }
    return out.join('\n');
  }

  function summarize(text) {
    const lines = String(text || '')
      .split('\n')
      .map((l) => l.replace(/\s+/g, ' ').trim().replace(/^[-*•·▪●–]\s*/, ''))
      .filter((l) => l.length > 2);
    if (!lines.length) return '';

    const sections = { req: [], resp: [], other: [] };
    let current = 'other';
    for (const line of lines) {
      if (line.length <= 60) {
        if (HEAD_REQ.test(line)) { current = 'req'; continue; }
        if (HEAD_RESP.test(line)) { current = 'resp'; continue; }
        if (HEAD_SKIP.test(line)) { current = 'skip'; continue; }
      }
      if (current !== 'skip') sections[current].push(line);
    }

    const blocks = [];
    if (sections.req.length || sections.resp.length) {
      // Requirements matter most. Responsibilities only reserve what they need (max ~35%),
      // so requirements get all the rest and no space is wasted.
      const OVERHEAD = 40; // the two headings
      const respReserve = sections.resp.length
        ? take(sections.resp, Math.floor(DESCRIPTION_MAX * 0.35)).length
        : 0;
      const req = take(sections.req, DESCRIPTION_MAX - OVERHEAD - respReserve);
      if (req) blocks.push(`Requirements:\n${req}`);
      const left = DESCRIPTION_MAX - OVERHEAD - req.length;
      const resp = take(sections.resp, left);
      if (resp) blocks.push(`Responsibilities:\n${resp}`);
    }

    if (!blocks.length) {
      // No headings found: keep lines that sound like requirements first, then the rest in order.
      const key = sections.other.filter((l) => KEY_LINE.test(l));
      const rest = sections.other.filter((l) => !KEY_LINE.test(l));
      const keyText = take(key, Math.floor(DESCRIPTION_MAX * 0.64));
      if (keyText) blocks.push(`Key points:\n${keyText}`);
      const left = DESCRIPTION_MAX - blocks.join('\n\n').length - 20;
      const restText = take(rest, left);
      if (restText) blocks.push(restText);
    }

    return blocks.join('\n\n').slice(0, DESCRIPTION_MAX);
  }

  const jsonLd = findJsonLd();

  // On LinkedIn the real H1 is the job title; og:title is the whole browser title.
  const heading = first(
    isLinkedIn
      ? ['h1.jobs-unified-top-card__job-title', 'h1.job-details-jobs-unified-top-card__job-title', 'main h1', 'h1']
      : ['h1']
  );
  const rawTitle = heading || jsonLd?.title || meta('meta[property="og:title"]') || document.title;
  const title = clean(String(rawTitle).replace(/\s*[|\-–]\s*LinkedIn\s*$/i, '').split(/\s+\|\s+/)[0]);

  const company =
    clean(jsonLd?.hiringOrganization?.name) ||
    first(
      isLinkedIn
        ? ['.job-details-jobs-unified-top-card__company-name', '.jobs-unified-top-card__company-name', 'a[href*="/company/"]']
        : ['[class*="company"]', '[class*="employer"]', '[data-company]']
    ) ||
    meta('meta[property="og:site_name"]') ||
    meta('meta[name="author"]') ||
    pick([/(?:company|employer)\s*[:\-]\s*([^\n]+)/i]);

  const location_ =
    clean(jsonLd?.jobLocation?.address?.addressLocality || jsonLd?.jobLocation?.address?.addressRegion) ||
    first(
      isLinkedIn
        ? ['.job-details-jobs-unified-top-card__primary-description-container', '.jobs-unified-top-card__bullet']
        : []
    ) ||
    pick([/(?:location|based in)\s*[:\-]\s*([^\n]+)/i]);

  // The full description with line breaks, from the best source available.
  const fullDescription =
    (isLinkedIn ? linkedInSectionLines() : '') ||
    htmlToLines(jsonLd?.description) ||
    rawTextOf(
      isLinkedIn
        ? ['.jobs-description__content', '.jobs-box__html-content', '#job-details', '[class*="jobs-description"]']
        : ['[class*="job-description"]', '[class*="jobDescription"]', '[data-testid*="description"]', 'article']
    ) ||
    (isLinkedIn ? '' : bodyText.slice(0, 8000));

  // Short, useful version for the form (requirements first), or the meta description as a last resort.
  const description = summarize(fullDescription) || meta('meta[name="description"]').slice(0, DESCRIPTION_MAX);

  const skillText = String(
    jsonLd?.skills ||
      jsonLd?.qualifications ||
      first(
        isLinkedIn
          ? ['[class*="skills-section"]', '[data-testid*="skills"]', '[class*="qualification"]']
          : ['[class*="skill"]', '[class*="requirement"]', '[class*="qualification"]']
      ) ||
      meta('meta[name="keywords"]') ||
      ''
  );
  const knownSkills = ['JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', '.NET', 'C#', 'ASP.NET', 'Python', 'Java', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Git', 'HTML', 'CSS', 'Figma', 'REST', 'GraphQL', 'Excel'];
  // Look for skills in the whole description, not only the short summary.
  const haystack = `${fullDescription} ${skillText}`;
  const detectedSkills = knownSkills.filter((skill) =>
    new RegExp(`(^|[^a-z])${skill.replace(/[.+#]/g, '\\$&')}([^a-z]|$)`, 'i').test(haystack)
  );
  const requiredSkills = [
    ...new Set(
      skillText
        .split(/[,;|\n]/)
        .map((v) => clean(v.replace(/^[-*•]\s*/, '')))
        .filter((v) => v.length > 1 && v.length <= 50 && !/^(skills|requirements|qualifications)$/i.test(v))
        .concat(detectedSkills)
    ),
  ].slice(0, 30);

  const head = bodyText.slice(0, 2500);
  const workMode = /remote/i.test(`${location_} ${head}`) ? 'Remote' : /hybrid/i.test(bodyText.slice(0, 4000)) ? 'Hybrid' : 'Onsite';
  const jobType = /intern(ship)?/i.test(head) ? 'Internship' : /contract/i.test(head) ? 'Contract' : 'FullTime';

  // Text for the optional AI parser (server limit is 10,000 characters).
  const rawText = (fullDescription.length > 300
    ? [title, company, location_, clean(fullDescription) === '' ? '' : fullDescription].filter(Boolean).join('\n')
    : bodyText
  ).slice(0, 9500);

  // The value of the last expression is what executeScript returns to the popup.
  return { title, company, location: location_, description, requiredSkills, rawText, workMode, jobType };
})();
