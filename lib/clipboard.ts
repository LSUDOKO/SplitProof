export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Calendar reminder (.ics) for a scan day — works on Android, iOS and desktop without push permissions. */
export function downloadIcs(dateISO: string, title: string, note = "") {
  const start = new Date(dateISO);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(start.getTime() + 15 * 60_000);
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SplitSide//EN", "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@splitside`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${title}`, `DESCRIPTION:${note.replace(/\n/g, "\\n")}`, "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "splitside-scan.ics" });
  a.click();
  URL.revokeObjectURL(url);
}
