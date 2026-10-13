import { plane } from "../../scripts/perspective.mjs";
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
function word(ctx, value, x, y, size = 60, color = "#172c27") {
  ctx.fillStyle = color;
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(value, x, y);
}
function background(ctx, t) {
  ctx.fillStyle = "#edefe9";
  ctx.fillRect(0, 0, 1920, 1080);
  for (const [x, y, r, color] of [
    [170, 1050, 900, "#f4b375"],
    [1700, 780, 1050, "#b5a8df"],
    [900, 1050, 740, "#f597a7"],
  ]) {
    const g = ctx.createRadialGradient(
      x + Math.sin(t * 0.3) * 80,
      y,
      30,
      x,
      y,
      r,
    );
    g.addColorStop(0, color);
    g.addColorStop(1, color + "00");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1920, 1080);
  }
}
export async function createScene({ config, createCanvas, snapshot }) {
  const names = ["Discover", "Compose", "Create"],
    colors = ["#a3c6b9", "#b9acd5", "#e0b998"],
    cards = [];
  for (let i = 0; i < 3; i++) {
    const c = createCanvas(480, 650),
      g = c.getContext("2d");
    g.fillStyle = "#f7f8f1";
    g.fillRect(0, 0, 480, 650);
    g.fillStyle = colors[i];
    g.fillRect(28, 28, 424, 420);
    for (let j = 0; j < 24; j++) {
      g.beginPath();
      g.strokeStyle = "#ffffffb0";
      g.lineWidth = 1.4;
      for (let k = 0; k < 90; k++) {
        const x = 35 + k * 4.6,
          y = 240 + Math.sin(k * 0.072 + j * 0.21 + i) * (0.9 * j + 45);
        k ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
    word(g, names[i], 240, 506, 45);
    word(g, "An original motion study", 240, 572, 20, "#6b786a");
    cards.push(await snapshot(c));
  }
  return {
    renderFrame(ctx, t) {
      ctx.save();
      ctx.scale(config.width / 1920, config.height / 1080);
      background(ctx, t);
      word(ctx, "REFERENCE / MOTION", 960, 108, 21, "#4c665c");
      if (t < 2.2) {
        const p = ease(t / 0.9);
        ctx.globalAlpha = p;
        word(ctx, "A reference.", 960, 430 + (1 - p) * 45, 108);
        word(ctx, "Your product.", 960, 574 + (1 - p) * 45, 108);
        word(
          ctx,
          "Translate the style. Keep the subject yours.",
          960,
          750,
          28,
          "#52665d",
        );
      } else if (t < 5.65) {
        const p = ease((t - 2.2) / 0.7),
          orbit = (t - 2.2) * 0.35;
        for (let i = 2; i >= 0; i--)
          plane(
            ctx,
            cards[i],
            {
              width: 460,
              x: (i - 1) * 480 * p,
              y: 45 + Math.sin(orbit + i) * 28,
              z: Math.abs(i - 1) * 100,
              yaw: Math.sin(orbit + i) * 0.17,
              pitch: 0.025,
            },
            { focal: 1200 },
          );
        word(ctx, "Useful motion. Clear meaning.", 960, 998, 34, "#465f53");
      } else {
        const p = ease((t - 5.65) / 0.6);
        ctx.globalAlpha = p;
        word(ctx, "Style, translated.", 960, 475 + (1 - p) * 55, 114);
        word(ctx, "REFERENCE MOTION", 960, 650, 31, "#465f53");
        word(ctx, "An open-source skill + renderer", 960, 711, 27, "#63736c");
      }
      ctx.restore();
    },
  };
}
