'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

type HandleType = 'move' | 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'new' | null;

const HANDLE_HIT = 14;
const MIN_SIZE = 20;

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onCrop, onCancel }: ImageCropperProps) {
  const { direction } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, w: 0, h: 0 });
  const [ready, setReady] = useState(false);
  const [cursor, setCursor] = useState('crosshair');

  const dragRef = useRef<{
    type: HandleType;
    startX: number;
    startY: number;
    startBox: CropBox;
  }>({ type: null, startX: 0, startY: 0, startBox: { x: 0, y: 0, w: 0, h: 0 } });

  const initCropBox = useCallback(() => {
    const el = imageRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w === 0 || h === 0) return;
    setImgSize({ w, h });
    setCropBox({ x: w * 0.1, y: h * 0.1, w: w * 0.8, h: h * 0.8 });
    setReady(true);
  }, []);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      initCropBox();
    } else {
      img.onload = initCropBox;
    }
  }, [initCropBox]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const rect = containerRef.current!.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    const me = e as React.MouseEvent;
    return { x: me.clientX - rect.left, y: me.clientY - rect.top };
  };

  const clamp = useCallback((box: CropBox, size: { w: number; h: number }): CropBox => {
    let { x, y, w, h } = box;
    w = Math.max(MIN_SIZE, w);
    h = Math.max(MIN_SIZE, h);
    x = Math.max(0, Math.min(x, size.w - w));
    y = Math.max(0, Math.min(y, size.h - h));
    w = Math.min(w, size.w - x);
    h = Math.min(h, size.h - y);
    return { x, y, w, h };
  }, []);

  const getHandle = (px: number, py: number, box: CropBox): HandleType => {
    const { x, y, w, h } = box;
    const mx = x + w / 2;
    const my = y + h / 2;
    const hs = HANDLE_HIT;
    if (Math.abs(px - x) < hs && Math.abs(py - y) < hs) return 'tl';
    if (Math.abs(px - (x + w)) < hs && Math.abs(py - y) < hs) return 'tr';
    if (Math.abs(px - x) < hs && Math.abs(py - (y + h)) < hs) return 'bl';
    if (Math.abs(px - (x + w)) < hs && Math.abs(py - (y + h)) < hs) return 'br';
    if (Math.abs(px - mx) < hs && Math.abs(py - y) < hs) return 't';
    if (Math.abs(px - mx) < hs && Math.abs(py - (y + h)) < hs) return 'b';
    if (Math.abs(px - x) < hs && Math.abs(py - my) < hs) return 'l';
    if (Math.abs(px - (x + w)) < hs && Math.abs(py - my) < hs) return 'r';
    if (px >= x && px <= x + w && py >= y && py <= y + h) return 'move';
    return 'new';
  };

  const cursorFor = (h: HandleType): string => {
    switch (h) {
      case 'move': return 'move';
      case 'tl': case 'br': return 'nwse-resize';
      case 'tr': case 'bl': return 'nesw-resize';
      case 't': case 'b': return 'ns-resize';
      case 'l': case 'r': return 'ew-resize';
      default: return 'crosshair';
    }
  };

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const { x, y } = getPos(e);
    const type = ready ? getHandle(x, y, cropBox) : 'new';
    dragRef.current = { type, startX: x, startY: y, startBox: { ...cropBox } };
    if (type === 'new') {
      dragRef.current.startBox = { x, y, w: 0, h: 0 };
      setCropBox({ x, y, w: 0, h: 0 });
    }
  };

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    const dr = dragRef.current;

    if (!dr.type) {
      if (ready && !('touches' in e)) {
        const { x, y } = getPos(e);
        setCursor(cursorFor(getHandle(x, y, cropBox)));
      }
      return;
    }

    e.preventDefault();
    const { x, y } = getPos(e);
    const dx = x - dr.startX;
    const dy = y - dr.startY;
    const sb = dr.startBox;
    let nb: CropBox = { ...cropBox };

    switch (dr.type) {
      case 'move': nb = { ...sb, x: sb.x + dx, y: sb.y + dy }; break;
      case 'new':
        nb = { x: Math.min(dr.startX, x), y: Math.min(dr.startY, y), w: Math.abs(dx), h: Math.abs(dy) };
        break;
      case 'br': nb = { ...sb, w: Math.max(MIN_SIZE, sb.w + dx), h: Math.max(MIN_SIZE, sb.h + dy) }; break;
      case 'tl': nb = { x: sb.x + dx, y: sb.y + dy, w: Math.max(MIN_SIZE, sb.w - dx), h: Math.max(MIN_SIZE, sb.h - dy) }; break;
      case 'tr': nb = { x: sb.x, y: sb.y + dy, w: Math.max(MIN_SIZE, sb.w + dx), h: Math.max(MIN_SIZE, sb.h - dy) }; break;
      case 'bl': nb = { x: sb.x + dx, y: sb.y, w: Math.max(MIN_SIZE, sb.w - dx), h: Math.max(MIN_SIZE, sb.h + dy) }; break;
      case 't': nb = { ...sb, y: sb.y + dy, h: Math.max(MIN_SIZE, sb.h - dy) }; break;
      case 'b': nb = { ...sb, h: Math.max(MIN_SIZE, sb.h + dy) }; break;
      case 'l': nb = { ...sb, x: sb.x + dx, w: Math.max(MIN_SIZE, sb.w - dx) }; break;
      case 'r': nb = { ...sb, w: Math.max(MIN_SIZE, sb.w + dx) }; break;
    }

    setCropBox(clamp(nb, imgSize));
  };

  const onUp = () => {
    const dr = dragRef.current;
    if (dr.type === 'new' && cropBox.w < MIN_SIZE) {
      setCropBox(clamp({ x: imgSize.w * 0.1, y: imgSize.h * 0.1, w: imgSize.w * 0.8, h: imgSize.h * 0.8 }, imgSize));
    }
    setReady(true);
    dragRef.current.type = null;
    setCursor('crosshair');
  };

  const applyCrop = () => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !ready) return;

    const scaleX = img.naturalWidth / imgSize.w;
    const scaleY = img.naturalHeight / imgSize.h;
    const sx = Math.round(cropBox.x * scaleX);
    const sy = Math.round(cropBox.y * scaleY);
    const sw = Math.round(cropBox.w * scaleX);
    const sh = Math.round(cropBox.h * scaleY);

    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    onCrop(canvas.toDataURL('image/jpeg', 0.95));
  };

  const { x, y, w, h } = cropBox;
  const showBox = ready && w > 0 && h > 0;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col" dir="ltr">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 border-b border-white/10 flex-shrink-0">
        <span className="text-white font-semibold text-base">
          {direction === 'rtl' ? 'قص الصورة' : 'Crop Image'}
        </span>
        <span className="text-gray-400 text-sm">
          {direction === 'rtl' ? 'اسحب لتحديد منطقة القص، واسحب الحواف لتغيير الحجم' : 'Drag to select area, drag edges to resize'}
        </span>
      </div>

      {/* Crop Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        <div
          ref={containerRef}
          className="relative inline-block select-none"
          style={{ cursor }}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="crop"
            className="block max-w-full object-contain pointer-events-none"
            style={{ maxHeight: '68vh' }}
            draggable={false}
            onLoad={initCropBox}
          />

          {showBox && (
            <>
              {/* Dark mask: 4 rectangles around the crop box */}
              <div className="absolute bg-black/55 pointer-events-none" style={{ top: 0, left: 0, right: 0, height: y }} />
              <div className="absolute bg-black/55 pointer-events-none" style={{ top: y + h, left: 0, right: 0, bottom: 0 }} />
              <div className="absolute bg-black/55 pointer-events-none" style={{ top: y, left: 0, width: x, height: h }} />
              <div className="absolute bg-black/55 pointer-events-none" style={{ top: y, left: x + w, right: 0, height: h }} />

              {/* Crop border */}
              <div
                className="absolute pointer-events-none"
                style={{ left: x, top: y, width: w, height: h, border: '2px solid #d4af37', boxSizing: 'border-box' }}
              >
                {/* Rule of thirds grid */}
                <div className="absolute inset-y-0 opacity-40 pointer-events-none" style={{ left: '33.33%', borderLeft: '1px solid white' }} />
                <div className="absolute inset-y-0 opacity-40 pointer-events-none" style={{ left: '66.66%', borderLeft: '1px solid white' }} />
                <div className="absolute inset-x-0 opacity-40 pointer-events-none" style={{ top: '33.33%', borderTop: '1px solid white' }} />
                <div className="absolute inset-x-0 opacity-40 pointer-events-none" style={{ top: '66.66%', borderTop: '1px solid white' }} />
              </div>

              {/* Corner handles */}
              <div className="absolute w-3.5 h-3.5 bg-accent-gold border-2 border-white rounded-sm pointer-events-none" style={{ left: x - 7, top: y - 7 }} />
              <div className="absolute w-3.5 h-3.5 bg-accent-gold border-2 border-white rounded-sm pointer-events-none" style={{ left: x + w - 7, top: y - 7 }} />
              <div className="absolute w-3.5 h-3.5 bg-accent-gold border-2 border-white rounded-sm pointer-events-none" style={{ left: x - 7, top: y + h - 7 }} />
              <div className="absolute w-3.5 h-3.5 bg-accent-gold border-2 border-white rounded-sm pointer-events-none" style={{ left: x + w - 7, top: y + h - 7 }} />

              {/* Edge handles */}
              <div className="absolute w-3 h-3 bg-accent-gold border-2 border-white rounded-sm pointer-events-none" style={{ left: x + w / 2 - 6, top: y - 6 }} />
              <div className="absolute w-3 h-3 bg-accent-gold border-2 border-white rounded-sm pointer-events-none" style={{ left: x + w / 2 - 6, top: y + h - 6 }} />
              <div className="absolute w-3 h-3 bg-accent-gold border-2 border-white rounded-sm pointer-events-none" style={{ left: x - 6, top: y + h / 2 - 6 }} />
              <div className="absolute w-3 h-3 bg-accent-gold border-2 border-white rounded-sm pointer-events-none" style={{ left: x + w - 6, top: y + h / 2 - 6 }} />
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 px-4 py-4 bg-black/60 border-t border-white/10 flex-shrink-0">
        <button
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all font-medium"
        >
          <X className="w-5 h-5" />
          {direction === 'rtl' ? 'إلغاء' : 'Cancel'}
        </button>
        <button
          onClick={applyCrop}
          disabled={!ready || w < MIN_SIZE || h < MIN_SIZE}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-gold hover:bg-yellow-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
        >
          <Check className="w-5 h-5" />
          {direction === 'rtl' ? 'تطبيق القص' : 'Apply Crop'}
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
