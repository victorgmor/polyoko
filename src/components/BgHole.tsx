import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function BgHole() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2f62ff);
    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
    camera.position.set(0, 4, 21);
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    el.appendChild(renderer.domElement);

    const gu = { time: { value: 0 } };
    const sizes: number[] = [];
    const shift: number[] = [];
    const pts: THREE.Vector3[] = [];
    const pushShift = () => {
      shift.push(
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2,
        (Math.random() * 0.9 + 0.1) * Math.PI * 0.1,
        Math.random() * 0.9 + 0.1,
      );
    };
    // ponytail: 40k points, original was 150k
    for (let i = 0; i < 12000; i++) {
      sizes.push(Math.random() * 1.5 + 0.5);
      pushShift();
      pts.push(new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * 0.5 + 9.5));
    }
    for (let i = 0; i < 28000; i++) {
      const r = 10, R = 40;
      const rand = Math.pow(Math.random(), 1.5);
      const radius = Math.sqrt(R * R * rand + (1 - rand) * r * r);
      pts.push(
        new THREE.Vector3().setFromCylindricalCoords(
          radius,
          Math.random() * 2 * Math.PI,
          (Math.random() - 0.5) * 2,
        ),
      );
      sizes.push(Math.random() * 1.5 + 0.5);
      pushShift();
    }

    const g = new THREE.BufferGeometry().setFromPoints(pts);
    g.setAttribute("sizes", new THREE.Float32BufferAttribute(sizes, 1));
    g.setAttribute("shift", new THREE.Float32BufferAttribute(shift, 4));
    const m = new THREE.PointsMaterial({
      size: 0.125,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      onBeforeCompile: (shader) => {
        shader.uniforms.time = gu.time;
        shader.vertexShader = `
          uniform float time;
          attribute float sizes;
          attribute vec4 shift;
          varying vec3 vColor;
          #define PI2 6.28318530718
          ${shader.vertexShader}
        `
          .replace(`gl_PointSize = size;`, `gl_PointSize = size * sizes;`)
          .replace(
            `#include <color_vertex>`,
            `#include <color_vertex>
              float d = length(abs(position) / vec3(40., 10., 40));
              d = clamp(d, 0., 1.);
              vColor = mix(vec3(210., 230., 255.), vec3(47., 98., 255.), d) / 255.;
            `,
          )
          .replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>
              float t = time;
              float moveT = mod(shift.x + shift.z * t, PI2);
              float moveS = mod(shift.y + shift.z * t, PI2);
              transformed += vec3(cos(moveS) * sin(moveT), cos(moveT), sin(moveS) * sin(moveT)) * shift.w;
            `,
          );
        shader.fragmentShader = `
          varying vec3 vColor;
          ${shader.fragmentShader}
        `
          .replace(
            `#include <clipping_planes_fragment>`,
            `#include <clipping_planes_fragment>
              float d = length(gl_PointCoord.xy - 0.5);
            `,
          )
          .replace(
            `vec4 diffuseColor = vec4( diffuse, opacity );`,
            `vec4 diffuseColor = vec4( vColor, smoothstep(0.5, 0.1, d) );`,
          );
      },
    });
    const p = new THREE.Points(g, m);
    p.rotation.order = "ZYX";
    p.rotation.z = 0.2;
    scene.add(p);

    const clock = new THREE.Clock();
    const onResize = () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    };
    addEventListener("resize", onResize);

    renderer.setAnimationLoop(() => {
      const t = clock.getElapsedTime() * 0.5;
      gu.time.value = t * Math.PI;
      p.rotation.y = t * 0.05;
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      removeEventListener("resize", onResize);
      g.dispose();
      m.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="bg-hole" ref={host} aria-hidden />;
}
