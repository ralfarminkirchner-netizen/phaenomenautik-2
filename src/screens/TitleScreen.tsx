// PHÄNOMENAUTIK 2 — Titelbildschirm (3D-Wasser im Hintergrund via SeaWorld wäre
// zu schwer; stattdessen: animierte CSS/Canvas-2D-Wellensilhouette + Logo)

import { useEffect, useRef, useState } from "react";
import { DISCLAIMER, INTRO_TEXT } from "../game/data";
import { audio } from "../game/audio";

export function TitleScreen({ hasSave, onContinue, onNewGame }: { hasSave: boolean; onContinue: () => void; onNewGame: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [introLine, setIntroLine] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let t = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      const w = (canvas.width = canvas.clientWidth);
      const h = (canvas.height = canvas.clientHeight);
      // Himmel
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7);
      sky.addColorStop(0, "#16283f");
      sky.addColorStop(1, "#3d6a8f");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      // Sonne
      ctx.fillStyle = "rgba(246, 227, 161, 0.9)";
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.24, 34 + Math.sin(t) * 2, 0, Math.PI * 2);
      ctx.fill();
      // Low-Poly-Bergketten (statisch gewürfelt, leicht atmend)
      for (let layer = 0; layer < 3; layer++) {
        const baseY = h * (0.52 + layer * 0.08);
        const col = ["#2c4a66", "#24405a", "#1c3650"][layer];
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += w / 18) {
          const y = baseY - Math.abs(Math.sin(x * 0.013 + layer * 7 + Math.sin(t * 0.1) * 0.2)) * (60 - layer * 14);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      }
      // Wasser: geschichtete Wellenzüge
      const sea = ctx.createLinearGradient(0, h * 0.68, 0, h);
      sea.addColorStop(0, "#2e6a8f");
      sea.addColorStop(1, "#0d2f48");
      ctx.fillStyle = sea;
      ctx.fillRect(0, h * 0.68, w, h * 0.32);
      for (let row = 0; row < 6; row++) {
        const yy = h * 0.7 + row * h * 0.05;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const y = yy + Math.sin(x * 0.02 + t * (1 + row * 0.2) + row * 2) * (4 + row * 1.5);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(220, 240, 250, ${0.16 - row * 0.02})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // Schiff-Silhouette
      const sx = ((t * 36) % (w + 320)) - 160;
      const sy = h * 0.76 + Math.sin(t * 1.6) * 6;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(Math.sin(t * 1.3) * 0.05);
      ctx.fillStyle = "#101b2a";
      ctx.beginPath();
      ctx.moveTo(-34, 0);
      ctx.quadraticCurveTo(0, 16, 34, 0);
      ctx.lineTo(26, -8);
      ctx.lineTo(-26, -8);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-2, -46, 3, 40);
      ctx.beginPath();
      ctx.moveTo(1, -44);
      ctx.quadraticCurveTo(26, -30, 1, -12);
      ctx.closePath();
      ctx.fillStyle = "#e9dfc4";
      ctx.fill();
      ctx.restore();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const advanceIntro = () => {
    audio.select();
    if (introLine + 1 < INTRO_TEXT.length) setIntroLine(introLine + 1);
    else onNewGame();
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {!showIntro ? (
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8 p-6">
          <div className="text-center">
            <div className="mb-2 text-xs tracking-[0.5em] text-sky-200/70">EIN TRAUMAATLAS-SPIEL · V2 · ECHTZEIT-3D</div>
            <h1 className="title-logo text-5xl sm:text-7xl">PHÄNOMENAUTIK 2</h1>
            <div className="mt-3 text-sm italic text-sky-100/80 sm:text-base">
              Die Phänomene sind Inseln. Du hast ein Schiff. Und diesmal schaukelt es.
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            {hasSave && (
              <button className="eb-btn px-8 py-3 text-lg tracking-wider" onClick={() => { audio.startSea(); audio.confirm(); onContinue(); }}>
                ⛵ Weiterreisen
              </button>
            )}
            <button className="eb-btn px-8 py-3 text-lg tracking-wider" onClick={() => { audio.startSea(); audio.confirm(); setShowIntro(true); }}>
              🌊 Neue Reise
            </button>
          </div>
          <p className="max-w-md text-center text-[11px] leading-relaxed text-sky-200/50">{DISCLAIMER}</p>
        </div>
      ) : (
        <button className="relative z-10 flex h-full w-full cursor-pointer items-center justify-center p-6" onClick={advanceIntro}>
          <div className="eb-panel max-w-xl px-8 py-6">
            <div className="min-h-[120px] text-center text-base leading-relaxed text-sky-50 sm:text-lg">
              {INTRO_TEXT.slice(0, introLine + 1).map((l, i) => (
                <div key={i} className={i === introLine ? "text-amber-100" : "text-sky-200/50"}>
                  {l || " "}
                </div>
              ))}
            </div>
            <div className="mt-4 text-center text-xs text-sky-300/60">
              {introLine + 1 < INTRO_TEXT.length ? "Klicken zum Weiterlesen ▼" : "Klicken zum Ablegen ⛵"}
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
