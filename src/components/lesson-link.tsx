import Link from "next/link";
import type { ReactNode } from "react";

// A signposted jump between lessons, for prose articles.
//
// A bare inline link is the wrong shape for a detour: the reader needs to know
// it is a side trip, what is over there, and that they are expected back. So
// this renders as a card with a direction — `to` leads away, `back` returns —
// and the author writes the words, since the prose around it is Bangla.
//
// `id` puts a named anchor on the card, which is how the return link lands the
// reader on the paragraph they left (this MDX pipeline has no rehype-slug, so
// headings carry no ids of their own).

export default function LessonLink({
  href,
  dir = "to",
  id,
  eyebrow,
  title,
  children,
}: {
  href: string;
  dir?: "to" | "back";
  id?: string;
  /** small label above the title — "পাশের পাঠ", "মূল পাঠ" */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** one line on why the reader is being sent there */
  children?: ReactNode;
}) {
  return (
    <Link href={href} id={id} className={`lesson-link is-${dir}`}>
      <span className="lesson-link-arrow" aria-hidden="true">
        {dir === "back" ? "←" : "→"}
      </span>
      <span className="lesson-link-body">
        {eyebrow ? <b>{eyebrow}</b> : null}
        <strong>{title}</strong>
        {children ? <small>{children}</small> : null}
      </span>
    </Link>
  );
}
