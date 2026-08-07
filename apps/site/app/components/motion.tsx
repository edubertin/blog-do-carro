"use client";

import { domAnimation, LazyMotion, m, MotionConfig } from "motion/react";
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
  return (
    <m.div
      className={className}
      id={id}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
