import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import * as social from '../../lib/social';
import { clsx } from '../../lib/clsx';

// ---------------------------------------------------------------------------
// The hunter's name.
//
// It is the identity, not a label: unique across every hunter, shown on every
// leaderboard. Availability is checked as it is typed rather than at submit,
// because discovering your name is taken after finishing a twelve-step
// assessment is the worst possible moment to find out.
//
// Capitalisation is preserved — "ShadowMonarch" displays as written — while
// uniqueness is decided on the lowercase form.
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 450;

export function NameField({ value, onChange, forUid = null, label = 'Hunter name', autoFocus }) {
  const [state, setState] = useState('idle');
  // Guards against a slow early request resolving after a later one and
  // reporting the wrong name's availability.
  const seq = useRef(0);

  const clean = social.cleanName(value || '');
  const valid = social.isValidName(clean);

  useEffect(() => {
    if (!valid) {
      setState(clean.length === 0 ? 'idle' : 'invalid');
      onChange({ name: clean, nameOk: false });
      return undefined;
    }

    setState('checking');
    const ticket = (seq.current += 1);
    const timer = setTimeout(async () => {
      const free = await social.isNameAvailable(clean, forUid);
      if (ticket !== seq.current) return;
      setState(free ? 'free' : 'taken');
      onChange({ name: clean, nameOk: free });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // `onChange` is an inline arrow at every call site; depending on it would
    // restart the check on every keystroke's re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clean, valid, forUid]);

  const tone =
    state === 'free' ? 'rgb(var(--sys-good))'
      : state === 'taken' || state === 'invalid' ? 'rgb(var(--sys-danger))'
        : 'rgb(var(--sys)/0.35)';

  return (
    <div>
      <span className="sys-label mb-1.5 block">{label}</span>
      <div className="relative">
        <input
          className="sys-input pr-10"
          value={value || ''}
          autoFocus={autoFocus}
          maxLength={20}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="ShadowMonarch"
          onChange={(e) => onChange({ name: social.cleanName(e.target.value), nameOk: false })}
          style={{ borderColor: tone }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {state === 'checking' && <Loader2 size={16} className="animate-spin text-[rgb(var(--sys-dim))]" />}
          {state === 'free' && <Check size={16} strokeWidth={3} style={{ color: 'rgb(var(--sys-good))' }} />}
          {(state === 'taken' || state === 'invalid') && (
            <X size={16} strokeWidth={3} style={{ color: 'rgb(var(--sys-danger))' }} />
          )}
        </span>
      </div>

      <p
        className={clsx('mt-1.5 text-[11px] leading-snug')}
        style={{ color: state === 'taken' || state === 'invalid' ? 'rgb(var(--sys-danger))' : 'rgb(var(--sys-dim))' }}
      >
        {state === 'taken' && 'Another hunter already answers to that.'}
        {state === 'invalid' && 'Three to twenty letters, numbers or underscores.'}
        {state === 'free' && 'Available.'}
        {(state === 'idle' || state === 'checking') &&
          'Letters, numbers and underscores. This is how other hunters find you.'}
      </p>
    </div>
  );
}

export default NameField;
