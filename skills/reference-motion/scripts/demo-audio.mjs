import { writeFile } from "node:fs/promises";
export async function makeDemoAudio(filename, duration = 8) {
  const rate = 48000,
    frames = Math.round(rate * duration),
    pcm = new Float64Array(frames * 2);
  const notes = [220, 277.1826, 329.6276, 440];
  for (let frame = 0; frame < frames; frame++) {
    const t = frame / rate,
      fade = Math.min(1, t / 0.2, (duration - t) / 0.5);
    let value = 0;
    notes.forEach((frequency, index) => {
      value +=
        Math.sin(2 * Math.PI * frequency * t) *
        0.024 *
        (1 + Math.sin(t * 0.6 + index) * 0.2);
    });
    for (const at of [0.25, 2.2, 4.6, 5.65]) {
      const dt = t - at;
      if (dt >= 0 && dt < 2)
        value +=
          Math.sin(2 * Math.PI * (at < 4 ? 659.255 : 523.251) * dt) *
          Math.exp(-dt * 5) *
          0.09 *
          (1 - Math.exp(-dt * 190));
    }
    pcm[frame * 2] = value * fade;
    pcm[frame * 2 + 1] = value * fade * 0.98;
  }
  const bytes = Buffer.alloc(44 + frames * 4);
  bytes.write("RIFF");
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write("WAVEfmt ", 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(2, 22);
  bytes.writeUInt32LE(rate, 24);
  bytes.writeUInt32LE(rate * 4, 28);
  bytes.writeUInt16LE(4, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write("data", 36);
  bytes.writeUInt32LE(frames * 4, 40);
  for (let i = 0; i < pcm.length; i++)
    bytes.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, pcm[i])) * 32767),
      44 + i * 2,
    );
  await writeFile(filename, bytes);
}
