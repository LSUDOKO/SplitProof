"use client";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CheckIn } from "@/components/CheckIn";
import { ScannerFrame } from "@/components/ScannerFrame";
import { TrialState } from "@/components/TrialNotFound";
import { Button, ButtonLink, IconButton, Panel } from "@/components/ui";
import { FACE_OVAL, POSE_MESSAGES, eulerFromMatrix, evaluatePose, framing, ghostDistance, type PoseIssue, type PoseReading } from "@/lib/capture/alignment";
import { analyseOnYoucam, measureBurdens } from "@/lib/capture/analyse";
import { grabFrame, portraitCrop, toJpeg } from "@/lib/capture/frame";
import { blendshape, getLandmarker, toPixels } from "@/lib/capture/landmarks";
import { setVoiceEnabled, speak, voiceEnabled, voiceSupported } from "@/lib/capture/voice";
import { LIGHT_MESSAGES, evaluateLight, readLight, type LightIssue } from "@/lib/capture/lightGate";
import { BASELINE_SCANS, POSE_GATE } from "@/lib/config";
import { events as eventsRepo, media as mediaRepo, newId, scans as scansRepo, trials as trialsRepo } from "@/lib/db";
import { buildRoiIndex, faceGeometry } from "@/lib/split/rois";
import { mean } from "@/lib/stats/series";
import { evaluateTrial } from "@/lib/stats/verdict";
import { afterScan } from "@/lib/trial/orchestrator";
import type { Landmarks, Scan } from "@/lib/types";
import { useTrial } from "@/lib/useTrial";

type Phase = "starting" | "camera" | "analysing" | "checkin" | "practice_done" | "error";
type Check = { label: string; ok: boolean };

const GHOST_TOLERANCE = 0.05;
/** Earthy chip tints for passed checks, echoing the scanner's tag style. */
const CHIP_TONES = ["bg-[#c9d8c0] text-forest-deep", "bg-[#e6d3b3] text-[#7a5418]", "bg-[#d9c4d6] text-[#6b3f66]", "bg-[#cfe0d6] text-[#2f5a45]", "bg-[#dcd6c2] text-[#5a5230]"];
const LIVE_W = 360;

export default function ScanPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, reload } = useTrial(id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("starting");
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [hint, setHint] = useState("Loading face guide…");
  const [checks, setChecks] = useState<Check[]>([]);
  const [balance, setBalance] = useState<{ left: number; right: number } | null>(null);
  const [savedScan, setSavedScan] = useState<Scan | null>(null);
  const baselineLandmarks = useRef<{ lm: Landmarks; width: number } | null>(null);
  const capturing = useRef(false);
  const [voice, setVoice] = useState(false);

  // Spoken guidance (A10): reads the current hint aloud when switched on.
  useEffect(() => {
    // localStorage only exists after mount, so the saved choice can't be the initial state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVoice(voiceEnabled());
  }, []);
  useEffect(() => {
    if (voice) speak(hint);
  }, [hint, voice]);

  const trial = data?.trial;
  const scans = data?.scans ?? [];
  const baselineScans = scans.filter((s) => s.isBaseline);
  const isBaseline = baselineScans.length < BASELINE_SCANS;
  const baselineImbalance = baselineScans.length ? mean(baselineScans.map((s) => s.meta.lightImbalance)) : undefined;
  const practice = !!trial?.isDemo;

  // Ghost outline: the first baseline scan's face.
  useEffect(() => {
    const first = baselineScans[0];
    if (first) mediaRepo.get(first.id).then((m) => (baselineLandmarks.current = m?.landmarks ? { lm: m.landmarks as [number, number][], width: first.meta.width } : null));
  }, [baselineScans.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const capture = useCallback(
    async (landmarksVideo: Landmarks, pose: PoseReading) => {
      const video = videoRef.current;
      if (!video || !trial || capturing.current) return;
      capturing.current = true;
      navigator.vibrate?.(30);
      const { canvas, ctx, width, height, scale } = grabFrame(video);
      const landmarks = landmarksVideo.map(([x, y]) => [x * scale, y * scale] as [number, number]);
      // Final Light Balance Gate on the exact analysis frame (incl. sharpness).
      const img = ctx.getImageData(0, 0, width, height);
      const roi = buildRoiIndex(width, height, faceGeometry(landmarks, "cheeks"));
      const box = framing(landmarks, width, height).box;
      const light = readLight(img, roi, box);
      const issues = evaluateLight(light, baselineImbalance);
      if (issues.length) {
        setHint(LIGHT_MESSAGES[issues[0]]);
        capturing.current = false;
        return;
      }
      if (practice) {
        setPhase("practice_done");
        return;
      }
      setPhase("analysing");
      try {
        const image = await toJpeg(canvas);
        const result = await analyseOnYoucam(image, trial.zone, (s) => setStage(s));
        setStage("measuring");
        const { burdens, blobs } = await measureBurdens(result.masks, landmarks, width, height, trial.zone);
        const now = new Date();
        const scan: Scan = {
          id: newId(),
          trialId: trial.id,
          takenAt: now.toISOString(),
          dayIndex: isBaseline ? 0 : Math.max(1, Math.floor((now.getTime() - Date.parse(trial.startDate)) / 86_400_000)),
          isBaseline,
          meta: { width, height, device: navigator.userAgent.slice(0, 120), lightImbalance: light.imbalance, yaw: pose.yaw, pitch: pose.pitch, roll: pose.roll, localHour: now.getHours() },
          scores: Object.fromEntries(result.concerns.map(({ key, ...s }) => [key, s])),
          burdens,
        };
        await scansRepo.put(scan);
        await mediaRepo.put({ scanId: scan.id, image, masks: blobs, landmarks: landmarks.map((p) => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]) });
        if (isBaseline) await finishScan(scan);
        else {
          setSavedScan(scan);
          setPhase("checkin");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
        setPhase("error");
      } finally {
        capturing.current = false;
      }
    },
    [trial, practice, isBaseline, baselineImbalance], // eslint-disable-line react-hooks/exhaustive-deps
  );

  /** Persist, run the deterministic orchestrator, log its decisions, go back to the dashboard. */
  async function finishScan(scan: Scan) {
    if (!trial) return;
    await scansRepo.put(scan);
    const all = await scansRepo.forTrial(trial.id);
    const out = afterScan(trial, all, evaluateTrial(trial, all));
    await trialsRepo.put(out.trial);
    for (const e of out.events) await eventsRepo.add(e);
    await reload();
    const moreBaseline = scan.isBaseline && all.filter((s) => s.isBaseline).length < BASELINE_SCANS;
    if (moreBaseline) {
      setPhase("camera");
      setHint("Saved. Move your head away and back, then hold still for the next baseline scan.");
    } else router.push(out.trial.status === "stopped" || out.trial.status === "finished" ? `/trial/${trial.id}/verdict` : `/trial/${trial.id}`);
  }

  // Camera + live checks.
  const live = phase === "starting" || phase === "camera";
  useEffect(() => {
    if (!trial || !live) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stop = false;
    let passingSince = 0;
    let lastLight = 0;
    let lightIssues: LightIssue[] = [];
    const small = document.createElement("canvas");

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1440 }, height: { ideal: 1920 } }, audio: false });
      } catch {
        setError("SplitSide needs your front camera. Allow camera access in your browser settings and reload.");
        setPhase("error");
        return;
      }
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      const lm = await getLandmarker().catch(() => null);
      if (!lm) {
        setError("The face guide couldn't load on this browser. Try Chrome or Safari on your phone.");
        setPhase("error");
        return;
      }
      setPhase("camera");
      setHint("Fit your face inside the outline.");

      const tick = () => {
        if (stop) return;
        raf = requestAnimationFrame(tick);
        if (video.readyState < 2 || capturing.current) return;
        // All live geometry is in the 3:4 portrait crop, the same frame that gets captured.
        const crop = portraitCrop(video.videoWidth, video.videoHeight);
        const W = crop.width;
        const H = crop.height;
        const now = performance.now();
        const r = lm.detectForVideo(video, now);
        const pts = toPixels(r, video.videoWidth, video.videoHeight)?.map(([x, y]) => [x - crop.x, y - crop.y] as [number, number]) ?? null;
        let pose: PoseReading | null = null;
        if (pts && r.facialTransformationMatrixes?.[0]) {
          const f = framing(pts, W, H);
          pose = {
            ...eulerFromMatrix(r.facialTransformationMatrixes[0].data),
            faceWidth: f.faceWidth,
            centreOffset: f.centreOffset,
            blink: Math.max(blendshape(r, "eyeBlinkLeft"), blendshape(r, "eyeBlinkRight")),
            jawOpen: blendshape(r, "jawOpen"),
          };
        }
        const poseIssues: PoseIssue[] = evaluatePose(pose);
        const ghost = pts && baselineLandmarks.current ? ghostDistance(pts, scaleTo(baselineLandmarks.current, W), FACE_OVAL) : 0;

        // Light, on a small copy every 300 ms (sharpness is checked on the full frame at capture).
        if (pts && now - lastLight > 300) {
          lastLight = now;
          const s = LIVE_W / W;
          small.width = LIVE_W;
          small.height = Math.round(H * s);
          const ctx = small.getContext("2d", { willReadFrequently: true })!;
          ctx.drawImage(video, crop.x, crop.y, W, H, 0, 0, small.width, small.height);
          try {
            const spts = pts.map(([x, y]) => [x * s, y * s] as [number, number]);
            const roi = buildRoiIndex(small.width, small.height, faceGeometry(spts, "cheeks"));
            const reading = readLight(ctx.getImageData(0, 0, small.width, small.height), roi, { x: 0, y: 0, width: 4, height: 4 });
            lightIssues = evaluateLight(reading, baselineImbalance).filter((i) => i !== "blurry");
            setBalance({ left: reading.lumaLeft, right: reading.lumaRight });
          } catch {
            lightIssues = ["too_dark"];
          }
        }

        const list: Check[] = [
          { label: "Face centred", ok: !!pose && !poseIssues.includes("off_centre") && !poseIssues.includes("no_face") },
          { label: "Straight on", ok: !!pose && !poseIssues.some((i) => i === "turned" || i === "tilted") },
          { label: "Close enough", ok: !!pose && !poseIssues.some((i) => i === "too_far" || i === "too_close") },
          { label: "Even light", ok: !!pose && lightIssues.length === 0 },
          { label: "Same position", ok: !!pose && ghost <= GHOST_TOLERANCE },
        ];
        const allOk = list.every((c) => c.ok) && poseIssues.length === 0;
        setChecks(list);
        setHint(
          poseIssues.length ? POSE_MESSAGES[poseIssues[0]] : lightIssues.length ? LIGHT_MESSAGES[lightIssues[0]] : ghost > GHOST_TOLERANCE ? "Line your face up with the outline from your first scan." : "Hold still…",
        );
        drawOverlay(overlayRef.current, W, H, baselineLandmarks.current, allOk);
        if (allOk && pts && pose) {
          passingSince ||= now;
          if (now - passingSince >= POSE_GATE.holdMs) {
            passingSince = 0;
            capture(pts, pose);
          }
        } else passingSince = 0;
      };
      tick();
    })();
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [trial?.id, live, capture]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data || !trial) return <TrialState loading={data === undefined} />;

  if (phase === "checkin" && savedScan)
    return (
      <AppShell back={`/trial/${trial.id}`} title="Scan saved">
        <CheckIn
          onDone={async (patch) => {
            await finishScan({ ...savedScan, ...patch });
          }}
        />
      </AppShell>
    );

  return (
    <AppShell
      back={`/trial/${trial.id}`}
      title={practice ? "Practice scan" : isBaseline ? `Baseline ${baselineScans.length + 1} of ${BASELINE_SCANS}` : "Face scanner"}
      action={
        voiceSupported() ? (
          <IconButton
            label={voice ? "Turn voice guidance off" : "Turn voice guidance on"}
            aria-pressed={voice}
            onClick={() => {
              setVoiceEnabled(!voice);
              setVoice(!voice);
            }}
          >
            {voice ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
          </IconButton>
        ) : undefined
      }
    >
      {practice && (
        <p className="mb-3 rounded-xl bg-treated-soft p-3 text-sm text-treated">Practice mode for the demo trial: the camera checks run on your phone, nothing is uploaded or saved.</p>
      )}
      {phase === "analysing" ? (
        <Panel className="mt-2">
          <ol className="space-y-3" aria-live="polite">
            {[
              ["uploading", "Uploading your photo"],
              ["analysing", "Analysing with YouCam AI"],
              ["measuring", "Measuring both sides"],
            ].map(([key, label], i, arr) => {
              const at = arr.findIndex(([k]) => k === stage);
              return (
                <li key={key} className={`flex items-center gap-3 ${i <= at ? "text-ink" : "text-muted"}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${i < at ? "bg-good" : i === at ? "animate-pulse bg-treated" : "bg-line"}`} aria-hidden="true" />
                  {label}
                </li>
              );
            })}
          </ol>
        </Panel>
      ) : phase === "error" ? (
        <Panel className="mt-2" tone="stop">
          <p className="font-semibold">{error}</p>
          <Button className="mt-4 w-full" onClick={() => (setError(""), setPhase("starting"))}>
            Try again
          </Button>
        </Panel>
      ) : phase === "practice_done" ? (
        <Panel className="mt-2" tone="good">
          <p className="font-semibold">All checks passed.</p>
          <p className="mt-1">In a real trial this frame would now go to YouCam AI Skin Analysis and both halves would be measured.</p>
          <ButtonLink href="/consent" className="mt-4 w-full">Start a real trial</ButtonLink>
        </Panel>
      ) : (
        <>
          <ScannerFrame status={hint} live>
            <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-cover" aria-label="Camera preview (mirrored)" />
            <canvas ref={overlayRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" aria-hidden="true" />
            <svg viewBox="0 0 300 400" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
              <line x1="150" y1="30" x2="150" y2="370" stroke="white" strokeOpacity="0.45" strokeDasharray="4 6" />
            </svg>
          </ScannerFrame>
          <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Capture checks">
            {checks.map((c, i) => (
              <li key={c.label} className={`rounded-full px-3 py-1 text-sm ${c.ok ? CHIP_TONES[i % CHIP_TONES.length] : "bg-raised/70 text-muted"}`}>
                {c.ok ? "✓ " : ""}
                {c.label}
              </li>
            ))}
          </ul>
          {balance && <LightBar left={balance.left} right={balance.right} />}
          <p className="mt-4 text-sm text-muted">
            No makeup, hair off your forehead, glasses off, neutral face. Scan at about the same time each day — skin changes from morning to evening.
            {isBaseline && " Baseline: move your head away and back between the three scans."}
          </p>
        </>
      )}
    </AppShell>
  );
}

function LightBar({ left, right }: { left: number; right: number }) {
  const max = Math.max(left, right, 1);
  return (
    <div className="mt-4" aria-label={`Light balance: your left ${Math.round(left)}, your right ${Math.round(right)}`}>
      <p className="text-sm font-semibold">Light balance</p>
      {[
        ["Your left", left],
        ["Your right", right],
      ].map(([label, v]) => (
        <div key={label as string} className="mt-1.5 grid grid-cols-[5.5rem_1fr] items-center gap-2 text-sm">
          <span className="text-muted">{label}</span>
          <span className="h-2 rounded-full bg-line">
            <span className="block h-2 rounded-full bg-forest" style={{ width: `${((v as number) / max) * 100}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

/** Baseline landmarks are stored at analysis resolution; scale them to the live video width. */
function scaleTo(g: { lm: Landmarks; width: number }, videoWidth: number): Landmarks {
  const s = videoWidth / g.width;
  return g.lm.map(([x, y]) => [x * s, y * s] as const);
}

function drawOverlay(canvas: HTMLCanvasElement | null, w: number, h: number, ghost: { lm: Landmarks; width: number } | null, ok: boolean) {
  if (!canvas) return;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  if (!ghost) return;
  const pts = scaleTo(ghost, w);
  ctx.beginPath();
  FACE_OVAL.forEach((i, k) => (k ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1])));
  ctx.closePath();
  ctx.strokeStyle = ok ? "#4ade80" : "rgba(255,255,255,0.85)";
  ctx.lineWidth = w / 200;
  ctx.stroke();
}
