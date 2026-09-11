/* Shared review model for the browser and portable report. */
(function (factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else globalThis.UIReview = factory();
})(function () {
  const propertyNames = { fontWeight: 'weight', fontSize: 'text size', borderRadius: 'corner radius', padding: 'padding' };
  const cssNames = { fontWeight: 'font-weight', fontSize: 'font-size', borderRadius: 'border-radius', padding: 'padding' };
  const imageURL = value => typeof value === 'string' && /^\/ui-audit\/[a-z0-9][a-z0-9._-]*\.(?:png|webp)$/i.test(value);
  const checkId = check => `ui-check-${encodeURIComponent(check.key || `${check.pageId}-${check.scenario}`)}`;
  const elementName = (tag, label) => `${/^H[1-6]$/.test(tag) ? 'Heading' : tag === 'BUTTON' ? 'Button' : tag === 'LABEL' ? 'Label' : tag} “${label}”`;
  function styles(check) {
    return (check.findings || []).flatMap(finding => {
      const match = finding.match(/^(H[1-6]|BUTTON|LABEL):(.+?) · (.+)$/);
      if (!match) return [];
      return [...match[3].matchAll(/(fontWeight|fontSize|borderRadius|padding): production (.+?) → prototype (.+?)(?=; |\.$|$)/g)].map(part => ({
        element: elementName(match[1], match[2]), kind: /^H/.test(match[1]) ? 'Heading' : match[1] === 'BUTTON' ? 'Button' : 'Label',
        property: part[1], production: part[2], prototype: part[3], source: finding,
      }));
    });
  }
  function recommendation(style) {
    const css = cssNames[style.property];
    if (style.kind === 'Heading' && style.property === 'fontWeight' && style.prototype === '600') return 'Use font-weight: var(--m__font-weight-bold) in the shared page and card heading styles. The design system token is 600; remove local 700 overrides.';
    if (style.kind === 'Button' && style.property === 'fontSize' && Math.abs(parseFloat(style.prototype) / parseFloat(style.production) - .8) < .001) return 'Use font-size: var(--m__font-size-s) for these compact actions in the shared button or action-row style. Keep the responsive token instead of hard-coding the measured pixel size.';
    return `Set ${css} to ${style.prototype} in the shared ${style.kind.toLowerCase()} style for the listed elements. Match the prototype component before applying this change to other variants.`;
  }
  function buildReview(checks, routes = []) {
    const routeMap = new Map(routes.map(route => [route.id, route]));
    const complete = checks.filter(check => (!routes.length || routeMap.has(check.pageId)) && imageURL(check.screenshots?.prototype) && imageURL(check.screenshots?.production));
    const candidates = new Map();
    for (const check of complete) {
      const route = routeMap.get(check.pageId);
      if ((route && check.fingerprint !== route.fingerprint) || ['blocked', 'error'].includes(check.status)) continue;
      for (const style of styles(check)) {
        const signature = JSON.stringify([style.kind, style.property, style.production, style.prototype, check.viewport, check.theme, check.role]);
        if (!candidates.has(signature)) candidates.set(signature, { ...style, signature, affected: new Map() });
        const group = candidates.get(signature);
        if (!group.affected.has(check)) group.affected.set(check, []);
        group.affected.get(check).push(style.element);
      }
    }
    const shared = [...candidates.values()].filter(group => new Set([...group.affected.keys()].map(check => check.pageId)).size >= 2).map((group, index) => ({
      id: `ui-style-${group.kind.toLowerCase()}-${group.property}-${index + 1}`, title: `${group.kind} ${propertyNames[group.property]}`,
      property: cssNames[group.property], prototype: group.prototype, production: group.production,
      recommendation: recommendation(group),
      affected: [...group.affected].map(([check, elements]) => ({ check, anchor: checkId(check), title: check.title || routeMap.get(check.pageId)?.title || check.pageId, scenario: check.scenario, elements: [...new Set(elements)] })),
      matches: group,
    }));
    // Explicitly reviewed shared issues can start with one confirmed location.
    const reviewedGroups = new Map();
    for (const check of complete) {
      const route = routeMap.get(check.pageId);
      if ((route && check.fingerprint !== route.fingerprint) || ['blocked', 'error'].includes(check.status)) continue;
      for (const issue of check.sharedIssues || []) {
        if (!issue || !['id', 'title', 'prototype', 'production', 'recommendation', 'element'].every(key => typeof issue[key] === 'string') || !/^[a-z0-9-]+$/.test(issue.id)) continue;
        if (!reviewedGroups.has(issue.id)) reviewedGroups.set(issue.id, { ...issue, property: issue.property || "color", id: `ui-issue-${issue.id}`, affected: [], matches: {} });
        reviewedGroups.get(issue.id).affected.push({ check, anchor: checkId(check), title: check.title || routeMap.get(check.pageId)?.title || check.pageId, scenario: check.scenario, elements: [issue.element] });
      }
    }
    shared.push(...reviewedGroups.values());
    const byCheck = new Map();
    for (const check of complete) {
      const sharedForCheck = shared.filter(group => group.affected.some(item => item.check === check));
      const covered = new Set(sharedForCheck.flatMap(group => styles(check).filter(style => style.kind === group.matches.kind && style.property === group.matches.property && style.production === group.production && style.prototype === group.prototype).map(style => `${style.source}:${style.property}`)));
      let elements;
      if (Array.isArray(check.reviewedElements)) elements = check.reviewedElements.filter(item => item && typeof item.element === 'string' && typeof item.difference === 'string');
      else if (Array.isArray(check.reviewedFindings)) elements = check.reviewedFindings.map(difference => ({ element: '', difference }));
      else elements = (check.findings || []).flatMap(finding => {
        const measured = styles({ findings: [finding] });
        if (measured.length) return measured.filter(style => !covered.has(`${finding}:${style.property}`)).map(style => ({ element: style.element, difference: `${cssNames[style.property]}: production ${style.production} → prototype ${style.prototype}.` }));
        if (/^(?:[\d.]+% of image pixels differ|Full-page dimensions differ)/.test(finding)) return [];
        const match = finding.match(/^(Headings|Table columns|Controls) only in (prototype|production): (.+)$/);
        return [{ element: match ? match[1] : '', difference: match ? `Only visible in ${match[2]}: ${match[3]} Confirm equivalent content and permissions before treating these as missing elements.` : finding }];
      });
      byCheck.set(check, { elements, notes: Array.isArray(check.comparisonNotes) ? check.comparisonNotes : [], shared: sharedForCheck, reviewed: Array.isArray(check.reviewedElements) || Array.isArray(check.reviewedFindings) });
    }
    return { byCheck, shared };
  }
  return { buildReview, checkId };
});
