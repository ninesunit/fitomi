import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

const TONES = {
  info: { icon: Info, color: 'text-system-300', ring: 'border-system-400/40' },
  success: { icon: CheckCircle2, color: 'text-mana-400', ring: 'border-mana-500/40' },
  warn: { icon: AlertTriangle, color: 'text-gold-400', ring: 'border-gold-500/40' },
  error: { icon: XCircle, color: 'text-blood-400', ring: 'border-blood-500/40' },
};

export function Toasts() {
  const { toasts, dismissToast } = useSystem();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3">
      <AnimatePresence>
        {toasts.map((toast) => {
          const tone = TONES[toast.tone] || TONES.info;
          const Icon = tone.icon;
          return (
            <motion.button
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              onClick={() => dismissToast(toast.id)}
              className={`panel pointer-events-auto flex max-w-md items-center gap-2.5 border ${tone.ring} px-4 py-2.5 text-left text-sm text-slate-200 shadow-lg`}
            >
              <Icon size={16} className={`${tone.color} shrink-0`} />
              <span>{toast.message}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default Toasts;
