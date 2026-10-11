import { useCallback, useEffect, useRef, useState } from 'react';

function readWidth(key) {
  try {
    const value = Number(localStorage.getItem(key));
    return value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeWidth(key, width) {
  try {
    localStorage.setItem(key, String(width));
  } catch {
    // Storage can be blocked (private mode): the width is simply not remembered.
  }
}

// Width of a panel docked on the right edge of `containerRef`, resized with a separator handle.
export function useResizable({ containerRef, storageKey, defaultWidth = 380, minWidth = 260, minRest = 420 }) {
  const [width, setWidth] = useState(() => readWidth(storageKey) ?? defaultWidth);
  const dragging = useRef(false);

  const clamp = useCallback(
    (px) => {
      const total = containerRef.current?.clientWidth ?? Number.POSITIVE_INFINITY;
      return Math.round(Math.max(minWidth, Math.min(px, total - minRest)));
    },
    [containerRef, minWidth, minRest],
  );

  useEffect(() => {
    const fit = () => setWidth((current) => clamp(current));
    fit();
    globalThis.addEventListener('resize', fit);
    return () => globalThis.removeEventListener('resize', fit);
  }, [clamp]);

  function resizeTo(px, remember = true) {
    const next = clamp(px);
    setWidth(next);
    if (remember) writeWidth(storageKey, next);
  }

  const handleProps = {
    role: 'separator',
    'aria-orientation': 'vertical',
    'aria-label': 'Resize the docs panel',
    'aria-valuenow': width,
    'aria-valuemin': minWidth,
    tabIndex: 0,
    onPointerDown(event) {
      dragging.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove(event) {
      if (!dragging.current) return;
      resizeTo(containerRef.current.getBoundingClientRect().right - event.clientX, false);
    },
    onPointerUp() {
      dragging.current = false;
      writeWidth(storageKey, width);
    },
    onDoubleClick() {
      resizeTo(defaultWidth);
    },
    onKeyDown(event) {
      const step = event.shiftKey ? 64 : 24;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        resizeTo(width + step);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        resizeTo(width - step);
      }
    },
  };

  return { width, handleProps };
}
