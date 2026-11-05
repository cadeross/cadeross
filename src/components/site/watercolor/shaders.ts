/* The watercolor's shaders (WebGL2, GLSL ES 3.00).

   PAPER_DATA   one tile of cold-press paper: tooth height, sizing (how
                readily it takes water) and a slower mottle. Tiles seamlessly.
   PAPER_COLOR  the same tile lit from the top left, for the page's
                background, so the whole site sits on one sheet.
   SIM          one step of wet paint on that paper: water spreads (slowly
                into dry paper, freely through damp), carries pigment, and
                pushes it toward the drying edges; it evaporates, and the
                pigment settles, more of it into the tooth's valleys.
   PALETTE      the colour of each pigment, per cell. A new palette bleeds
                outward from a point instead of switching everywhere at once.
   COMPOSITE    the paint as light through layers of pigment (Beer-Lambert),
                with granulation, a darker wet sheen and the edges' bite.

   Pigment is stored as four amounts, one per palette stop, so the painting
   can change colour in place without turning muddy. */

export const MAX_DABS = 32;

export const VERT = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const NOISE = `
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
}
float hash1(vec2 p) {
  return fract(sin(dot(p, vec2(41.31, 289.17))) * 43758.5453);
}
// Gradient noise that repeats every 'per' cells.
float pnoise(vec2 p, float per) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = dot(hash2(mod(i, per)), f);
  float b = dot(hash2(mod(i + vec2(1.0, 0.0), per)), f - vec2(1.0, 0.0));
  float c = dot(hash2(mod(i + vec2(0.0, 1.0), per)), f - vec2(0.0, 1.0));
  float d = dot(hash2(mod(i + vec2(1.0, 1.0), per)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
// Distance to the nearest of a jittered grid of points, repeating.
float worley(vec2 p, float per) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float d = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = hash2(mod(i + g, per)) * 0.42 + 0.5;
      vec2 r = g + o - f;
      d = min(d, dot(r, r));
    }
  }
  return sqrt(d);
}
`;

export const PAPER_DATA = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 o;
${NOISE}
void main() {
  vec2 uv = v_uv;
  // Tooth: rounded bumps a few pixels across, softened by finer noise.
  float bumps = 1.0 - smoothstep(0.0, 0.85, worley(uv * 92.0, 92.0));
  float bumps2 = 1.0 - smoothstep(0.0, 0.9, worley(uv * 46.0 + 3.1, 46.0));
  float fine = pnoise(uv * 220.0, 220.0);
  float mid = pnoise(uv * 36.0, 36.0);
  float broad = pnoise(uv * 8.0, 8.0);
  // Fibres: short, stretched streaks in a couple of directions.
  float fib = pnoise(vec2(uv.x * 340.0, uv.y * 40.0), 340.0) * pnoise(vec2(uv.x * 30.0 + uv.y * 30.0, uv.y * 300.0), 300.0);
  float h = 0.5 + bumps * 0.32 + bumps2 * 0.18 + fine * 0.16 + mid * 0.22 + broad * 0.18 + fib * 0.35 - 0.3;
  h = clamp(h, 0.0, 1.0);
  // Sizing: how readily the paper takes water, a slow uneven field.
  float sizing = 0.5 + pnoise(uv * 5.0, 5.0) * 0.55 + pnoise(uv * 17.0 + 9.0, 17.0) * 0.35 + fine * 0.1;
  // A mid-scale mottle for flocculating pigment.
  float mottle = 0.5 + pnoise(uv * 28.0 + 4.0, 28.0) * 0.6 + pnoise(uv * 64.0, 64.0) * 0.3;
  o = vec4(h, clamp(sizing, 0.0, 1.0), clamp(mottle, 0.0, 1.0), 1.0);
}
`;

export const PAPER_COLOR = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_data;
uniform vec2 u_texel;
uniform vec3 u_base;
out vec4 o;
float hash1(vec2 p) {
  return fract(sin(dot(p, vec2(41.31, 289.17))) * 43758.5453);
}
void main() {
  float h = texture(u_data, v_uv).r;
  float hx = texture(u_data, v_uv + vec2(u_texel.x, 0.0)).r - texture(u_data, v_uv - vec2(u_texel.x, 0.0)).r;
  float hy = texture(u_data, v_uv + vec2(0.0, u_texel.y)).r - texture(u_data, v_uv - vec2(0.0, u_texel.y)).r;
  vec3 n = normalize(vec3(-hx * 2.2, -hy * 2.2, 1.0));
  vec3 L = normalize(vec3(-0.55, 0.65, 0.75));
  float shade = dot(n, L) / L.z;
  vec3 col = u_base * (0.962 + 0.038 * shade) * (0.99 + 0.012 * h);
  // The odd fleck of fibre.
  float fleck = step(0.9985, hash1(floor(v_uv * 1024.0)));
  col *= 1.0 - fleck * 0.07;
  o = vec4(col, 1.0);
}
`;

const PAPER_AT = `
uniform sampler2D u_paper;
uniform vec2 u_res;
uniform float u_scale;
uniform float u_tile;
uniform vec4 u_region;
// The paper under a cell. Cells are GL-up; the paper tile is laid from the
// page's top left, the same as the CSS background.
vec4 paperAt(vec2 cell) {
  vec2 css = vec2(cell.x, u_res.y - cell.y) / u_scale;
  return texture(u_paper, vec2(css.x / u_tile, 1.0 - css.y / u_tile));
}
// The sheet the painting may use, with a ragged edge so nothing stops on a
// straight line.
float regionMask(vec2 c, vec4 p) {
  vec2 lo = c - u_region.xy;
  vec2 hi = u_region.zw - c;
  float d = min(min(lo.x, lo.y), min(hi.x, hi.y));
  float n = (p.g - 0.5) * 46.0 * u_scale + (p.b - 0.5) * 20.0 * u_scale;
  return smoothstep(-6.0 * u_scale, 14.0 * u_scale, d + n);
}
`;

export const SIM = `#version 300 es
precision highp float;
uniform sampler2D u_s0;
uniform sampler2D u_s1;
uniform sampler2D u_s2;
${PAPER_AT}
uniform float u_h;
uniform float u_evap;
uniform float u_wash;
uniform int u_n;
uniform vec4 u_da[${MAX_DABS}];
uniform vec4 u_db[${MAX_DABS}];
uniform vec4 u_dc[${MAX_DABS}];
layout(location = 0) out vec4 o0;
layout(location = 1) out vec4 o1;
layout(location = 2) out vec4 o2;

float permAt(vec2 c, vec4 p) {
  return mix(0.28, 1.0, p.g) * mix(0.75, 1.0, p.r) * regionMask(c, p);
}

void main() {
  ivec2 ip = ivec2(gl_FragCoord.xy);
  ivec2 mx = ivec2(u_res) - 1;
  vec2 cell = gl_FragCoord.xy;
  vec4 a0 = texelFetch(u_s0, ip, 0);
  vec4 a1 = texelFetch(u_s1, ip, 0);
  vec4 a2 = texelFetch(u_s2, ip, 0);
  vec4 pp = paperAt(cell);
  float w = a0.x;
  float damp = a0.y;
  float perm = permAt(cell, pp);
  vec4 conc = a1 / max(w, 0.05);

  float dw = 0.0;
  vec4 ds = vec4(0.0);
  for (int i = 0; i < 4; i++) {
    ivec2 off = i == 0 ? ivec2(1, 0) : i == 1 ? ivec2(-1, 0) : i == 2 ? ivec2(0, 1) : ivec2(0, -1);
    ivec2 q = clamp(ip + off, ivec2(0), mx);
    vec4 b0 = texelFetch(u_s0, q, 0);
    vec4 b1 = texelFetch(u_s1, q, 0);
    vec2 qc = vec2(q) + 0.5;
    float permq = permAt(qc, paperAt(qc));
    float wn = b0.x;
    float diff = wn - w;
    // Water crosses freely where both sides are wet or the paper is still
    // damp; into dry paper it creeps, held back by the sizing.
    float wet = clamp(max(min(w, wn) * 6.0, max(damp, b0.y) * 0.9), 0.0, 1.0);
    float g = min(perm, permq) * mix(0.05, 1.0, wet) * smoothstep(0.02, 0.1, max(w, wn));
    float F = 0.19 * diff * g;
    vec4 concn = b1 / max(wn, 0.05);
    dw += F;
    ds += F > 0.0 ? F * concn : F * conc;
    // Pigment drifts toward the thinner water, which is where the edge is
    // drying: the dark rim of a dried wash.
    float both = smoothstep(0.008, 0.05, min(w, wn));
    float E = 0.05 * diff * both;
    ds += E > 0.0 ? E * concn : E * conc;
  }

  w += dw;
  vec4 s = a1 + ds;
  vec4 d = a2;

  // Thin water goes first.
  float ev = u_evap * u_h * (1.0 + 2.6 * (1.0 - smoothstep(0.0, 0.3, w)));
  w = max(0.0, w - ev);

  float inside = regionMask(cell, pp);
  for (int i = 0; i < ${MAX_DABS}; i++) {
    if (i >= u_n) break;
    vec4 A = u_da[i];
    vec4 B = u_db[i];
    vec4 C = u_dc[i];
    // C.z flattens the mark (a lily pad seen across the water).
    vec2 dv = cell - A.xy;
    dv.y /= C.z > 0.0 ? C.z : 1.0;
    float dist = length(dv);
    float r = A.z;
    if (dist > r * 1.4) continue;
    // A brush's mark is never a circle: the paper and the hairs rag it.
    float rag = (pp.r - 0.5) * 0.3 + (pp.b - 0.5) * 0.34 + (pp.g - 0.5) * 0.2;
    float m = 1.0 - smoothstep(r * 0.7, r, dist + rag * r);
    // A dry brush only touches the tops of the tooth.
    if (C.y > 0.0) m *= smoothstep(1.0 - C.y - 0.1, 1.0 - C.y + 0.08, pp.r);
    m *= inside;
    if (m <= 0.0) continue;
    w = max(w, A.w * m);
    s += B * m;
    vec4 lifted = d * clamp(C.x * m, 0.0, 1.0);
    d -= lifted;
    s += lifted;
    damp = max(damp, w);
  }

  // Pigment settles as the water leaves, more of it into the valleys.
  float settle = (0.22 + 6.5 * (1.0 - smoothstep(0.0, 0.28, w))) * (0.5 + 1.0 * (1.0 - pp.r)) * u_h;
  if (w < 0.003) settle = 1.0;
  vec4 moved = s * clamp(settle, 0.0, 1.0);
  s -= moved;
  d += moved;

  // Washing the sheet between pages.
  float keep = 1.0 - clamp(u_wash * u_h, 0.0, 1.0);
  d *= keep;
  s *= keep;

  // However much is laid on, the paper only holds so much.
  float tot = dot(s + d, vec4(1.0));
  if (tot > 1.5) {
    float k = 1.5 / tot;
    s *= k;
    d *= k;
  }

  damp = max(w, damp - 0.09 * u_h);
  o0 = vec4(w, damp, 0.0, 1.0);
  o1 = max(s, vec4(0.0));
  o2 = max(d, vec4(0.0));
}
`;

export const PALETTE = `#version 300 es
precision highp float;
uniform sampler2D u_p0;
uniform sampler2D u_p1;
uniform sampler2D u_p2;
${PAPER_AT}
uniform vec3 u_k0;
uniform vec3 u_k1;
uniform vec3 u_k2;
uniform vec3 u_k3;
uniform vec4 u_front;
uniform float u_rate;
layout(location = 0) out vec4 o0;
layout(location = 1) out vec4 o1;
layout(location = 2) out vec4 o2;
void main() {
  ivec2 ip = ivec2(gl_FragCoord.xy);
  vec4 p0 = texelFetch(u_p0, ip, 0);
  vec4 p1 = texelFetch(u_p1, ip, 0);
  vec4 p2 = texelFetch(u_p2, ip, 0);
  vec4 pp = paperAt(gl_FragCoord.xy);
  float W = u_front.w;
  float dist = length(gl_FragCoord.xy - u_front.xy);
  // The new colour bleeds out along the paper, not in a perfect circle.
  float front = u_front.z - dist + (pp.g - 0.5) * W * 1.8 + (pp.b - 0.5) * W * 0.9;
  float arrive = smoothstep(0.0, 1.0, front / W);
  float k = arrive * u_rate;
  o0 = mix(p0, vec4(u_k0, u_k3.r), k);
  o1 = mix(p1, vec4(u_k1, u_k3.g), k);
  o2 = mix(p2, vec4(u_k2, u_k3.b), k);
}
`;

export const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D u_s0;
uniform sampler2D u_s1;
uniform sampler2D u_s2;
uniform sampler2D u_p0;
uniform sampler2D u_p1;
uniform sampler2D u_p2;
uniform sampler2D u_paper;
uniform vec2 u_cres;
uniform vec2 u_sres;
uniform float u_dpr;
uniform float u_tile;
out vec4 o;

float total(vec2 uv) {
  return dot(texture(u_s2, uv) + texture(u_s1, uv), vec4(1.0));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_cres;
  vec4 a0 = texture(u_s0, uv);
  vec4 a1 = texture(u_s1, uv);
  vec4 a2 = texture(u_s2, uv);
  vec4 P0 = texture(u_p0, uv);
  vec4 P1 = texture(u_p1, uv);
  vec4 P2 = texture(u_p2, uv);
  vec2 css = vec2(gl_FragCoord.x, u_cres.y - gl_FragCoord.y) / u_dpr;
  vec4 pp = texture(u_paper, vec2(css.x / u_tile, 1.0 - css.y / u_tile));

  vec4 amt = a2 + a1 * 0.9;
  vec3 k3 = vec3(P0.w, P1.w, P2.w);
  vec3 A = amt.x * P0.rgb + amt.y * P1.rgb + amt.z * P2.rgb + amt.w * k3;

  // The bite of a dried edge: where the amount of pigment changes fast.
  vec2 t = 1.0 / u_sres;
  float gx = total(uv + vec2(t.x, 0.0)) - total(uv - vec2(t.x, 0.0));
  float gy = total(uv + vec2(0.0, t.y)) - total(uv - vec2(0.0, t.y));
  float edge = clamp(length(vec2(gx, gy)) * 1.1, 0.0, 0.4);

  // Granulation: pigment sits in the valleys of the tooth.
  float valley = 1.0 - pp.r;
  A *= 0.72 + 0.6 * valley;
  // Flocculation: a soft mottle through the wash.
  A *= 0.88 + 0.24 * pp.b;
  A *= 1.0 + edge;

  // Wet paint reads deeper, and wet paper a touch grey.
  float w = a0.x;
  A *= 1.0 + 0.24 * smoothstep(0.0, 0.5, w);
  vec3 T = exp(-A);
  T *= 1.0 - 0.045 * smoothstep(0.0, 0.35, w) * (0.6 + 0.4 * valley);
  // A little sheen on the tops of the tooth while it's wet.
  T += 0.025 * smoothstep(0.25, 0.7, w) * smoothstep(0.62, 0.9, pp.r);

  o = vec4(pow(clamp(T, 0.0, 1.0), vec3(1.0 / 2.2)), 1.0);
}
`;
