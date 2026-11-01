"use client";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { copyText } from "@/lib/clipboard";
import { Button } from "./ui";

export function CopyBox({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-panel bg-card p-4 shadow-[var(--shadow-soft)]">
      <pre className="whitespace-pre-wrap break-words font-sans text-sm">{text}</pre>
      <Button variant="secondary" className="mt-3 w-full" onClick={async () => setCopied(await copyText(text))}>
        {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
        {copied ? "Copied" : label}
      </Button>
    </div>
  );
}
