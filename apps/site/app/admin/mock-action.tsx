"use client";

import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { useState } from "react";
import type { ReactElement } from "react";

type MockActionProps = Readonly<{
  label: string;
  message: string;
  variant?: "primary" | "secondary" | "danger";
}>;

export function MockAction({ label, message, variant = "secondary" }: MockActionProps): ReactElement {
  const [feedback, setFeedback] = useState("");
  return (
    <div className="mockAction">
      <button className={`adminButton adminButton--${variant}`} type="button" onClick={() => setFeedback(message)}>{label}</button>
      {feedback ? <span className="mockFeedback" role="status"><CheckCircle size={17} weight="fill" />{feedback}</span> : null}
    </div>
  );
}
