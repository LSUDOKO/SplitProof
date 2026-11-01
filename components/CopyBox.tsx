"use client";
import { useState } from "react";
import { copyText } from "@/lib/clipboard";
import { Button } from "./ui";

export function CopyBox({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-line bg-paper p-4">
      <pre className="whitespace-pre-wrap font-sans text-sm">{text}</pre>
      <Button variant="secondary" className="mt-3 w-full" onClick={async () => setCopied(await copyText(text))}>
        {copied ? "Copied" : label}
      </Button>
    </div>
  );
}
