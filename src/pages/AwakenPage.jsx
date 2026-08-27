import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, LogIn } from 'lucide-react';
import { SystemWindow } from '../components/system/SystemWindow';
import { SystemButton } from '../components/system/SystemButton';
import { SystemAlert, SystemType } from '../components/system/SystemAlert';
import { OptionList, Stepper, FieldRow, Toggle2 } from '../components/onboarding/Controls';
import { Progress } from '../components/onboarding/Progress';
import { AssessmentResult } from '../components/onboarding/AssessmentResult';
import { EMPTY_ANSWERS, loadAnswers, saveAnswers } from '../lib/onboarding';
import {
  EXPERIENCE_LEVELS, GOALS, WEAKNESSES,
  SPLIT_OPTIONS, LIMITATIONS, GENDERS, assess,
} from '../engine/assessment';
import { inferBodyType } from '../engine/physique';
import { GearPicker } from '../components/onboarding/GearPicker';
import { BodyTypePicker } from '../components/onboarding/BodyTypePicker';
import { BodyFocusPicker } from '../components/onboarding/BodyFocusPicker';
import { HunterAvatar } from '../components/avatar/HunterAvatar';
import { play } from '../lib/sound';

// ---------------------------------------------------------------------------
// THE AWAKENING
//
// A new visitor meets the System before they meet a sign-up form. The
// questionnaire runs first, the System reports its assessment, and only then
// does it ask them to register — so the account is the reward for finishing,
// not the toll for starting.
// ---------------------------------------------------------------------------

const STEPS = [
  {
    id: 'name',
    title: 'Identify Yourself',
    prompt: 'The System requires a designation.',
    valid: (a) => a.name.trim().length >= 2,
    render: (a, set) => (
      <FieldRow label="Hunter name">
        <input
          className="sys-input"
          value={a.name}
          autoFocus
          maxLength={24}
          placeholder="Enter your name"
          onChange={(e) => set({ name: e.target.value })}
        />
      </FieldRow>
    ),
  },
  {
    id: 'age',
    title: 'Vital Records',
    prompt: 'Age and recovery capacity are linked. The System accounts for it.',
    valid: (a) => Number(a.age) >= 13 && Number(a.age) <= 99 && Boolean(a.gender),
    render: (a, set) => (
      <div className="space-y-4">
        <FieldRow label="Age">
          <input
            type="number"
            inputMode="numeric"
            className="sys-input text-center text-xl"
            value={a.age}
            placeholder="—"
            onChange={(e) => set({ age: e.target.value })}
          />
        </FieldRow>
        <div>
          <span className="sys-label mb-1.5 block">Sex</span>
          <OptionList options={GENDERS} value={a.gender} onChange={(v) => set({ gender: v })} columns={2} />
        </div>
      </div>
    ),
  },
  {
    id: 'body',
    title: 'Physical Readings',
    prompt: 'Used to scale strength standards and score bodyweight movements.',
    valid: (a) => Number(a.height) > 80 && Number(a.weight) > 20,
    render: (a, set) => (
      <div className="space-y-4">
        <div>
          <span className="sys-label mb-1.5 block">Units</span>
          <Toggle2
            options={[{ id: 'kg', label: 'kg / cm' }, { id: 'lb', label: 'lb / cm' }]}
            value={a.unit}
            onChange={(v) => set({ unit: v })}
          />
        </div>
        <FieldRow label="Height (cm)">
          <input
            type="number"
            inputMode="numeric"
            className="sys-input text-center text-xl"
            value={a.height}
            placeholder="—"
            onChange={(e) => set({ height: e.target.value })}
          />
        </FieldRow>
        <FieldRow label={`Bodyweight (${a.unit})`}>
          <input
            type="number"
            inputMode="decimal"
            className="sys-input text-center text-xl"
            value={a.weight}
            placeholder="—"
            onChange={(e) => set({ weight: e.target.value })}
          />
        </FieldRow>
      </div>
    ),
  },
  {
    id: 'build',
    title: 'Physical Build',
    prompt: 'Choose the frame closest to yours. This becomes your avatar.',
    valid: (a) => Boolean(a.bodyType),
    render: (a, set) => (
      <BodyTypePicker value={a.bodyType} onChange={(v) => set({ bodyType: v })} sex={a.gender} />
    ),
  },
  {
    id: 'experience',
    title: 'Combat History',
    prompt: 'How long have you been training?',
    valid: (a) => Boolean(a.experience),
    render: (a, set) => (
      <OptionList options={EXPERIENCE_LEVELS} value={a.experience} onChange={(v) => set({ experience: v })} />
    ),
  },
  {
    id: 'goal',
    title: 'Declare Your Objective',
    prompt: 'This sets how every session is scored.',
    valid: (a) => Boolean(a.goal),
    render: (a, set) => <OptionList options={GOALS} value={a.goal} onChange={(v) => set({ goal: v })} />,
  },
  {
    id: 'weaknesses',
    title: 'Acknowledge Your Weakness',
    prompt: 'Be honest. Named weak points start lower — and the System attacks them first.',
    valid: () => true,
    optional: true,
    render: (a, set) => (
      <OptionList options={WEAKNESSES} value={a.weaknesses} onChange={(v) => set({ weaknesses: v })} multi />
    ),
  },
  {
    id: 'focus',
    title: 'Priority Targets',
    prompt: 'Tap the areas you most want to develop.',
    valid: () => true,
    optional: true,
    render: (a, set) => (
      <BodyFocusPicker value={a.focus} onChange={(v) => set({ focus: v })} />
    ),
  },
  {
    id: 'schedule',
    title: 'Set Your Schedule',
    prompt: 'The programme is built to fit this exactly.',
    valid: (a) => Number(a.days) >= 1,
    render: (a, set) => (
      <div className="space-y-4">
        <div>
          <span className="sys-label mb-1.5 block">Sessions per week</span>
          <Stepper value={a.days} onChange={(v) => set({ days: v })} min={2} max={6} suffix="days" label="days" />
        </div>
        <div>
          <span className="sys-label mb-1.5 block">Time per session</span>
          <OptionList
            options={[
              { id: '30', label: '30 minutes', detail: 'Short and dense — 4 movements.' },
              { id: '45', label: '45 minutes', detail: 'The usual sweet spot — 5 movements.' },
              { id: '60', label: '1 hour', detail: 'Room for accessories — 5 movements.' },
              { id: '90', label: '1 hour 30 minutes', detail: 'Long rests on the main lifts — 6 movements.' },
              { id: '120', label: '2 hours or more', detail: 'Full sessions, nothing rushed — 7 movements.' },
            ]}
            value={String(a.duration)}
            onChange={(v) => set({ duration: Number(v) })}
          />
        </div>
      </div>
    ),
  },
  {
    id: 'split',
    title: 'Training Structure',
    prompt: 'How the week should be divided.',
    valid: (a) => Boolean(a.split),
    render: (a, set) => <OptionList options={SPLIT_OPTIONS} value={a.split} onChange={(v) => set({ split: v })} />,
  },
  {
    id: 'equipment',
    title: 'Available Arsenal',
    prompt: 'Pick a preset, then tick exactly what you have. Only movements you can actually perform will be prescribed.',
    // Owning nothing is a legitimate answer — it yields a bodyweight programme.
    valid: () => true,
    render: (a, set) => <GearPicker value={a.gear} onChange={(v) => set({ gear: v })} />,
  },
  {
    id: 'limitations',
    title: 'Existing Damage',
    prompt: 'Anything the System should route around.',
    valid: () => true,
    optional: true,
    render: (a, set) => (
      <OptionList options={LIMITATIONS} value={a.limitations} onChange={(v) => set({ limitations: v })} multi />
    ),
  },
];

const PHASES = { INTRO: 'intro', QUESTIONS: 'questions', ANALYSING: 'analysing', RESULT: 'result' };

export default function AwakenPage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState(() => loadAnswers() || EMPTY_ANSWERS);

  // Resume rather than restart. Someone who finished the assessment and came
  // back — or who reloaded partway through — should land on their result or
  // their last question, not be sent round the questionnaire again.
  const [phase, setPhase] = useState(() => {
    const saved = loadAnswers();
    if (saved?.completedAt) return PHASES.RESULT;
    if (saved?.name) return PHASES.QUESTIONS;
    return PHASES.INTRO;
  });
  const [step, setStep] = useState(() => {
    const saved = loadAnswers();
    if (!saved || saved.completedAt) return 0;
    const firstUnanswered = STEPS.findIndex((s) => !s.valid(saved) && !s.optional);
    return firstUnanswered === -1 ? 0 : firstUnanswered;
  });
  const [declined, setDeclined] = useState(false);

  const set = useCallback((patch) => setAnswers((a) => ({ ...a, ...patch })), []);

  // Persist as they go — a dropped connection or a locked phone loses nothing.
  useEffect(() => saveAnswers(answers), [answers]);

  const current = STEPS[step];
  const canAdvance = current ? current.valid(answers) : false;

  const assessment = useMemo(
    () => (phase === PHASES.RESULT || phase === PHASES.ANALYSING ? assess(answers) : null),
    [phase, answers],
  );

  // Arriving at the build question with a height and weight already on file,
  // the System proposes a frame rather than presenting four blank choices. The
  // hunter confirms or corrects it, which is a far lighter ask.
  useEffect(() => {
    if (current?.id === 'build' && !answers.bodyType) {
      set({ bodyType: inferBodyType(answers) });
    }
  }, [current?.id, answers, set]);

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else {
      setAnswers((a) => ({ ...a, completedAt: Date.now() }));
      setPhase(PHASES.ANALYSING);
    }
  };

  const back = () => {
    if (step > 0) setStep((s) => s - 1);
    else setPhase(PHASES.INTRO);
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      {/* The System's grid, always faintly present behind the interface. */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--sys) / 0.07) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--sys) / 0.07) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-6 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)]">
        <AnimatePresence mode="wait">
          {phase === PHASES.INTRO && (
            <Intro
              key="intro"
              onAccept={() => setPhase(PHASES.QUESTIONS)}
              onDecline={() => setDeclined(true)}
              onSignIn={() => navigate('/auth')}
            />
          )}

          {phase === PHASES.QUESTIONS && (
            <motion.div
              key="questions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <Progress step={step} total={STEPS.length} />

              <div className="mt-4 flex min-h-0 flex-1 flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    className="flex min-h-0 flex-1 flex-col"
                  >
                    <SystemWindow
                      title={current.title}
                      subtitle="System Assessment"
                      animate={false}
                      className="flex min-h-0 flex-1 flex-col"
                      bodyClassName="flex min-h-0 flex-1 flex-col p-4"
                    >
                      <p className="mb-4 text-sm leading-relaxed text-[rgb(var(--sys-dim))]">
                        {current.prompt}
                      </p>
                      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">{current.render(answers, set)}</div>
                    </SystemWindow>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-4 flex gap-2 pad-bottom-safe">
                <SystemButton icon={ArrowLeft} onClick={back} className="!px-4" aria-label="Back" />
                <SystemButton
                  variant="primary"
                  iconRight={ArrowRight}
                  className="flex-1"
                  onClick={next}
                  disabled={!canAdvance}
                >
                  {step === STEPS.length - 1 ? 'Begin Analysis' : current.optional && !canAdvance ? 'Skip' : 'Continue'}
                </SystemButton>
              </div>
            </motion.div>
          )}

          {phase === PHASES.ANALYSING && (
            <Analysing key="analysing" onDone={() => setPhase(PHASES.RESULT)} name={answers.name} />
          )}

          {phase === PHASES.RESULT && assessment && (
            <AssessmentResult
              key="result"
              answers={answers}
              assessment={assessment}
              onContinue={() => navigate('/auth')}
              onRestart={() => {
                setStep(0);
                setPhase(PHASES.QUESTIONS);
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <SystemAlert
        open={declined}
        onClose={() => setDeclined(false)}
        title="Warning"
        tone="danger"
        message="Refusal is permitted. The qualification will remain available should you reconsider."
        confirmLabel="Reconsider"
        onConfirm={() => {
          setDeclined(false);
          setPhase(PHASES.QUESTIONS);
        }}
      />
    </div>
  );
}

/** The qualification notice — the System's first contact. */
function Intro({ onAccept, onDecline, onSignIn }) {
  const [ready, setReady] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex flex-1 flex-col items-center justify-center"
    >
      {/* The awakening, shown rather than described: a dormant figure that
          takes on its aura as the System finishes speaking. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-1"
      >
        <motion.div
          animate={{ opacity: ready ? 1 : 0.45 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        >
          <HunterAvatar
            className="h-[190px] w-[114px]"
            stats={{}}
            bodyType="average"
            color={ready ? '#7adeff' : '#3f5875'}
            aura={ready}
            motes={ready}
          />
        </motion.div>

        <motion.span
          initial={{ opacity: 0, y: 10, scale: 0.6 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 340, damping: 20 }}
          className="absolute -right-1 top-1 flex h-11 w-11 items-center justify-center"
          style={{
            border: '1px solid rgb(var(--sys) / 0.9)',
            background: 'rgb(var(--sys) / 0.12)',
            boxShadow: '0 0 30px -6px rgb(var(--sys)), inset 0 0 24px -12px rgb(var(--sys))',
            clipPath: 'polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px)',
          }}
        >
          <span className="sys-title sys-glow text-2xl leading-none">!</span>
        </motion.span>
      </motion.div>

      <SystemWindow delay={0.35} scan className="w-full" bodyClassName="px-5 py-6">
        <p className="text-center text-[15px] leading-relaxed text-[rgb(var(--sys-ink))]">
          <SystemType
            text="You have acquired the qualifications to be a Player. Will you accept?"
            speed={30}
            onDone={() => setReady(true)}
          />
        </p>

        <AnimatePresence>
          {ready && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-6 flex gap-2"
            >
              <SystemButton className="flex-1" onClick={onDecline}>
                No
              </SystemButton>
              <SystemButton variant="primary" className="flex-1" onClick={onAccept}>
                Yes
              </SystemButton>
            </motion.div>
          )}
        </AnimatePresence>
      </SystemWindow>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="mt-5 w-full text-center"
      >
        <p className="mx-auto max-w-xs text-xs leading-relaxed text-[rgb(var(--sys-dim))]">
          Accepting begins a short assessment. No account is required until it is complete.
        </p>

        <div className="my-4 flex items-center gap-3">
          <span className="sys-rule flex-1" />
          <span className="sys-label">or</span>
          <span className="sys-rule flex-1" />
        </div>

        <SystemButton className="w-full" icon={LogIn} onClick={onSignIn}>
          I already have an account
        </SystemButton>
        <p className="mt-2 text-[11px] text-[rgb(var(--sys-dim))]">
          Signing in restores your hunter exactly as you left it.
        </p>
      </motion.div>
    </motion.div>
  );
}

/** The analysis sequence — deliberately short, but it earns the reveal. */
function Analysing({ onDone, name }) {
  const lines = useMemo(
    () => [
      'Reading physical parameters…',
      'Cross-referencing training history…',
      'Evaluating declared weak points…',
      'Matching arsenal to movement library…',
      'Constructing training programme…',
      'Allocating base attributes…',
    ],
    [],
  );
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= lines.length) {
      play('reveal');
      const id = setTimeout(onDone, 600);
      return () => clearTimeout(id);
    }
    play('tap');
    const id = setTimeout(() => setShown((s) => s + 1), 380);
    return () => clearTimeout(id);
  }, [shown, lines.length, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col items-center justify-center"
    >
      <SystemWindow title="Analysing" subtitle={name ? `Subject: ${name}` : 'System'} scan className="w-full">
        <div className="space-y-2 font-mono text-xs">
          {lines.slice(0, shown).map((line, i) => (
            <motion.div
              key={line}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <span className="sys-accent">›</span>
              <span className="flex-1 text-[rgb(var(--sys-dim))]">{line}</span>
              <span className="sys-accent">{i < shown - 1 ? 'OK' : '…'}</span>
            </motion.div>
          ))}
        </div>

        <div className="sys-meter mt-5 h-1">
          <motion.div
            className="sys-meter-fill"
            animate={{ width: `${(shown / lines.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </SystemWindow>
    </motion.div>
  );
}
