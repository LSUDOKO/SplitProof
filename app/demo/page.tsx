"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadDemo } from "@/lib/demo/load";

export default function DemoEntry() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadDemo()
      .then(() => router.replace("/trials?demo=1"))
      .catch(() => setFailed(true));
  }, [router]);
  return (
    <p className="p-8 text-center text-muted" role="status">
      {failed ? "This browser blocks on-device storage (private mode?). Open SplitSide in a normal tab." : "Loading demo trials…"}
    </p>
  );
}
