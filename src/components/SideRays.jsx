import { useEffect, useRef, useState } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

// Adapted from the Side Rays preset by React Bits.
const hexToRgb = (hex) => {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return match
    ? [
        Number.parseInt(match[1], 16) / 255,
        Number.parseInt(match[2], 16) / 255,
        Number.parseInt(match[3], 16) / 255
      ]
    : [1, 1, 1];
};

const originToFlip = (origin) => {
  switch (origin) {
    case "top-left":
      return [1, 0];
    case "bottom-right":
      return [0, 1];
    case "bottom-left":
      return [1, 1];
    default:
      return [0, 0];
  }
};

export default function SideRays({
  speed = 2.5,
  rayColor1 = "#EAB308",
  rayColor2 = "#ffc100",
  intensity = 2,
  spread = 2.7,
  origin = "top-right",
  tilt = 0,
  saturation = 1.5,
  blend = 0.75,
  falloff = 1.6,
  opacity = 1,
  className = ""
}) {
  const containerRef = useRef(null);
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateCapability = () => {
      setCanAnimate(!motionQuery.matches && "WebGLRenderingContext" in window);
    };

    updateCapability();
    motionQuery.addEventListener("change", updateCapability);

    return () => motionQuery.removeEventListener("change", updateCapability);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !canAnimate) return undefined;

    const renderer = new Renderer({
      alpha: true,
      dpr: window.innerWidth <= 620 ? 1 : Math.min(window.devicePixelRatio, 2)
    });
    const { gl } = renderer;
    const canvas = gl.canvas;
    let frameId = null;

    canvas.setAttribute("aria-hidden", "true");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.replaceChildren(canvas);

    const vertex = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragment = `precision highp float;
      uniform float iTime;
      uniform vec2 iResolution;
      uniform float iSpeed;
      uniform vec3 iRayColor1;
      uniform vec3 iRayColor2;
      uniform float iIntensity;
      uniform float iSpread;
      uniform float iFlipX;
      uniform float iFlipY;
      uniform float iTilt;
      uniform float iSaturation;
      uniform float iBlend;
      uniform float iFalloff;
      uniform float iOpacity;

      float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speedValue) {
        vec2 sourceToCoord = coord - raySource;
        float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
        return clamp(
          (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speedValue)) +
          (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speedValue)),
          0.0,
          1.0
        ) * clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
      }

      void main() {
        vec2 fragCoord = gl_FragCoord.xy;
        if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
        if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

        vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
        vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);
        float tiltRad = iTilt * 3.14159265 / 180.0;
        float cosine = cos(tiltRad);
        float sine = sin(tiltRad);
        vec2 relative = coord - rayPos;
        vec2 tiltedCoord = vec2(
          relative.x * cosine - relative.y * sine,
          relative.x * sine + relative.y * cosine
        ) + rayPos;

        float halfSpread = iSpread * 0.275;
        vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
        vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));
        vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);
        vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);
        vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;

        float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;
        float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
        color.rgb *= brightness;
        float grayscale = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        color.rgb = mix(vec3(grayscale), color.rgb, iSaturation);
        color.a = max(color.r, max(color.g, color.b)) * iOpacity;
        gl_FragColor = color;
      }
    `;

    const [flipX, flipY] = originToFlip(origin);
    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: [1, 1] },
      iSpeed: { value: speed },
      iRayColor1: { value: hexToRgb(rayColor1) },
      iRayColor2: { value: hexToRgb(rayColor2) },
      iIntensity: { value: intensity },
      iSpread: { value: spread },
      iFlipX: { value: flipX },
      iFlipY: { value: flipY },
      iTilt: { value: tilt },
      iSaturation: { value: saturation },
      iBlend: { value: blend },
      iFalloff: { value: falloff },
      iOpacity: { value: opacity }
    };
    const mesh = new Mesh({
      geometry: new Triangle(gl),
      program: new Program(gl, { vertex, fragment, uniforms })
    });

    const resize = () => {
      const dpr = window.innerWidth <= 620 ? 1 : Math.min(window.devicePixelRatio, 2);
      renderer.dpr = dpr;
      renderer.setSize(container.clientWidth, container.clientHeight);
      uniforms.iResolution.value = [container.clientWidth * dpr, container.clientHeight * dpr];
    };

    const render = (time) => {
      if (!document.hidden) {
        uniforms.iTime.value = time * 0.001;
        renderer.render({ scene: mesh });
      }
      frameId = window.requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();
    frameId = window.requestAnimationFrame(render);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      const loseContext = gl.getExtension("WEBGL_lose_context");
      loseContext?.loseContext();
      canvas.remove();
    };
  }, [
    blend,
    canAnimate,
    falloff,
    intensity,
    opacity,
    origin,
    rayColor1,
    rayColor2,
    saturation,
    speed,
    spread,
    tilt
  ]);

  return (
    <div
      ref={containerRef}
      className={`side-rays-container ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
