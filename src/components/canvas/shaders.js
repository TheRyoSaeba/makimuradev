// The whole look lives in one pass over the key art: the city breathes,
// the sky moves, and the hovered character is lifted out of a dimmed frame
// with a rim light traced around their full silhouette.
// Doing it here instead of a post-processing stack keeps it to a single
// full-screen draw with no extra render targets.

export const passVertex = /* glsl */ `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

export const backgroundFragment = /* glsl */ `
    uniform sampler2D uMap;
    uniform sampler2D uMask;   // full-body silhouettes: r = Ryo, g = Kaori
    uniform vec2 uPx;          // one screen pixel, in background UV
    uniform vec3 uColorMan;
    uniform vec3 uColorWoman;
    uniform float uTime;
    uniform float uBeat;       // music energy 0..1
    uniform float uFocusMan;   // 0..1 spotlight on Ryo
    uniform float uFocusWoman; // 0..1 spotlight on Kaori
    uniform vec2 uHint;        // 0..1 rim-only glint that advertises each character
    uniform float uPanel;      // 0..1 a panel is open: dim, blur, desaturate
    uniform float uFreeze;     // 0..1 ending freeze-frame grade
    uniform float uIntro;      // 0..1 fade up from black
    varying vec2 vUv;

    float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
    }

    float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
                   mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }

    float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
        return v;
    }

    // Rim light for both silhouettes at once. Max over rings at growing
    // screen-space radii gives the outside edge (crisp line, glow, wide halo);
    // the min over the inner ring gives light wrapping just inside the edge.
    // x = Ryo, y = Kaori.
    void rim(vec2 uv, vec2 self, out vec2 line, out vec2 glow, out vec2 inner) {
        vec2 near = vec2(0.0), far = vec2(0.0), halo = vec2(0.0), inside = vec2(1.0);
        for (int i = 0; i < 16; i++) {
            float ang = float(i) * 0.39270;
            vec2 dir = vec2(cos(ang), sin(ang)) * uPx;
            vec2 n = texture2D(uMask, uv + dir * 1.5).rg;
            near = max(near, n);
            inside = min(inside, texture2D(uMask, uv + dir * 4.0).rg);
            far = max(far, texture2D(uMask, uv + dir * 7.0).rg);
            halo = max(halo, texture2D(uMask, uv + dir * 16.0).rg);
        }
        line = clamp(near - self, 0.0, 1.0);
        glow = clamp(far - self, 0.0, 1.0) * 0.5 + clamp(halo - self, 0.0, 1.0) * 0.22;
        inner = clamp(self - inside, 0.0, 1.0) * self;
    }

    vec3 sampleBlurred(vec2 uv, float r) {
        vec3 acc = texture2D(uMap, uv).rgb;
        const float GOLDEN = 2.39996;
        for (int i = 1; i < 12; i++) {
            float fi = float(i);
            float a = fi * GOLDEN;
            acc += texture2D(uMap, uv + vec2(cos(a), sin(a)) * r * sqrt(fi / 12.0)).rgb;
        }
        return acc / 12.0;
    }

    void main() {
        vec2 uv = vUv;
        vec2 fromCenter = uv - 0.5;

        // Lens: a whisper of chromatic aberration toward the frame edge — or,
        // with a panel open, a soft defocus (where CA would be invisible anyway).
        vec3 col;
        if (uPanel > 0.001) {
            col = sampleBlurred(uv, uPanel * 0.0045);
        } else {
            float ca = dot(fromCenter, fromCenter) * 0.006 * (1.0 + uFreeze);
            col.r = texture2D(uMap, uv + fromCenter * ca).r;
            col.g = texture2D(uMap, uv).g;
            col.b = texture2D(uMap, uv - fromCenter * ca).b;
        }

        vec2 cm = texture2D(uMask, uv).rg;
        float man = cm.x;
        float woman = cm.y;
        float people = max(man, woman);
        float lum = dot(col, vec3(0.299, 0.587, 0.114));

        // City lights: most windows hold steady; a sparse few flare and fade on
        // their own clocks, the grid swells with the bass, and a slow wave of
        // brightness rolls across the skyline.
        vec2 cell = floor(uv * vec2(420.0, 236.0));
        float h = hash(cell);
        float flare = pow(max(0.0, sin(uTime * (0.6 + h * 1.6) + h * 50.0)), 12.0) * step(0.82, h);
        float lights = smoothstep(0.5, 0.92, lum) * (1.0 - people) * step(uv.y, 0.86);
        float wave = 0.5 + 0.5 * sin(uv.x * 7.0 - uTime * 0.3 + uv.y * 3.0);
        col += col * lights * (flare * 0.55 + wave * 0.07 + uBeat * 0.3);

        // Sky: drifting haze, fresh stars, and two searchlights sweeping from the horizon.
        float sky = smoothstep(0.84, 0.9, uv.y) * (1.0 - people);
        float haze = fbm(vec2(uv.x * 3.0 + uTime * 0.012, uv.y * 6.0 - uTime * 0.004));
        col += vec3(0.24, 0.26, 0.62) * sky * smoothstep(0.45, 0.85, haze) * 0.22;

        vec2 sg = uv * vec2(420.0, 236.0);
        float sh = hash(floor(sg));
        float star = smoothstep(0.992, 1.0, sh) * smoothstep(0.5, 0.0, length(fract(sg) - 0.5));
        star *= 0.55 + 0.45 * sin(uTime * (0.8 + sh * 3.0) + sh * 40.0);
        col += vec3(0.85, 0.9, 1.0) * star * sky * smoothstep(0.5, 0.2, lum) * 1.3;

        float aspect = 16.0 / 9.0;
        for (int i = 0; i < 2; i++) {
            float fi = float(i);
            vec2 root = mix(vec2(0.265, 0.862), vec2(0.895, 0.858), fi);
            vec2 d = (uv - root) * vec2(aspect, 1.0);
            float ang = atan(d.x, d.y);
            float sweep = sin(uTime * (0.11 + fi * 0.04) + fi * 2.1) * 0.55 + (fi - 0.5) * 0.3;
            float beam = exp(-pow((ang - sweep) * 9.0, 2.0)) * smoothstep(0.0, 0.03, d.y);
            beam *= exp(-length(d) * 1.6) * (1.0 - people);
            col += vec3(0.55, 0.6, 1.0) * beam * (0.16 + uBeat * 0.1);
        }

        // Spotlight: everything but the hovered character falls into shadow.
        // A glint borrows a gentler version of the spotlight so it reads even
        // against the brightest part of the skyline.
        vec2 spot = max(vec2(uFocusMan, uFocusWoman), uHint * 0.55);
        float focus = max(spot.x, spot.y);
        float lifted = clamp(man * spot.x + woman * spot.y, 0.0, 1.0);
        vec3 shadow = mix(col, vec3(lum), 0.55) * vec3(0.26, 0.27, 0.42);
        col = mix(col, shadow, focus * (1.0 - lifted));
        col *= 1.0 + lifted * 0.08;

        vec2 k = max(vec2(uFocusMan, uFocusWoman), uHint);
        if (max(k.x, k.y) > 0.004) {
            vec2 line, glow, inner;
            rim(uv, cm, line, glow, inner);
            // An energy band sweeps up the body; the line itself burns white-hot.
            float travel = fract(uTime * 0.45 - uv.y * 1.6 + uv.x * 0.5);
            float sweep = smoothstep(0.0, 0.25, travel) * smoothstep(0.55, 0.25, travel);
            float pulse = 0.8 + sweep * 0.8 + uBeat * 0.4;
            vec3 rc = uColorMan * k.x * (glow.x + inner.x * 0.55) + uColorWoman * k.y * (glow.y + inner.y * 0.55);
            vec3 core = mix(uColorMan, vec3(1.0), 0.7) * line.x * k.x + mix(uColorWoman, vec3(1.0), 0.7) * line.y * k.y;
            col += (rc + core * 1.2) * pulse;
        }

        // Panel open: push the scene back so type sits on it cleanly.
        vec3 recessed = mix(col, vec3(lum) * vec3(0.55, 0.6, 1.0), 0.6) * 0.32;
        col = mix(col, recessed, uPanel);

        // Ending: the freeze-frame grade of an 80s TV still.
        vec3 still = vec3(dot(col, vec3(0.35, 0.5, 0.15)));
        still = mix(still * vec3(1.12, 0.98, 0.82), col, 0.35);
        still = (still - 0.5) * 1.12 + 0.5;
        col = mix(col, still, uFreeze);

        float vig = smoothstep(1.05, 0.25, length(fromCenter * vec2(1.0, 1.25)));
        col *= mix(0.55, 1.0, vig);
        col *= uIntro;

        // Texture is sampled without sRGB decode, so this math happens in the
        // same display space the art was painted in.
        gl_FragColor = vec4(col, 1.0);
    }
`
