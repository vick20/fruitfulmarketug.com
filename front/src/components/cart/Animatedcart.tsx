'use client'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
  type Variants,
} from 'motion/react';
import { Minus, Plus, ShoppingBag, ShoppingBasket, ShoppingCart } from 'lucide-react';

export interface SpringPhysicsConfig {
  stiffness: number;
  damping: number;
  mass: number;
  bounceScale: number;
}

export const SPRING_PRESETS: Record<
  'bouncy' | 'snappy' | 'gentle',
  SpringPhysicsConfig & { label: string; description: string }
> = {
  bouncy: {
    label: 'Playful Bounce',
    description: 'Low damping for lively overshoot on every add.',
    stiffness: 420,
    damping: 13,
    mass: 0.75,
    bounceScale: 1.28,
  },
  snappy: {
    label: 'Crisp Spring',
    description: 'High stiffness with controlled, fast settle.',
    stiffness: 560,
    damping: 22,
    mass: 0.65,
    bounceScale: 1.18,
  },
  gentle: {
    label: 'Soft Roll',
    description: 'Relaxed vertical glide for luxury editorial stores.',
    stiffness: 280,
    damping: 20,
    mass: 0.9,
    bounceScale: 1.12,
  },
};

export interface AnimatedCartCounterProps {
  /** Current numeric count to display */
  value: number;
  /** Spring stiffness (default: 420) */
  stiffness?: number;
  /** Spring damping — lower values produce more bounce (default: 13) */
  damping?: number;
  /** Spring mass (default: 0.75) */
  mass?: number;
  /** Peak scale factor reached on value update (default: 1.28) */
  bounceScale?: number;
  /** Show subtle outward pulse ring on increment (default: true) */
  showPulse?: boolean;
  /** Optional className applied to the outer counter wrapper */
  className?: string;
  /** Optional className applied to the outward pulse ring */
  pulseClassName?: string;
  /** Accessible label prefix (default: "Cart items") */
  ariaLabel?: string;
  /** Optional number formatter (e.g. locale separators for currency totals) */
  formatValue?: (value: number) => string;
}

const digitVariants: Variants = {
  enter: (direction: number) => ({
    y: direction > 0 ? '80%' : '-80%',
    opacity: 0,
    scale: 0.7,
  }),
  center: {
    y: '0%',
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    y: direction > 0 ? '-80%' : '80%',
    opacity: 0,
    scale: 0.7,
  }),
};

export function AnimatedCartCounter({
  value,
  stiffness = SPRING_PRESETS.bouncy.stiffness,
  damping = SPRING_PRESETS.bouncy.damping,
  mass = SPRING_PRESETS.bouncy.mass,
  bounceScale = SPRING_PRESETS.bouncy.bounceScale,
  showPulse = true,
  className = '',
  ariaLabel = 'Cart count',
  formatValue,
}: AnimatedCartCounterProps) {
  const prefersReducedMotion = useReducedMotion();
  const safeValue = Math.max(0, Math.round(value * 100) / 100);

  const prevValueRef = useRef(safeValue);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (safeValue !== prevValueRef.current) {
      setDirection(safeValue >= prevValueRef.current ? 1 : -1);
      prevValueRef.current = safeValue;
    }
  }, [safeValue]);

  const bounceControls = useAnimationControls();
  const hasMountedRef = useRef(false);
  const animRunRef = useRef(0);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (prefersReducedMotion) {
      return;
    }

    const runId = ++animRunRef.current;

    const triggerBounce = async () => {
      bounceControls.stop();
      await bounceControls.start({
        scale: direction > 0 ? bounceScale : Math.max(0.86, 2 - bounceScale),
        y: direction > 0 ? -3 : 2,
        transition: { duration: 0.085, ease: 'easeOut' },
      });

      if (animRunRef.current !== runId) return;

      bounceControls.start({
        scale: 1,
        y: 0,
        transition: {
          type: 'spring',
          stiffness,
          damping,
          mass,
        },
      });
    };

    void triggerBounce();
  }, [safeValue, direction, bounceScale, stiffness, damping, mass, showPulse, prefersReducedMotion, bounceControls]);

  const formatted = formatValue ? formatValue(safeValue) : Math.floor(safeValue).toString();
  const chars = formatted.split('');

  return (
    <motion.span
      animate={bounceControls}
      initial={false}
      aria-live="polite"
      aria-label={`${ariaLabel}: ${formatted}`}
      className={`relative inline-flex items-center justify-center tabular-nums select-none ${className}`}
    >
      {/* Expanding halo ring on increment */}


      {/* Per-place-value digit columns so unchanged leading digits remain rock-solid */}
      <span className="relative inline-flex items-center overflow-hidden px-0.5 leading-none">
        {chars.map((char, idx) => {
          const placeValue = chars.length - 1 - idx;
          if (!/\d/.test(char)) {
            return (
              <span
                key={`sep-${placeValue}-${char}`}
                className="inline-flex h-[1.15em] items-center justify-center"
              >
                {char}
              </span>
            );
          }
          return (
            <span
              key={`place-${placeValue}`}
              className="relative inline-flex h-[1.15em] min-w-[0.62em] items-center justify-center overflow-hidden"
            >
              {prefersReducedMotion ? (
                <span>{char}</span>
              ) : (
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                  <motion.span
                    key={`${placeValue}-${char}`}
                    custom={direction}
                    variants={digitVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      type: 'spring',
                      stiffness,
                      damping,
                      mass,
                      opacity: { duration: 0.14 },
                    }}
                    className="inline-block will-change-transform"
                  >
                    {char}
                  </motion.span>
                </AnimatePresence>
              )}
            </span>
          );
        })}
      </span>
    </motion.span>
  );
}

export type CartIconVariant = 'bag' | 'cart' | 'basket';

const CART_ICON_MAP = {
  bag: ShoppingBag,
  cart: ShoppingCart,
  basket: ShoppingBasket,
} as const;

const CART_DEFAULT_LABELS: Record<CartIconVariant, string> = {
  bag: 'Bag',
  cart: 'Cart',
  basket: 'Basket',
};

export interface AnimatedCartBadgeProps {
  count: number;
  onClick?: () => void;
  physics?: Partial<SpringPhysicsConfig>;
  showZero?: boolean;
  /** Choose built-in icon style: 'bag' | 'cart' | 'basket' (default: 'bag') */
  icon?: CartIconVariant;
  /** Optional custom icon element overriding the built-in icon */
  customIcon?: ReactNode;
  /** Button label; defaults to 'Bag', 'Cart', or 'Basket' based on icon. Pass "" for icon-only. */
  label?: string;
}

export function AnimatedCartBadge({
  count,
  onClick,
  physics,
  showZero = false,
  icon = 'bag',
  customIcon,
  label,
}: AnimatedCartBadgeProps) {
  const prefersReducedMotion = useReducedMotion();
  const iconControls = useAnimationControls();
  const prevCountRef = useRef(count);

  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = count;
    if (count > prev && !prefersReducedMotion) {
      iconControls.stop();
      iconControls.start({
        rotate: [0, -10, 8, -4, 0],
        y: [0, -2.5, 0],
        transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
      });
    }
  }, [count, prefersReducedMotion, iconControls]);

  const stiffness = physics?.stiffness ?? SPRING_PRESETS.bouncy.stiffness;
  const damping = physics?.damping ?? SPRING_PRESETS.bouncy.damping;
  const mass = physics?.mass ?? SPRING_PRESETS.bouncy.mass;
  const bounceScale = physics?.bounceScale ?? SPRING_PRESETS.bouncy.bounceScale;

  const IconComponent = CART_ICON_MAP[icon];
  const resolvedLabel = label !== undefined ? label : CART_DEFAULT_LABELS[icon];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
      aria-label={resolvedLabel ? `${resolvedLabel}, ${count} items` : `Shopping ${icon}, ${count} items`}
      className="group relative inline-flex items-center gap-2.5 rounded-lg border border-fresh/35 bg-primary-dark px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-fresh/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent whitespace-nowrap shrink-0 cursor-pointer"
    >
      <motion.span animate={iconControls} className="inline-flex items-center">
        {customIcon ?? (
          <IconComponent
            className="h-4 w-4 text-accent transition-colors group-hover:text-white"
            strokeWidth={1.75}
          />
        )}
      </motion.span>
      {resolvedLabel !== '' && <span>{resolvedLabel}</span>}

      <AnimatePresence initial={false}>
        {(count > 0 || showZero) && (
          <motion.span
            key="badge-container"
            initial={prefersReducedMotion ? { opacity: 1 } : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 460, damping: 18 }}
            className="inline-flex min-w-6 items-center justify-center rounded-md bg-accent px-1.5 py-0.5 font-mono text-xs font-bold text-primary"
          >
            <AnimatedCartCounter
              value={count}
              stiffness={stiffness}
              damping={damping}
              mass={mass}
              bounceScale={bounceScale}
              pulseClassName="border-accent/70"
            />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export interface CartQuantityStepperProps {
  value: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
  /** Direct quantity setter enabling click-to-edit and accelerated hold steps */
  onChange?: (nextValue: number) => void;
  /** Allow clicking the center number to type an exact quantity (default: true when onChange is provided) */
  editable?: boolean;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  physics?: Partial<SpringPhysicsConfig>;
  itemName?: string;
}

export function CartQuantityStepper({
  value,
  onIncrement,
  onDecrement,
  onChange,
  editable = true,
  min = 0,
  max = 999,
  size = 'md',
  physics,
  itemName = 'item',
}: CartQuantityStepperProps) {
  const prefersReducedMotion = useReducedMotion();
  const isSm = size === 'sm';
  const canEditInline = editable && Boolean(onChange);

  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(String(value));
  const [isHolding, setIsHolding] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const holdTimeoutRef = useRef<number | null>(null);
  const didHoldRepeatRef = useRef(false);
  const latestValueRef = useRef(value);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  const stopHold = useCallback(() => {
    if (holdTimeoutRef.current !== null) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    setIsHolding(false);
  }, []);

  useEffect(() => {
    return () => {
      stopHold();
    };
  }, [stopHold]);



  // Global pointerup/cancel guard in case button disables mid-hold
  useEffect(() => {
    if (!isHolding) return;
    const handleGlobalRelease = () => stopHold();
    window.addEventListener('pointerup', handleGlobalRelease);
    window.addEventListener('pointercancel', handleGlobalRelease);
    return () => {
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('pointercancel', handleGlobalRelease);
    };
  }, [isHolding, stopHold]);



  const applyStep = useCallback(
    (deltaSign: 1 | -1, magnitude: number) => {
      if (onChange) {
        const next = Math.max(min, Math.min(max, latestValueRef.current + deltaSign * magnitude));
        if (next !== latestValueRef.current) {
          latestValueRef.current = next;
          onChange(next);
        }
        return next > min && next < max;
      }

      if (deltaSign > 0) {
        if (latestValueRef.current < max) {
          latestValueRef.current += 1;
          onIncrement?.();
          return latestValueRef.current < max;
        }
      } else if (latestValueRef.current > min) {
        latestValueRef.current -= 1;
        onDecrement?.();
        return latestValueRef.current > min;
      }
      return false;
    },
    [onChange, onIncrement, onDecrement, min, max]
  );

  const startHold = (deltaSign: 1 | -1, e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    if ((deltaSign > 0 && value >= max) || (deltaSign < 0 && value <= min)) return;

    stopHold();
    didHoldRepeatRef.current = false;
    const startedAt = performance.now();

    const scheduleNext = (delayMs: number) => {
      holdTimeoutRef.current = window.setTimeout(() => {
        const elapsed = performance.now() - startedAt;
        const stepSize = !onChange
          ? 1
          : elapsed >= 2200
          ? 5
          : elapsed >= 1100
          ? 2
          : 1;

        const nextDelay = elapsed >= 2200 ? 70 : elapsed >= 1100 ? 85 : 115;

        didHoldRepeatRef.current = true;
        setIsHolding(true);
        const canContinue = applyStep(deltaSign, stepSize);
        if (canContinue) {
          scheduleNext(nextDelay);
        } else {
          stopHold();
        }
      }, delayMs);
    };

    scheduleNext(360);
  };

  const handleButtonClick = (deltaSign: 1 | -1) => {
    if (didHoldRepeatRef.current) {
      didHoldRepeatRef.current = false;
      return;
    }
    applyStep(deltaSign, 1);
  };

  const commitEdit = () => {
    setIsEditing(false);
    if (!onChange) return;
    const trimmed = draftValue.trim();
    if (trimmed === '') return;
    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.max(min, Math.min(max, parsed));
    if (clamped !== value) {
      onChange(clamped);
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
    }
  };

  const effectiveBounceScale = isHolding
    ? Math.min(physics?.bounceScale ?? SPRING_PRESETS.bouncy.bounceScale, 1.1)
    : physics?.bounceScale;

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-zinc-200 bg-white ${
        isSm ? 'h-9 px-1 gap-1' : 'h-10 px-1.5 gap-1.5'
      }`}
      role="group"
      aria-label={`Quantity controls for ${itemName}`}
    >
      <motion.button
        type="button"
        onPointerDown={(e) => startHold(-1, e)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onClick={() => handleButtonClick(-1)}
        disabled={value <= min}
        whileTap={prefersReducedMotion || value <= min ? undefined : { scale: 0.86 }}
        aria-label={`Decrease ${itemName} quantity (hold to repeat)`}
        title="Click or hold to decrease"
        className={`inline-flex items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-35 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-blue-700 cursor-pointer disabled:cursor-not-allowed select-none touch-none ${
          isSm ? 'h-7 w-7' : 'h-8 w-8'
        }`}
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2} />
      </motion.button>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draftValue}
          onChange={(e) => setDraftValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onBlur={commitEdit}
          onKeyDown={handleInputKeyDown}
          aria-label={`Enter quantity for ${itemName}`}
          className={`rounded-md border border-blue-700 bg-blue-50/40 text-center font-mono font-semibold tabular-nums text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-700/20 ${
            isSm ? 'h-7 w-10 text-xs' : 'h-8 w-12 text-sm'
          }`}
        />
      ) : canEditInline ? (
        <button
          type="button"
          onClick={() => {
            setDraftValue(String(value));
            setIsEditing(true);
            requestAnimationFrame(() => {
              inputRef.current?.focus();
              inputRef.current?.select();
            });
          }}
          title="Click to type quantity"
          aria-label={`Edit ${itemName} quantity, current ${value}`}
          className={`inline-flex items-center justify-center rounded-md px-1 font-mono font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-blue-700 cursor-text ${
            isSm ? 'h-7 min-w-7 text-xs' : 'h-8 min-w-9 text-sm'
          }`}
        >
          <AnimatedCartCounter
            value={value}
            stiffness={physics?.stiffness}
            damping={physics?.damping}
            mass={physics?.mass}
            bounceScale={effectiveBounceScale}
            showPulse={false}
          />
        </button>
      ) : (
        <AnimatedCartCounter
          value={value}
          stiffness={physics?.stiffness}
          damping={physics?.damping}
          mass={physics?.mass}
          bounceScale={effectiveBounceScale}
          showPulse={false}
          className={`font-mono font-semibold text-zinc-900 ${
            isSm ? 'min-w-6 text-xs' : 'min-w-8 text-sm'
          }`}
        />
      )}

      <motion.button
        type="button"
        onPointerDown={(e) => startHold(1, e)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        onClick={() => handleButtonClick(1)}
        disabled={value >= max}
        whileTap={prefersReducedMotion || value >= max ? undefined : { scale: 0.86 }}
        aria-label={`Increase ${itemName} quantity (hold to repeat)`}
        title="Click or hold to increase"
        className={`inline-flex items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-35 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-blue-700 cursor-pointer disabled:cursor-not-allowed select-none touch-none ${
          isSm ? 'h-7 w-7' : 'h-8 w-8'
        }`}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
      </motion.button>
    </div>
  );
}
