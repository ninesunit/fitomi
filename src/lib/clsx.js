/** Tiny classname joiner — no dependency needed for something this small. */
export function clsx(...args) {
  const out = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === 'string' || typeof arg === 'number') out.push(String(arg));
    else if (Array.isArray(arg)) {
      const nested = clsx(...arg);
      if (nested) out.push(nested);
    } else if (typeof arg === 'object') {
      for (const [key, value] of Object.entries(arg)) if (value) out.push(key);
    }
  }
  return out.join(' ');
}

export default clsx;
