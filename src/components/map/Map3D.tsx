"use client";

/* eslint-disable react-hooks/immutability -- three.js камер ба удирдлагыг шууд өөрчилдөг тул хамаарна */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, MapControls } from "@react-three/drei";
import { AnimatePresence } from "framer-motion";
import gsap from "gsap";
import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from "react";
import * as THREE from "three";
import {
  BOUNDS, OUTLINE_XZ, PLACES, ROADS, distanceToBorder, pointInPolygon, project, surfaceHeight, surfaceHeightXZ, terrainHeightXZ,
} from "@/lib/geo";
import { CATEGORY_TINT, DEFAULT_TINT } from "@/lib/tints";
import { ClusterBubble, Marker, PlaceLabel, PreviewCard, clusterItems, type MapHandle, type MapProps } from "./shared";

const FOV = 32;
const COUNTRY_POLAR = 0.62;
const TAN_HALF = Math.tan((FOV * Math.PI) / 360);
const CENTER_X = (BOUNDS.minX + BOUNDS.maxX) / 2;
const CENTER_Z = (BOUNDS.minZ + BOUNDS.maxZ) / 2;

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

const VERT = /* glsl */ `
attribute float aSd;
varying float vH;
varying float vSd;
varying vec3 vN;
varying vec3 vW;
void main() {
  vH = position.y;
  vSd = aSd;
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uTint;
uniform vec3 uLight;
uniform vec3 uCam;
varying float vH;
varying float vSd;
varying vec3 vN;
varying vec3 vW;
void main() {
  float inside = smoothstep(-0.04, 0.1, vSd);
  vec3 N = normalize(vN);
  float diff = clamp(dot(N, normalize(uLight)) * 0.5 + 0.5, 0.0, 1.0);
  float shade = pow(diff, 1.7);
  float hn = clamp(vH / 0.95, 0.0, 1.0);
  vec3 low = vec3(0.082, 0.078, 0.064);
  vec3 mid = vec3(0.19, 0.172, 0.135);
  vec3 high = vec3(0.46, 0.415, 0.33);
  vec3 base = mix(low, mid, smoothstep(0.0, 0.32, hn));
  base = mix(base, high, smoothstep(0.32, 1.0, hn));
  base *= 0.5 + 0.95 * shade;

  float spacing = 0.05;
  float hh = vH / spacing;
  float fw = fwidth(hh);
  float line = 1.0 - smoothstep(0.0, 1.25 * fw + 0.0001, abs(fract(hh - 0.5) - 0.5));
  float h5 = hh / 5.0;
  float major = 1.0 - smoothstep(0.0, 1.25 * fwidth(h5) + 0.0001, abs(fract(h5 - 0.5) - 0.5));
  float lf = 1.0 - smoothstep(0.28, 0.8, fw);
  vec3 lineCol = mix(vec3(0.66, 0.61, 0.5), uTint, 0.5);
  vec3 col = base + lineCol * (line * 0.15 + major * 0.28) * lf * inside;

  vec3 outsideCol = vec3(0.05, 0.047, 0.039) * (0.7 + 0.6 * shade);
  col = mix(outsideCol, col, inside);

  float bw = fwidth(vSd) * 1.5;
  float edge = 1.0 - smoothstep(0.0, bw + 0.0001, abs(vSd));
  col = mix(col, uTint * 1.2, edge * 0.85);

  float dist = distance(vW, uCam);
  float far = 1.0 - smoothstep(34.0, 66.0, dist);
  float outsideFade = mix(1.0 - smoothstep(0.0, 3.4, -vSd), 1.0, inside);
  gl_FragColor = vec4(col, far * outsideFade);
}
`;

function buildTerrain(segX: number, segZ: number) {
  const pad = 3.6;
  const w = BOUNDS.width + pad * 2;
  const d = BOUNDS.depth + pad * 2;
  const geo = new THREE.PlaneGeometry(w, d, segX, segZ);
  geo.rotateX(-Math.PI / 2);
  geo.translate(CENTER_X, 0, CENTER_Z);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const sd = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const inside = pointInPolygon(x, z);
    const dist = distanceToBorder(x, z);
    const s = inside ? dist : -dist;
    sd[i] = s;
    pos.setY(i, terrainHeightXZ(x, z) * (0.16 + 0.84 * smooth(-0.3, 0.4, s)));
  }
  geo.setAttribute("aSd", new THREE.BufferAttribute(sd, 1));
  geo.computeVertexNormals();
  return geo;
}

function Terrain({ tint, lowPower, invalidate }: { tint: string; lowPower: boolean; invalidate: () => void }) {
  const geometry = useMemo(() => (lowPower ? buildTerrain(220, 110) : buildTerrain(360, 180)), [lowPower]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        uniforms: {
          uTint: { value: new THREE.Color(DEFAULT_TINT) },
          uLight: { value: new THREE.Vector3(-0.6, 0.75, 0.45) },
          uCam: { value: new THREE.Vector3() },
        },
      }),
    [],
  );
  useEffect(() => {
    const target = new THREE.Color(tint);
    const cur = (material.uniforms.uTint.value as THREE.Color).clone();
    const proxy = { t: 0 };
    const tween = gsap.to(proxy, {
      t: 1,
      duration: 0.9,
      ease: "power2.out",
      onUpdate: () => {
        (material.uniforms.uTint.value as THREE.Color).copy(cur).lerp(target, proxy.t);
        invalidate();
      },
    });
    return () => {
      tween.kill();
    };
  }, [tint, material, invalidate]);
  useFrame(({ camera }) => {
    (material.uniforms.uCam.value as THREE.Vector3).copy(camera.position);
  });
  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);
  return <mesh geometry={geometry} material={material} />;
}

function useGlowTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,226,170,1)");
    grad.addColorStop(0.35, "rgba(255,190,110,0.55)");
    grad.addColorStop(1, "rgba(255,170,90,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

function CityLights({ lowPower, animate }: { lowPower: boolean; animate: boolean }) {
  const map = useGlowTexture();
  const ref = useRef<THREE.PointsMaterial>(null);
  const geometry = useMemo(() => {
    const pts: number[] = [];
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 0.9;
    for (const p of PLACES) {
      const [cx, cz] = project(p.lng, p.lat);
      const n = p.slug === "ulaanbaatar" ? (lowPower ? 60 : 130) : p.slug === "erdenet" || p.slug === "darkhan" ? 14 : 6;
      const s = p.slug === "ulaanbaatar" ? 0.07 : 0.035;
      for (let i = 0; i < n; i++) {
        const x = cx + gauss() * s, z = cz + gauss() * s;
        pts.push(x, surfaceHeightXZ(x, z) + 0.012, z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [lowPower]);
  useFrame(({ clock }) => {
    if (animate && ref.current) ref.current.opacity = 0.78 + Math.sin(clock.elapsedTime * 1.3) * 0.12;
  });
  return (
    <points geometry={geometry}>
      <pointsMaterial ref={ref} map={map} size={0.075} sizeAttenuation transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.85} />
    </points>
  );
}

function Roads({ tint }: { tint: string }) {
  const lines = useMemo(() => {
    return ROADS.map(([a, b], idx) => {
      const A = PLACES.find((p) => p.slug === a)!;
      const B = PLACES.find((p) => p.slug === b)!;
      const [ax, az] = project(A.lng, A.lat);
      const [bx, bz] = project(B.lng, B.lat);
      const n = 36;
      const nx = -(bz - az), nz = bx - ax;
      const len = Math.hypot(nx, nz) || 1;
      const bend = 0.05 * (idx % 2 ? 1 : -1);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const off = Math.sin(t * Math.PI) * bend;
        const x = ax + (bx - ax) * t + (nx / len) * off * len * 0.4;
        const z = az + (bz - az) * t + (nz / len) * off * len * 0.4;
        pts.push(new THREE.Vector3(x, surfaceHeightXZ(x, z) + 0.014, z));
      }
      return pts;
    });
  }, []);
  return (
    <>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color={tint} lineWidth={1} transparent opacity={0.32} />
      ))}
    </>
  );
}

type Controls = {
  target: THREE.Vector3;
  update: () => boolean;
  addEventListener: (t: string, cb: () => void) => void;
  removeEventListener: (t: string, cb: () => void) => void;
};

type CamState = { tx: number; tz: number; dist: number; polar: number };

type Anchor = { el: HTMLDivElement; x: number; y: number; z: number };
type Registry = Map<string, Anchor>;
type SceneApi = { zoomInto: (x: number, z: number) => void };

const Scene = forwardRef<MapHandle, MapProps & { onBucket: (b: number) => void; registry: React.RefObject<Registry>; apiRef: React.RefObject<SceneApi | null>; overlayKey: unknown }>(function Scene(props, ref) {
  const { tint, focus, insetLeft, insetBottom, active, reducedMotion, lowPower, onBucket, onReady, registry, apiRef, overlayKey } = props;
  const { camera, size, invalidate } = useThree();
  const controlsRef = useRef<Controls | null>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const inset = useRef({ l: 0, b: 0 });
  const insetTween = useRef<gsap.core.Tween | null>(null);
  const bucketRef = useRef(-99);
  const lastFocusKey = useRef(-1);
  const readyRef = useRef(false);
  const polarRef = useRef(0.95);

  const applyView = useCallback(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.setViewOffset(size.width, size.height, -inset.current.l / 2, inset.current.b / 2, size.width, size.height);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  useEffect(() => {
    insetTween.current?.kill();
    insetTween.current = gsap.to(inset.current, {
      l: insetLeft,
      b: insetBottom,
      duration: reducedMotion ? 0 : 0.7,
      ease: "power3.out",
      onUpdate: () => {
        applyView();
        invalidate();
      },
    });
  }, [insetLeft, insetBottom, reducedMotion, applyView, invalidate]);

  useEffect(() => {
    applyView();
    invalidate();
  }, [applyView, invalidate]);

  const countryDist = useCallback(() => {
    const aspect = Math.max(0.3, (size.width - inset.current.l) / Math.max(1, size.height - inset.current.b));
    const byW = (BOUNDS.width * 1.55) / (2 * TAN_HALF * aspect);
    const byD = (BOUNDS.depth * 1.55) / (2 * TAN_HALF);
    return Math.min(46, Math.max(byW, byD, 8));
  }, [size.width, size.height]);

  const readState = useCallback((): CamState => {
    const c = controlsRef.current!;
    const off = camera.position.clone().sub(c.target);
    const dist = off.length();
    return { tx: c.target.x, tz: c.target.z, dist, polar: Math.acos(Math.min(1, Math.max(-1, off.y / dist))) };
  }, [camera]);

  const writeState = useCallback((s: CamState, az: number) => {
    const c = controlsRef.current!;
    const ty = surfaceHeightXZ(s.tx, s.tz);
    c.target.set(s.tx, ty, s.tz);
    camera.position.set(s.tx + s.dist * Math.sin(s.polar) * Math.sin(az), ty + s.dist * Math.cos(s.polar), s.tz + s.dist * Math.sin(s.polar) * Math.cos(az));
    c.update();
    invalidate();
  }, [camera, invalidate]);

  const animateTo = useCallback((to: Partial<CamState>, duration = 1.25) => {
    const c = controlsRef.current;
    if (!c) return;
    tween.current?.kill();
    const from = readState();
    const off = camera.position.clone().sub(c.target);
    const az = Math.atan2(off.x, off.z);
    const dest: CamState = { ...from, ...to };
    if (reducedMotion || duration === 0) {
      writeState(dest, az);
      return;
    }
    const proxy = { ...from };
    tween.current = gsap.to(proxy, {
      ...dest,
      duration,
      ease: "power3.inOut",
      onUpdate: () => writeState(proxy, az),
    });
  }, [camera, readState, writeState, reducedMotion]);

  // Анхны байрлал ба танилцуулах хөдөлгөөн
  useEffect(() => {
    const c = controlsRef.current;
    if (!c || readyRef.current) return;
    readyRef.current = true;
    const d = countryDist();
    const startDist = reducedMotion ? d : d * 1.35;
    camera.near = 0.05;
    camera.far = 220;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    writeState({ tx: CENTER_X, tz: CENTER_Z, dist: startDist, polar: reducedMotion ? COUNTRY_POLAR : 0.3 }, 0);
    if (!reducedMotion) animateTo({ tx: CENTER_X, tz: CENTER_Z, dist: d, polar: COUNTRY_POLAR }, 2.2);
    onReady?.();
  }, [camera, countryDist, writeState, animateTo, reducedMotion, onReady]);

  // Камерын тушаалууд
  useEffect(() => {
    if (!focus || focus.key === lastFocusKey.current || !controlsRef.current) return;
    lastFocusKey.current = focus.key;
    if (focus.type === "country") {
      animateTo({ tx: CENTER_X, tz: CENTER_Z, dist: countryDist(), polar: COUNTRY_POLAR });
    } else if (focus.type === "point") {
      const [x, z] = project(focus.lng, focus.lat);
      animateTo({ tx: x, tz: z, dist: Math.max(0.8, focus.dist), polar: focus.dist < 4 ? 0.8 : 0.95 });
    } else {
      const xs = focus.points.map(([la, ln]) => project(ln, la));
      const minX = Math.min(...xs.map((p) => p[0])), maxX = Math.max(...xs.map((p) => p[0]));
      const minZ = Math.min(...xs.map((p) => p[1])), maxZ = Math.max(...xs.map((p) => p[1]));
      const aspect = Math.max(0.3, (size.width - inset.current.l) / Math.max(1, size.height - inset.current.b));
      const w = Math.max(0.5, maxX - minX), d = Math.max(0.5, maxZ - minZ);
      const dist = Math.min(countryDist(), Math.max(1.6, Math.max((w * 1.5) / (2 * TAN_HALF * aspect), (d * 1.9) / (2 * TAN_HALF))));
      animateTo({ tx: (minX + maxX) / 2, tz: (minZ + maxZ) / 2, dist, polar: dist < 6 ? 0.85 : 0.95 });
    }
  }, [focus, animateTo, countryDist, size.width, size.height]);

  useImperativeHandle(ref, () => ({
    zoom: (factor: number) => {
      const s = readState();
      animateTo({ dist: Math.min(46, Math.max(0.7, s.dist * factor)) }, 0.55);
    },
    toggleTilt: () => {
      const s = readState();
      const flat = s.polar < 0.3;
      polarRef.current = flat ? 0.95 : 0.04;
      animateTo({ polar: polarRef.current }, 0.9);
    },
    reset: () => animateTo({ tx: CENTER_X, tz: CENTER_Z, dist: countryDist(), polar: COUNTRY_POLAR }),
  }), [animateTo, readState, countryDist]);

  // Камерын өөрчлөлт: бүлэглэлийн түвшин ба хязгаар
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    const onChange = () => {
      const x = c.target.x, z = c.target.z;
      const cx = Math.min(BOUNDS.maxX + 1, Math.max(BOUNDS.minX - 1, x));
      const cz = Math.min(BOUNDS.maxZ + 1, Math.max(BOUNDS.minZ - 1, z));
      if (cx !== x || cz !== z) {
        camera.position.x += cx - x;
        camera.position.z += cz - z;
        c.target.x = cx;
        c.target.z = cz;
      }
      const dist = camera.position.distanceTo(c.target);
      const b = Math.round(Math.log2(dist) * 2.2);
      if (b !== bucketRef.current) {
        bucketRef.current = b;
        onBucket(dist);
      }
    };
    const onStart = () => {
      tween.current?.kill();
    };
    c.addEventListener("change", onChange);
    c.addEventListener("start", onStart);
    onChange();
    return () => {
      c.removeEventListener("change", onChange);
      c.removeEventListener("start", onStart);
    };
  }, [camera, onBucket]);

  useEffect(() => () => {
    tween.current?.kill();
    insetTween.current?.kill();
  }, []);

  const accentTint = tint ? CATEGORY_TINT[tint] ?? DEFAULT_TINT : DEFAULT_TINT;

  const zoomInto = useCallback((x: number, z: number) => {
    const s = readState();
    animateTo({ tx: x, tz: z, dist: Math.max(0.8, s.dist * 0.38), polar: 0.85 }, 0.9);
  }, [animateTo, readState]);

  useEffect(() => {
    apiRef.current = { zoomInto };
  }, [apiRef, zoomInto]);

  // DOM давхарга дахь тэмдэг, шошгыг 3D байрлалтай нь тулгаж байрлуулна.
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera: cam, size: sz }) => {
    cam.updateMatrixWorld();
    for (const a of registry.current.values()) {
      tmp.set(a.x, a.y, a.z).project(cam);
      const visible = tmp.z > -1 && tmp.z < 1 && Math.abs(tmp.x) < 1.25 && Math.abs(tmp.y) < 1.25;
      a.el.style.visibility = visible ? "visible" : "hidden";
      if (visible) a.el.style.transform = `translate3d(${((tmp.x * 0.5 + 0.5) * sz.width).toFixed(1)}px, ${((-tmp.y * 0.5 + 0.5) * sz.height).toFixed(1)}px, 0) translate(-50%, -50%)`;
    }
  });
  useEffect(() => {
    invalidate();
  }, [overlayKey, invalidate]);
  // Шөнийн гэрлийн хөнгөн лугшилтыг дэлгэцийн шинэчлэлтийг хязгаарлан зурна, бусад үед зөвхөн өөрчлөлт гарахад зурна.
  useEffect(() => {
    if (!active || reducedMotion) return;
    const id = window.setInterval(() => invalidate(), lowPower ? 140 : 70);
    return () => window.clearInterval(id);
  }, [active, reducedMotion, lowPower, invalidate]);

  return (
    <>
      <MapControls
        ref={controlsRef as never}
        makeDefault
        enableDamping
        dampingFactor={0.09}
        screenSpacePanning={false}
        minDistance={0.7}
        maxDistance={46}
        minPolarAngle={0.02}
        maxPolarAngle={1.2}
        zoomSpeed={0.9}
        onChange={() => invalidate()}
      />
      <Terrain tint={accentTint} lowPower={lowPower} invalidate={invalidate} />
      <CityLights lowPower={lowPower} animate={active && !reducedMotion} />
      <Roads tint={accentTint} />
      <Line points={OUTLINE_XZ.concat([OUTLINE_XZ[0]]).map(([x, z]) => new THREE.Vector3(x, surfaceHeightXZ(x, z) + 0.02, z))} color="#efe6d0" lineWidth={1.1} transparent opacity={0.55} />

    </>
  );
});

type Props = MapProps;

function Anchor({ id, registry, pos, z, children }: { id: string; registry: React.RefObject<Registry>; pos: [number, number, number]; z: number; children: React.ReactNode }) {
  return (
    <div
      ref={(el) => {
        if (el) registry.current.set(id, { el, x: pos[0], y: pos[1], z: pos[2] });
        else registry.current.delete(id);
      }}
      className="absolute left-0 top-0"
      style={{ zIndex: z, visibility: "hidden", willChange: "transform" }}
    >
      {children}
    </div>
  );
}

export const Map3D = forwardRef<MapHandle, Props>(function Map3D(props, ref) {
  const { items, selectedId, hoveredId, now, userPos, places, onSelect, onHover, onOpen, previews = true } = props;
  const [zoomDist, setZoomDist] = useState(30);
  const registry = useRef<Registry>(new Map());
  const apiRef = useRef<SceneApi | null>(null);
  const onBucket = useCallback((d: number) => setZoomDist(d), []);

  const cell = Math.min(2.2, Math.max(0.035, zoomDist * 0.065));
  const clusters = useMemo(() => clusterItems(items, cell, [selectedId, hoveredId]), [items, cell, selectedId, hoveredId]);
  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const showAllLabels = zoomDist < 14;

  return (
    <div className="absolute inset-0">
      <Canvas
        frameloop={props.active ? "demand" : "never"}
        dpr={props.lowPower ? [1, 1.25] : [1, 1.75]}
        gl={{ antialias: !props.lowPower, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: FOV, near: 0.05, far: 220, position: [0, 24, 14] }}
        style={{ position: "absolute", inset: 0 }}
        onPointerMissed={() => onSelect(null)}
      >
        <Scene ref={ref} {...props} onBucket={onBucket} registry={registry} apiRef={apiRef} overlayKey={clusters} />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {places.map((p) => {
          if (!(p.major || showAllLabels)) return null;
          const [x, z] = project(p.lng, p.lat);
          return (
            <Anchor key={`pl:${p.slug}`} id={`pl:${p.slug}`} registry={registry} pos={[x, surfaceHeightXZ(x, z) + 0.05, z]} z={20}>
              <div style={{ transform: "translateY(-14px)" }}>
                <PlaceLabel name={p.name} major={p.major} />
              </div>
            </Anchor>
          );
        })}

        {userPos && (() => {
          const [x, z] = project(userPos.lng, userPos.lat);
          return (
            <Anchor id="user" registry={registry} pos={[x, surfaceHeightXZ(x, z) + 0.03, z]} z={60}>
              <div className="relative flex items-center justify-center">
                <span className="absolute h-8 w-8 rounded-full bg-[#6fa6ae]/40" style={{ animation: "marker-pulse 2.2s ease-out infinite" }} />
                <span className="relative h-3.5 w-3.5 rounded-full border-2 border-white bg-[#6fa6ae]" />
                <span className="absolute top-5 whitespace-nowrap rounded-full bg-night/90 px-2 py-0.5 text-[10px] font-semibold text-[#f4efe4]">Та энд байна</span>
              </div>
            </Anchor>
          );
        })()}

        {clusters.map((cl) => {
          const y = surfaceHeightXZ(cl.x, cl.z) + 0.03;
          if (cl.items.length > 1) {
            return (
              <Anchor key={cl.id} id={cl.id} registry={registry} pos={[cl.x, y, cl.z]} z={40}>
                <ClusterBubble count={cl.items.length} onClick={() => apiRef.current?.zoomInto(cl.x, cl.z)} />
              </Anchor>
            );
          }
          const it = cl.items[0];
          const selected = selectedId === it.id;
          const hovered = hoveredId === it.id;
          return (
            <Anchor key={cl.id} id={cl.id} registry={registry} pos={[cl.x, y, cl.z]} z={selected ? 1000 : hovered ? 800 : 100}>
              <div className="relative">
                <Marker item={itemsById.get(it.id) ?? it} selected={selected} hovered={hovered} onSelect={() => onSelect(it.id)} onHover={(h) => onHover(h ? it.id : null)} onOpen={() => onOpen(it.slug)} />
                <AnimatePresence>{(selected || hovered) && previews && <PreviewCard key="pc" item={it} now={now} selected={selected} onOpen={() => onOpen(it.slug)} />}</AnimatePresence>
              </div>
            </Anchor>
          );
        })}
      </div>
    </div>
  );
});

export { terrainHeightXZ, surfaceHeight };
