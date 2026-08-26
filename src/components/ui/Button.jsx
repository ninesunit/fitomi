import { clsx } from '../../lib/clsx';

const VARIANTS = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  subtle: 'bg-transparent text-slate-400 hover:text-slate-100 hover:bg-white/5',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
  icon: 'p-2 rounded-lg',
};

export function Button({
  children,
  variant = 'ghost',
  size = 'md',
  className,
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  as: Component = 'button',
  ...rest
}) {
  return (
    <Component
      className={clsx('btn', VARIANTS[variant], SIZES[size], className)}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        Icon && <Icon size={size === 'lg' ? 20 : 16} className="shrink-0" />
      )}
      {children}
      {IconRight && <IconRight size={16} className="shrink-0" />}
    </Component>
  );
}

export default Button;
