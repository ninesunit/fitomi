import { HunterAvatar } from '../avatar/HunterAvatar';
import { BODY_TYPES } from '../../engine/physique';
import { play } from '../../lib/sound';
import { clsx } from '../../lib/clsx';

// ---------------------------------------------------------------------------
// Body type, picked by looking rather than reading.
//
// Four silhouettes drawn by the same engine that draws the hunter's avatar, so
// what they choose here is literally the figure they will see on their status
// screen — no translation layer between the question and the answer.
// ---------------------------------------------------------------------------

export function BodyTypePicker({ value, onChange, sex }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {BODY_TYPES.map((type) => {
        const on = value === type.id;
        return (
          <button
            key={type.id}
            type="button"
            data-selected={on}
            onClick={() => { play('select'); onChange(type.id); }}
            className={clsx(
              'flex flex-col items-center gap-1 p-2 pt-3 transition-colors',
              'border',
              on
                ? 'border-[rgb(var(--sys))] bg-[rgb(var(--sys)/0.14)]'
                : 'border-[rgb(var(--sys)/0.25)] bg-[rgb(var(--sys-deep-2)/0.5)]',
            )}
            style={{
              clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)',
            }}
          >
            <HunterAvatar
              className="h-[104px] w-[64px]"
              bodyType={type.id}
              sex={sex}
              stats={{}}
              color={on ? '#26bdff' : '#8ea6c4'}
              aura={on}
              motes={false}
              breathe={on}
            />
            <span
              className={clsx(
                'text-[14px] font-semibold leading-tight',
                on ? 'text-[rgb(var(--sys-ink))]' : 'text-[rgb(var(--sys-dim))]',
              )}
            >
              {type.name}
            </span>
            <span className="text-[10px] leading-tight text-[rgb(var(--sys-dim))]">{type.detail}</span>
          </button>
        );
      })}
    </div>
  );
}

export default BodyTypePicker;
