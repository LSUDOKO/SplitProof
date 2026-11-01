export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** RFC 5545 TEXT escaping. */
const escIcs = (t: string) => t.replace(/\\/g, "\\\\").replace(/[,;]/g, "\\$&").replace(/\n/g, "\\n");
const fmtIcs = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** RFC 5545 calendar text, one 15-minute event per entry. Pure, so it can be unit-tested. */
export function buildIcs(events: { dateISO: string; title: string; note?: string }[], stamp = new Date()): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SplitSide//EN"];
  events.forEach((e, i) => {
    const start = new Date(e.dateISO);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${fmtIcs(start)}-${i}@splitside`,
      `DTSTAMP:${fmtIcs(stamp)}`,
      `DTSTART:${fmtIcs(start)}`,
      `DTEND:${fmtIcs(new Date(start.getTime() + 15 * 60_000))}`,
      `SUMMARY:${escIcs(e.title)}`,
      `DESCRIPTION:${escIcs(e.note ?? "")}`,
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/** Calendar reminder(s) as a download: works on Android, iOS and desktop without push permissions. */
export function downloadIcs(dateISO: string, title: string, note = "") {
  downloadIcsEvents([{ dateISO, title, note }]);
}

export function downloadIcsEvents(events: { dateISO: string; title: string; note?: string }[]) {
  const ics = buildIcs(events);
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "splitside-scan.ics" });
  a.click();
  URL.revokeObjectURL(url);
}
