const RAY_COUNT = 12;

export default function SideRays({
  rayColor1 = "#EAB308",
  rayColor2 = "#ffc100",
  origin = "top-right",
  speed = 2.5,
  intensity = 2,
  spread = 2.7,
  tilt = 0,
  saturation = 1.5,
  blend = 0.75,
  falloff = 1.6,
  opacity = 1
}) {
  const rays = Array.from({ length: RAY_COUNT }, (_, index) => index);

  return (
    <div
      className={`side-rays side-rays-${origin}`}
      aria-hidden="true"
      style={{
        "--side-ray-color-1": rayColor1,
        "--side-ray-color-2": rayColor2,
        "--side-ray-speed": `${Math.max(0.4, 5 / speed)}s`,
        "--side-ray-intensity": intensity,
        "--side-ray-spread": spread,
        "--side-ray-tilt": `${tilt}deg`,
        "--side-ray-saturation": saturation,
        "--side-ray-blend": blend,
        "--side-ray-falloff": falloff,
        "--side-ray-opacity": opacity
      }}
    >
      <div className="side-rays-glow" />
      <div className="side-rays-beams">
        {rays.map((ray) => (
          <span
            className="side-ray"
            key={ray}
            style={{
              "--side-ray-alpha": 0.012 + (ray % 3) * 0.007,
              "--side-ray-angle": `${-35 + (ray - 5.5) * spread}deg`,
              "--side-ray-delay": `${ray * -0.32}s`,
              "--side-ray-index": ray,
              "--side-ray-width": `${4.5 + ray * 0.28}%`
            }}
          />
        ))}
      </div>
      <div className="side-rays-haze" />
    </div>
  );
}
