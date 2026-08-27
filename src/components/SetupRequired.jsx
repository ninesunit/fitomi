import { AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';

/**
 * Shown when Firebase Authentication has never been initialised on the project.
 *
 * The web SDK reports this as a bare `auth/configuration-not-found`, which is
 * useless to whoever is standing in front of it. On the Spark plan Auth can
 * only be switched on from the console — there is no API for it — so the honest
 * thing is to name the exact clicks required rather than pretend to retry.
 */
export function SetupRequired({ projectId = 'fitomii' }) {
  const steps = [
    {
      title: 'Enable Authentication',
      body: 'Open Build → Authentication → Get started, then enable the Email/Password and Google providers.',
      href: `https://console.firebase.google.com/project/${projectId}/authentication/providers`,
      cta: 'Open Authentication',
    },
    {
      title: 'Create the Firestore database',
      body: 'Open Build → Firestore Database → Create database. Pick production mode and any region — the security rules ship with this project.',
      href: `https://console.firebase.google.com/project/${projectId}/firestore`,
      cta: 'Open Firestore',
    },
  ];

  return (
    <div className="grid-bg flex min-h-screen items-center justify-center bg-void-950 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center  border border-[rgb(var(--sys-gold)/0.4)] bg-[rgb(var(--sys-gold)/0.12)]">
            <AlertTriangle size={24} className="text-[rgb(var(--sys-gold))]" />
          </span>
          <h1 className="font-display text-2xl font-bold tracking-wide text-[rgb(var(--sys-ink))]">
            Project setup required
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[rgb(var(--sys-dim))]">
            Fitomi is deployed, but the <span className="font-mono text-[rgb(var(--sys-ink))]">{projectId}</span>{' '}
            Firebase project still needs two services switched on. Both are free on the Spark plan
            and take about thirty seconds.
          </p>
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={step.title} className="panel p-4">
              <div className="flex items-start gap-3">
                <span
 className="flex h-7 w-7 shrink-0 items-center justify-center  font-mono text-xs font-bold text-void-950"
                  style={{ backgroundColor: 'rgb(var(--sys))' }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-base font-semibold text-[rgb(var(--sys-ink))]">{step.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--sys-dim))]">{step.body}</p>
                  <a
                    href={step.href}
                    target="_blank"
                    rel="noreferrer noopener"
 className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold accent-text hover:underline"
                  >
                    {step.cta}
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="panel mt-4 flex items-start gap-2.5 p-4">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[rgb(var(--sys-good))]" />
          <p className="text-sm leading-relaxed text-[rgb(var(--sys-dim))]">
            Once both are on, reload this page — no redeploy is needed. Then run{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">
              firebase deploy --only firestore
            </code>{' '}
            to publish the security rules.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
 className="btn btn-primary mt-4 w-full"
        >
          Reload and try again
        </button>
      </div>
    </div>
  );
}

export default SetupRequired;
