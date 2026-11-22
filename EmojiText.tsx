import { useMemo } from 'react';
import { EmojiSvg } from './EmojiSvg';

export interface EmojiTextProps {
  text: string;
  className?: string;
}

const segmenter = new Intl.Segmenter('ru', { granularity: 'grapheme' });

const EMOJI_ONLY_REGEX = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u;

  export function EmojiText({ text, className }: EmojiTextProps) {
  const parts = useMemo(() => {
    const result: Array<{ type: 'text' | 'emoji'; value: string }> = [];
    const segments = segmenter.segment(text);

    for (const { segment } of segments) {
      if (EMOJI_ONLY_REGEX.test(segment)) {
        result.push({ type: 'emoji', value: segment });
      } else {
        const last = result[result.length - 1];
        if (last && last.type === 'text') {
          last.value += segment;
        } else {
          result.push({ type: 'text', value: segment });
        }
      }
    }
    return result;
  }, [text]);

  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.type === 'emoji' ? (
          <EmojiSvg key={i} char={p.value} className="emoji-inline" />
        ) : (
          <span key={i}>{p.value}</span>
        )
      )}
    </span>
  );
}