/**
 * Checks if a domain matches a glob pattern.
 * Supports:
 * - `*` (wildcard, matches any number of characters)
 * - `?` (matches single character)
 * - Exact match
 */
export function matchesDomain(domain: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern === domain) return true;

    // Escape special regex characters except * and ?
    const escapeRegex = (str: string) => str.replace(/([.+^=!:${}()|\[\]\/\\])/g, "\\$1");

    // Convert glob to regex
    // * becomes .*
    // ? becomes .
    const regexPattern = `^${pattern.split('*').map(escapeRegex).join('.*').replace(/\?/g, '.')}$`;
    const regex = new RegExp(regexPattern, 'i'); // Case insensitive

    return regex.test(domain);
}

/**
 * Checks if a domain matches any rule in the list and returns the action.
 * Returns null if no match found.
 * Priority: Last matching rule wins (or first? usually first or specificity, but let's stick to list order or specific logic).
 * User doc: "Site Rule > Global Policy".
 * Here we check specific rules.
 */
export function matchRule(domain: string, rules: { domain: string, action: 'allow' | 'block' }[]): 'allow' | 'block' | null {
    // We'll iterate through rules. If multiple match, which one wins?
    // Usually the MOST SPECIFIC one, or the user ordered list.
    // Let's assume the rules list is ordered by priority (top to bottom) or we find the first match.
    // For MVP, let's find the FIRST match? OR all matches?
    // Let's assume rules are evaluated in order.

    for (const rule of rules) {
        if (matchesDomain(domain, rule.domain)) {
            return rule.action;
        }
    }
    return null;
}
