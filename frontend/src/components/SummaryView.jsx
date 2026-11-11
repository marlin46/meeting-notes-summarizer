function Section({ title, accent, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        <span className={`h-2 w-2 rounded-full ${accent}`} />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="text-sm italic text-slate-400">Nothing identified.</p>;
}

function BulletList({ items }) {
  if (!items.length) return <Empty />;
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-slate-700">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function SummaryView({ summary }) {
  const { executiveSummary, actionItems, risks, nextSteps } = summary;

  return (
    <div className="grid gap-4">
      <Section title="Executive Summary" accent="bg-indigo-500">
        <p className="leading-relaxed text-slate-700">{executiveSummary}</p>
      </Section>

      <Section title="Action Items" accent="bg-emerald-500">
        {actionItems.length ? (
          <ul className="divide-y divide-slate-100">
            {actionItems.map((item, i) => (
              <li key={i} className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <span className="text-slate-700">{item.task}</span>
                <span className="flex shrink-0 gap-2 text-xs">
                  {item.owner && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">{item.owner}</span>
                  )}
                  {item.dueDate && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">{item.dueDate}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Risks" accent="bg-rose-500">
          <BulletList items={risks} />
        </Section>
        <Section title="Next Steps" accent="bg-sky-500">
          <BulletList items={nextSteps} />
        </Section>
      </div>
    </div>
  );
}
