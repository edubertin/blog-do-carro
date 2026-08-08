"use client";

import { Play } from "@phosphor-icons/react/Play";
import Image from "next/image";
import { isManagedMediaPath } from "@/domain/media-path";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactElement } from "react";

type YouTubeConsentEmbedProps = {
  videoId: string;
  title: string;
  posterSrc: string;
};

export function YouTubeConsentEmbed({ videoId, title, posterSrc }: YouTubeConsentEmbedProps): ReactElement {
  const [isLoaded, setIsLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const disclosureId = useId();

  useEffect(() => {
    if (isLoaded) iframeRef.current?.focus();
  }, [isLoaded]);

  if (isLoaded) {
    return (
      <div className="youtubeEmbed">
        <iframe
          ref={iframeRef}
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={`Vídeo: ${title}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <div className="youtubeEmbed youtubeConsentEmbed">
      <Image src={posterSrc} alt="" fill sizes="(max-width: 760px) 100vw, 410px" unoptimized={isManagedMediaPath(posterSrc)} />
      <div className="youtubeConsentCopy">
        <span>Privacidade primeiro</span>
        <h3>Você decide quando conectar ao YouTube</h3>
        <p id={disclosureId}>Ao reproduzir, o YouTube poderá receber dados técnicos do seu navegador e dispositivo.</p>
        <button type="button" aria-describedby={disclosureId} onClick={() => setIsLoaded(true)}>
          <Play size={20} weight="fill" aria-hidden="true" />
          Reproduzir vídeo
        </button>
        <a href="/privacidade#videos-do-youtube">Entenda como funciona</a>
      </div>
    </div>
  );
}
