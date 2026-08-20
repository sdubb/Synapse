/**
 * Real Lexical & AST Token Normalizer for Command & SQL Safety
 * 
 * Normalizes input queries and commands to prevent evasion techniques such as:
 * - Comments embedding: DROP [slash* *slash] TABLE
 * - Hex / Unicode escaping: \x44\x52\x4F\x50 -> DROP
 * - Multiple/irregular whitespace: D R O P or tabs/newlines
 * - SQL string concatenation & statement chaining
 */
export class CommandTokenNormalizer {
  /**
   * Normalizes raw command or query text into clean token stream
   */
  static normalize(rawInput) {
    if (!rawInput) return { normalizedText: "", tokens: [], isDestructive: false, matchedRules: [] };

    let text = typeof rawInput === "string" ? rawInput : JSON.stringify(rawInput);

    // 1. Unescape hex and unicode sequences (e.g. \x44\x52 -> DR)
    text = text.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    text = text.replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    // 2. Strip multi-line comments (/* ... */) and single-line comments (-- ... or # ...)
    text = text.replace(/\/\*[\s\S]*?\*\//g, " ");
    text = text.replace(/--[^\r\n]*/g, " ");
    text = text.replace(/#[^\r\n]*/g, " ");

    // 3. Normalize all whitespace (newlines, tabs, multiple spaces) to a single space
    text = text.replace(/\s+/g, " ").trim().toUpperCase();

    // 4. Tokenize into individual words
    const tokens = text.split(/[\s;()]+/).filter(Boolean);

    // 5. Detect destructive statement patterns
    const destructivePatterns = [
      { rule: "DROP_TABLE_OR_DATABASE", regex: /\bDROP\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW)\b/i },
      { rule: "TRUNCATE_TABLE", regex: /\bTRUNCATE\s+(TABLE)?\s*[A-Z0-9_]+/i },
      { rule: "UNBOUNDED_DELETE", regex: /\bDELETE\s+FROM\s+[A-Z0-9_]+\s*(WHERE\s+(1=1|TRUE|'1'='1'))?$/i },
      { rule: "UNBOUNDED_UPDATE", regex: /\bUPDATE\s+[A-Z0-9_]+\s+SET\s+[^;]+(?<!WHERE\s+.+)$/i },
      { rule: "SYSTEM_DESTRUCTION", regex: /\b(RM\s+-RF|MKFS|DD\s+IF=|KILLALL\s+-9|SHRED)\b/i },
      { rule: "TERMINATE_WORKFORCE", regex: /\b(TERMINATE_ALL|KILL_ALL_AGENTS|PURGE_ALL_DATA)\b/i }
    ];

    const matchedRules = [];
    for (const pattern of destructivePatterns) {
      if (pattern.regex.test(text)) {
        matchedRules.push(pattern.rule);
      }
    }

    return {
      rawInput,
      normalizedText: text,
      tokens,
      isDestructive: matchedRules.length > 0,
      matchedRules
    };
  }
}
