import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type HTMLAttributes,
  type Ref,
} from "react";
import { cn } from "@/lib/utils";
import { displacementMap, displacementScale } from "@/lib/liquid-glass";

let refractionSupport: boolean | null = null;
/** SVG filters inside backdrop-filter only render in Chromium browsers; others get the frosted fallback. */
function supportsRefraction(): boolean {
  if (refractionSupport !== null) return refractionSupport;
  const nav = navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } };
  const brands = nav.userAgentData?.brands;
  refractionSupport = brands
    ? brands.some((b) => /Chromium|Google Chrome|Microsoft Edge/.test(b.brand))
    : /Chrome\/\d+/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
  return refractionSupport;
}

type Props = HTMLAttributes<HTMLElement> & {
  as?: "div" | "aside" | "section" | "header" | "nav" | "footer";
  radius?: number;
  refract?: boolean;
};

export function LiquidGlass({
  as = "div",
  radius = 32,
  refract = true,
  className,
  style,
  children,
  ...rest
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const id = "lg-" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!refract || !supportsRefraction()) return;
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      setSize((p) => (p && p.w === w && p.h === h ? p : w > 0 && h > 0 ? { w, h } : null));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [refract]);

  const map = useMemo(() => (size ? displacementMap(size.w, size.h, radius) : null), [size, radius]);
  const scale = size ? displacementScale(size.w, size.h) : 0;
  const Comp = as as ElementType;

  return (
    <Comp
      ref={ref as Ref<HTMLElement>}
      className={cn("liquid-glass relative", className)}
      style={{
        borderRadius: radius,
        ...(map
          ? { backdropFilter: `blur(0px) url(#${id}) blur(0px) saturate(1.5) brightness(1.1)` }
          : null),
        ...style,
      }}
      {...rest}
    >
      {map && size && (
        <svg width="0" height="0" aria-hidden="true" className="pointer-events-none absolute">
          <filter
            id={id}
            x="0"
            y="0"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feImage x="0" y="0" width={size.w} height={size.h} href={map} result="displacementMap" />
            <feDisplacementMap in="SourceGraphic" in2="displacementMap" scale={scale} xChannelSelector="R" yChannelSelector="G" />
            <feColorMatrix type="matrix" result="displacedR" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
            <feDisplacementMap in="SourceGraphic" in2="displacementMap" scale={Math.max(0, scale - 2)} xChannelSelector="R" yChannelSelector="G" />
            <feColorMatrix type="matrix" result="displacedG" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" />
            <feDisplacementMap in="SourceGraphic" in2="displacementMap" scale={Math.max(0, scale - 4)} xChannelSelector="R" yChannelSelector="G" />
            <feColorMatrix type="matrix" result="displacedB" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />
            <feBlend in="displacedR" in2="displacedG" mode="screen" result="rg" />
            <feBlend in="rg" in2="displacedB" mode="screen" />
          </filter>
        </svg>
      )}
      {children}
    </Comp>
  );
}
