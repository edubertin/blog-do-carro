import Image from "next/image";
import type { ReactElement } from "react";
import { parseArticleContent } from "@/domain/article-content";
import type { PublicArticle } from "@/domain/public-content";

export function ArticleBlocksRenderer({ body }: Readonly<{ body: PublicArticle["body"] }>): ReactElement {
  const document = parseArticleContent(body);
  return <>{document.blocks.map((block) => {
    if (block.type === "paragraph") return <p key={block.id}>{block.text}</p>;
    if (block.type === "heading") return block.level === 2 ? <h2 key={block.id}>{block.text}</h2> : <h3 key={block.id}>{block.text}</h3>;
    return (
      <figure className={`articleInlineImage articleInlineImage--${block.alignment}`} key={block.id}>
        <Image src={`/media/${encodeURIComponent(block.assetId)}`} alt={block.alt} width={1200} height={800} loading="lazy" sizes="(max-width: 760px) 100vw, 760px" />
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
      </figure>
    );
  })}</>;
}
