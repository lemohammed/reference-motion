function rotate(p, yaw, pitch, roll) {
  const x = p.x * Math.cos(yaw) + p.z * Math.sin(yaw),
    z = -p.x * Math.sin(yaw) + p.z * Math.cos(yaw);
  const y = p.y * Math.cos(pitch) - z * Math.sin(pitch),
    zz = p.y * Math.sin(pitch) + z * Math.cos(pitch);
  return {
    x: x * Math.cos(roll) - y * Math.sin(roll),
    y: x * Math.sin(roll) + y * Math.cos(roll),
    z: zz,
  };
}
export function project(local, pose, camera) {
  const p = rotate(local, pose.yaw ?? 0, pose.pitch ?? 0, pose.roll ?? 0);
  const q = rotate(
    {
      x: p.x + (pose.x ?? 0) - (camera.x ?? 0),
      y: p.y + (pose.y ?? 0) - (camera.y ?? 0),
      z: p.z + (pose.z ?? 0) - (camera.z ?? 0),
    },
    -(camera.yaw ?? 0),
    -(camera.pitch ?? 0),
    0,
  );
  const depth = (camera.focal ?? 1100) + q.z,
    ratio = (camera.focal ?? 1100) / depth;
  return {
    x: (camera.centerX ?? 960) + q.x * ratio,
    y: (camera.centerY ?? 540) + q.y * ratio,
    depth,
  };
}
function triangle(ctx, image, a, b, c, u, v, w) {
  const det = u.x * (v.y - w.y) + v.x * (w.y - u.y) + w.x * (u.y - v.y);
  const solve = (p, q, r) => [
    (p * (v.y - w.y) + q * (w.y - u.y) + r * (u.y - v.y)) / det,
    (p * (w.x - v.x) + q * (u.x - w.x) + r * (v.x - u.x)) / det,
    (p * (v.x * w.y - w.x * v.y) +
      q * (w.x * u.y - u.x * w.y) +
      r * (u.x * v.y - v.x * u.y)) /
      det,
  ];
  const sx = solve(a.x, b.x, c.x),
    sy = solve(a.y, b.y, c.y);
  const vertices = [a, b, c],
    sign = Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
  const normals = vertices.map((p, i) => {
    const q = vertices[(i + 1) % 3],
      dx = q.x - p.x,
      dy = q.y - p.y,
      length = Math.hypot(dx, dy);
    return { x: (sign * dy) / length, y: (-sign * dx) / length };
  });
  const expanded = vertices.map((p, i) => {
    const n1 = normals[(i + 2) % 3],
      n2 = normals[i],
      scale = 1.2 / Math.max(0.00001, 1 + n1.x * n2.x + n1.y * n2.y);
    return { x: p.x + (n1.x + n2.x) * scale, y: p.y + (n1.y + n2.y) * scale };
  });
  ctx.save();
  ctx.beginPath();
  expanded.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();
  ctx.transform(sx[0], sy[0], sx[1], sy[1], sx[2], sy[2]);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}
export function plane(ctx, image, pose = {}, camera = {}) {
  const width = pose.width ?? 435,
    height = (width * image.height) / image.width;
  const point = (u, v) =>
    project(
      { x: (u - 0.5) * width, y: (v - 0.5) * height, z: 0 },
      pose,
      camera,
    );
  const corners = [point(0, 0), point(1, 0), point(1, 1), point(0, 1)];
  if (corners.some((p) => p.depth < 100)) return;
  ctx.save();
  ctx.globalAlpha *= pose.alpha ?? 1;
  ctx.beginPath();
  corners.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();
  const strips = 10;
  for (let i = 0; i < strips; i++) {
    const a = i / strips,
      b = (i + 1) / strips;
    triangle(
      ctx,
      image,
      point(a, 0),
      point(b, 0),
      point(b, 1),
      { x: a * image.width, y: 0 },
      { x: b * image.width, y: 0 },
      { x: b * image.width, y: image.height },
    );
    triangle(
      ctx,
      image,
      point(a, 0),
      point(b, 1),
      point(a, 1),
      { x: a * image.width, y: 0 },
      { x: b * image.width, y: image.height },
      { x: a * image.width, y: image.height },
    );
  }
  if (pose.border !== false) {
    ctx.beginPath();
    corners.forEach((p, i) =>
      i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
    );
    ctx.closePath();
    ctx.strokeStyle = "#33333365";
    ctx.lineWidth = 0.75;
    ctx.stroke();
  }
  ctx.restore();
}
