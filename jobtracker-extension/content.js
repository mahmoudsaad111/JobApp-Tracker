(() => {
  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const meta = (selector) => clean(document.querySelector(selector)?.content);
  const textOf = (selector) => clean(document.querySelector(selector)?.innerText || document.querySelector(selector)?.textContent);

  function readJob() {
    const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
    const jsonLd = scripts.map(script => { try { return JSON.parse(script.textContent); } catch { return null; } }).find(value => value && (value['@type'] === 'JobPosting' || value?.['@type']?.includes?.('JobPosting')));
    const bodyText = document.body?.innerText || '';
    const isLinkedIn = /linkedin\.com$/i.test(globalThis.location.hostname) || /linkedin/i.test(document.title);
    const first = (selectors) => selectors.map(textOf).find(Boolean) || '';
    const pick = (patterns) => { for (const pattern of patterns) { const match = bodyText.match(pattern); if (match?.[1]) return clean(match[1]); } return ''; };

    // The actual H1 is the job title on LinkedIn. og:title is the full browser title,
    // e.g. “Fullstack Developer | gtcsau Global Trend | LinkedIn”, so it is fallback only.
    const heading = first(isLinkedIn ? [
      'h1.jobs-unified-top-card__job-title',
      'h1.job-details-jobs-unified-top-card__job-title',
      'main h1', 'h1'
    ] : ['h1']);
    const rawTitle = heading || jsonLd?.title || meta('meta[property="og:title"]') || document.title;
    const title = clean(rawTitle.replace(/\s*[|\-–]\s*LinkedIn\s*$/i, '').split(/\s+\|\s+/)[0]);

    const company = clean(jsonLd?.hiringOrganization?.name) || first(isLinkedIn ? [
      'a[href*="/company/"]',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name'
    ] : ['[class*="company"]', '[class*="employer"]', '[data-company]']) || meta('meta[property="og:site_name"]') || meta('meta[name="author"]') || pick([/(?:company|employer)\s*[:\-]\s*([^\n]+)/i]);
    const jobLocation = clean(jsonLd?.jobLocation?.address?.addressLocality || jsonLd?.jobLocation?.address?.addressRegion) || first(isLinkedIn ? [
      '.job-details-jobs-unified-top-card__primary-description-container',
      '.jobs-unified-top-card__bullet'
    ] : []) || pick([/(?:location|based in)\s*[:\-]\s*([^\n]+)/i]);

    const linkedinSection = isLinkedIn ? extractLinkedInJobSection(bodyText) : '';
    const descriptionNode = first(isLinkedIn ? [
      '.jobs-description__content',
      '.jobs-box__html-content',
      '#job-details',
      '[class*="jobs-description"]'
    ] : ['[class*="job-description"]', '[class*="jobDescription"]', '[data-testid*="description"]', 'article']);
    const description = linkedinSection || clean(jsonLd?.description?.replace(/<[^>]+>/g, ' ')) || meta('meta[name="description"]') || descriptionNode || (isLinkedIn ? '' : bodyText.slice(0, 4000));

    const structuredSkills = jsonLd?.skills || jsonLd?.qualifications || '';
    const skillSection = first(isLinkedIn ? ['[class*="skills-section"]', '[data-testid*="skills"]', '[class*="qualification"]'] : ['[class*="skill"]', '[class*="requirement"]', '[class*="qualification"]']);
    const skillText = String(structuredSkills || skillSection || meta('meta[name="keywords"]') || '');
    const knownSkills = ['JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', '.NET', 'C#', 'ASP.NET', 'Python', 'Java', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Git', 'HTML', 'CSS', 'Figma', 'REST', 'GraphQL', 'Excel'];
    const detectedSkills = knownSkills.filter(skill => new RegExp(`(^|[^a-z])${skill.replace('.', '\\.')}([^a-z]|$)`, 'i').test(bodyText));
    const requiredSkills = [...new Set(skillText.split(/[,;|\n]/).map(value => clean(value.replace(/^[-*•]\s*/, ''))).filter(value => value.length > 1 && value.length < 60 && !/^(skills|requirements|qualifications)$/i.test(value)).concat(detectedSkills))].slice(0, 30);

    return { title, company, location: jobLocation, description: description.slice(0, 4000), requiredSkills, rawText: bodyText, workMode: /remote/i.test(`${jobLocation} ${bodyText.slice(0, 2500)}`) ? 'Remote' : /hybrid/i.test(bodyText.slice(0, 4000)) ? 'Hybrid' : 'Onsite', jobType: /intern(ship)?/i.test(bodyText) ? 'Internship' : /contract/i.test(bodyText) ? 'Contract' : 'FullTime' };
  }

  function extractLinkedInJobSection(bodyText) {
    const startMatch = bodyText.match(/(?:^|\n)\s*about the job\s*(?:\n|$)/i);
    if (!startMatch || startMatch.index == null) return '';
    const start = startMatch.index + startMatch[0].length;
    const remainder = bodyText.slice(start);
    const endMatch = remainder.match(/\n\s*(?:about the company|people you can reach out to|meet the hiring team|similar jobs|more jobs like this|report this job|set alert|show (?:more|less))\s*(?:\n|$)/i);
    const section = endMatch ? remainder.slice(0, endMatch.index) : remainder;
    return clean(section).slice(0, 4000);
  }

  let lastJobSignature = '';
  let changeTimer;
  const notifyJobChange = () => {
    clearTimeout(changeTimer);
    changeTimer = setTimeout(() => {
      const signature = `${document.title}|${document.querySelector('h1')?.innerText || ''}|${document.querySelector('[class*="jobs-description"]')?.innerText?.slice(0, 100) || ''}`;
      if (signature && signature !== lastJobSignature) {
        lastJobSignature = signature;
        chrome.runtime.sendMessage({ type: 'JOB_PAGE_CHANGED' }).catch(() => {});
      }
    }, 500);
  };
  if (document.body) new MutationObserver(notifyJobChange).observe(document.body, { childList: true, subtree: true, characterData: true });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { if (message.type === 'GET_JOB_DATA') sendResponse(readJob()); return true; });
})();
