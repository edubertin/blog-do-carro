"use client";

import { domAnimation, LazyMotion, m, MotionConfig, useReducedMotion } from "motion/react";
import type { ReactElement, ReactNode } from "react";

type MotionProviderProps = { children: ReactNode };
type RevealProps = { children: ReactNode; className?: string; delay?: number; id?: string };

export function MotionProvider({ children }: MotionProviderProps): ReactElement {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

export function Reveal({ children, className, delay = 0, id }: RevealProps): ReactElement {
  const reduceMotion = useReducedMotion();
  return (
    <m.div
      className={className}
      id={id}
      initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={reduceMotion ? undefined : { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
