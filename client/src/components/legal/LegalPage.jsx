import { Link } from "react-router-dom";
import Icon from "../ui/Icon";

/**
 * Shared shell for the public legal pages (Terms, Privacy, Cookies).
 *
 * Legal text is long, so the two things that make it usable are an index the
 * reader can jump with, and headings that are real anchors — someone linking
 * to "section 7" of the privacy policy is a normal thing to want. Sections
 * are passed as data rather than children so the index can be generated from
 * the same source as the headings and can never drift out of sync.
 *
 * Block shapes supported in `section.blocks`:
 *   string                        -> paragraph
 *   { list: string[] }            -> bulleted list
 *   { table: { head, rows } }     -> plain table (cookies)
 *   { note: string }              -> highlighted callout
 */
function LegalPage({ icon, eyebrow, title, summary, updatedAt, sections, related = [] }) {
    return (
        <div className="bg-slate-50">
            <div className="relative isolate overflow-hidden bg-slate-950">
                <div
                    className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[40rem] -translate-x-1/2 rounded-full bg-indigo-600/25 blur-3xl"
                    aria-hidden="true"
                />
                <div className="relative mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-300">
                        <Icon name={icon} className="h-4 w-4" />
                        {eyebrow}
                    </div>
                    <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                        {title}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
                        {summary}
                    </p>
                    <p className="mt-4 text-xs text-slate-500">
                        Last updated {updatedAt}
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <nav
                    aria-label="Sections on this page"
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        On this page
                    </h2>
                    <ol className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        {sections.map((section, index) => (
                            <li key={section.id}>
                                <a
                                    href={`#${section.id}`}
                                    className="group inline-flex items-start gap-2 text-slate-600 transition hover:text-indigo-600"
                                >
                                    <span className="mt-0.5 w-5 shrink-0 text-right text-xs font-semibold text-slate-400 group-hover:text-indigo-500">
                                        {index + 1}.
                                    </span>
                                    {section.heading}
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                <article className="mt-8 space-y-10">
                    {sections.map((section, index) => (
                        <section key={section.id} id={section.id} className="scroll-mt-24">
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                <span className="mr-2 text-indigo-500">
                                    {index + 1}.
                                </span>
                                {section.heading}
                            </h2>
                            <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
                                {section.blocks.map((block, blockIndex) => {
                                    if (typeof block === "string") {
                                        return <p key={blockIndex}>{block}</p>;
                                    }

                                    if (block.list) {
                                        return (
                                            <ul
                                                key={blockIndex}
                                                className="list-disc space-y-1.5 pl-5 marker:text-indigo-400"
                                            >
                                                {block.list.map((item) => (
                                                    <li key={item}>{item}</li>
                                                ))}
                                            </ul>
                                        );
                                    }

                                    if (block.note) {
                                        return (
                                            <p
                                                key={blockIndex}
                                                className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-slate-700"
                                            >
                                                {block.note}
                                            </p>
                                        );
                                    }

                                    if (block.table) {
                                        return (
                                            <div
                                                key={blockIndex}
                                                className="overflow-x-auto rounded-xl border border-slate-200"
                                            >
                                                <table className="w-full min-w-[32rem] border-collapse text-left text-xs">
                                                    <thead className="bg-slate-100 text-slate-700">
                                                        <tr>
                                                            {block.table.head.map(
                                                                (heading) => (
                                                                    <th
                                                                        key={
                                                                            heading
                                                                        }
                                                                        scope="col"
                                                                        className="px-4 py-2.5 font-bold uppercase tracking-wide"
                                                                    >
                                                                        {heading}
                                                                    </th>
                                                                )
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                                                        {block.table.rows.map(
                                                            (row) => (
                                                                <tr key={row.join("|")}>
                                                                    {row.map(
                                                                        (
                                                                            cell,
                                                                            cellIndex
                                                                        ) => (
                                                                            <td
                                                                                key={
                                                                                    cellIndex
                                                                                }
                                                                                className="px-4 py-2.5 align-top"
                                                                            >
                                                                                {
                                                                                    cell
                                                                                }
                                                                            </td>
                                                                        )
                                                                    )}
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    }

                                    return null;
                                })}
                            </div>
                        </section>
                    ))}
                </article>

                {related.length > 0 && (
                    <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Related
                        </h2>
                        <ul className="mt-3 flex flex-wrap gap-3 text-sm">
                            {related.map((item) => (
                                <li key={item.to}>
                                    <Link
                                        to={item.to}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <p className="mt-10 text-xs text-slate-500">
                    Questions about this page? Email{" "}
                    <a
                        href="mailto:support@quickfix.co.ls"
                        className="font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                        support@quickfix.co.ls
                    </a>{" "}
                    or call +266 5779 9537.
                </p>
            </div>
        </div>
    );
}

export default LegalPage;
