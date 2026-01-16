'use client';

import { UilPlay, UilPause, UilStopCircle } from '@tooni/iconscout-unicons-react';
import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { InstanceConfigManager, t } from '@/core';

interface Props {
  text: string;
  title?: string;
  className?: string;
}

type TTSStatus = 'idle' | 'playing' | 'paused';

export function TextToSpeechButton({ text, title, className }: Props) {
  const [status, setStatus] = useState<TTSStatus>('idle');
  const [isSupported, setIsSupported] = useState(false);

  const isEnabled = InstanceConfigManager.getConfigValue(
    ({ configuration }) =>
      configuration.instanceConfiguration.features.post?.text2Speeech?.enabled ?? false,
  );

  const language = InstanceConfigManager.getConfigValue(
    ({ configuration }) => configuration.general.language || 'en',
  );

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  useEffect(() => {
    // Clean up speech on unmount
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlay = useCallback(() => {
    if (!isSupported) return;

    if (status === 'paused') {
      window.speechSynthesis.resume();
      setStatus('playing');
      return;
    }

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    // Strip HTML and prepare text
    const cleanText = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const fullText = title ? `${title}. ${cleanText}` : cleanText;

    // Split into chunks (browsers have character limits)
    const chunks = splitIntoChunks(fullText, 200);
    let currentChunk = 0;

    const speakChunk = () => {
      if (currentChunk >= chunks.length) {
        setStatus('idle');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[currentChunk]);
      utterance.lang = language;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        currentChunk++;
        speakChunk();
      };

      utterance.onerror = () => {
        setStatus('idle');
      };

      window.speechSynthesis.speak(utterance);
    };

    setStatus('playing');
    speakChunk();
  }, [text, title, language, status, isSupported]);

  const handlePause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setStatus('paused');
  }, [isSupported]);

  const handleStop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setStatus('idle');
  }, [isSupported]);

  if (!isEnabled || !isSupported) {
    return null;
  }

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      {status === 'idle' && (
        <button
          type="button"
          onClick={handlePlay}
          className="flex items-center gap-1 px-2 py-1 text-xs text-theme-muted hover:text-theme-primary transition-colors rounded hover:bg-theme-hover"
          title={t('listen')}
        >
          <UilPlay className="w-4 h-4" />
          <span>{t('listen')}</span>
        </button>
      )}

      {status === 'playing' && (
        <>
          <button
            type="button"
            onClick={handlePause}
            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-500 hover:text-blue-600 transition-colors rounded hover:bg-theme-hover"
            title={t('pause')}
          >
            <UilPause className="w-4 h-4" />
            <span>{t('pause')}</span>
          </button>
          <button
            type="button"
            onClick={handleStop}
            className="p-1 text-theme-muted hover:text-red-500 transition-colors rounded"
            title={t('stop')}
          >
            <UilStopCircle className="w-4 h-4" />
          </button>
        </>
      )}

      {status === 'paused' && (
        <>
          <button
            type="button"
            onClick={handlePlay}
            className="flex items-center gap-1 px-2 py-1 text-xs text-theme-muted hover:text-theme-primary transition-colors rounded hover:bg-theme-hover"
            title={t('resume')}
          >
            <UilPlay className="w-4 h-4" />
            <span>{t('resume')}</span>
          </button>
          <button
            type="button"
            onClick={handleStop}
            className="p-1 text-theme-muted hover:text-red-500 transition-colors rounded"
            title={t('stop')}
          >
            <UilStopCircle className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

// Helper to split text into chunks for speech synthesis
function splitIntoChunks(text: string, maxLength: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
