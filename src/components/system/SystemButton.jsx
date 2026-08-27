import { clsx } from '../../lib/clsx';
import { play } from '../../lib/sound';

const VARIANTS = {
  primary: 'sys-btn-primary',
  default: '',
  ghost: 'sys-btn-ghost',
  danger: 'sys-btn-danger',
};

export function SystemButton({
  children,
  variant = 'default',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  className,
  as: Component = 'button',
  size = 'md',
  cue = 'tap',
  onClick,
  ...rest
}) {
  const sizing = size === 'sm' ? '!px-3 !py-1.5 !text-xs !min-h-[36px]' : size === 'lg' ? '!px-6 !py-4 !text-base' : '';
  return (
    <Component
      className={clsx('sys-btn', VARIANTS[variant], sizing, className)}
      disabled={loading || rest.disabled}
      onClick={(e) => {
        if (cue) play(variant === 'primary' ? 'confirm' : cue);
        onClick?.(e);
      }}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon size={16} className="shrink-0" />
      )}
      {children}
      {IconRight && <IconRight size={16} className="shrink-0" />}
    </Component>
  );
}

export default SystemButton;
