/** Compact, display-only labels for gateway calls. Never rename the wire tool. */
export function toolLabel(name: string | undefined, args: unknown): string {
  const base = name || 'tool';
  if (name !== 'discover' && name !== 'invoke') return base;
  if (!args || typeof args !== 'object' || Array.isArray(args)) return base;
  const fields = args as Record<string, unknown>;
  // Discovery can target a component, a named tool, or just a query. A query
  // alone is not a target; leave the label unchanged rather than inventing one.
  const target = name === 'discover'
    ? (fields.component || (Array.isArray(fields.tools) && fields.tools.length === 1 ? fields.tools[0] : undefined))
    : fields.tool;
  if (typeof target !== 'string' || !target.trim()) return base;
  return `${base}(${target.trim()})`;
}
