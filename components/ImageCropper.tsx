'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, RotateCcw, RotateCw, X } from 'lucide-react';
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

  const [workingImageSrc, setWorkingImageSrc] = useState(imageSrc);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, w: 0, h: 0 });
  const [ready, setReady] = useState(false);
  const [cursor, setCursor] = useState('crosshair');
  const [isTransforming, setIsTransforming] = useState(false);

  const dragRef = useRef<{
    type: HandleType;
    startX: number;
    startY: number;
    startBox: CropBox;
  }>({ type: null, startX: 0, startY: 0, startBox: { x: 0, y: 0, w: 0, h: 0 } });

  useEffect(() => {
    setWorkingImageSrc(imageSrc);
    setReady(false);
  }, [imageSrc]);

  const initCropBox = useCallback(() => {
    const el = imageRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w === 0 || h === 0) return;
    setImgSize({ w, h });
    setCropBox({ x: 0, y: 0, w, h });
    setReady(true);
  }, []);

  useEffect(() => {
    if (!workingImageSrc) return;
    const img = imageRef.current;
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      initCropBox();
    } else {
      img.onload = initCropBox;
    }
  }, [initCropBox, workingImageSrc]);

  const rotateImage = useCallback(async (turn: 'left' | 'right') => {
    if (isTransforming) return;
    setIsTransforming(true);
    try {
      const source = workingImageSrc;
      const loadedImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image for rotation'));
        img.src = source;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = loadedImage.naturalHeight;
      canvas.height = loadedImage.naturalWidth;

      if (turn === 'right') {
        ctx.translate(canvas.width, 0);
        ctx.rotate(Math.PI / 2);
      } else {
        ctx.translate(0, canvas.height);
        ctx.rotate(-Math.PI / 2);
      }

      ctx.drawImage(loadedImage, 0, 0);
      setWorkingImageSrc(canvas.toDataURL('image/jpeg', 0.95));
      setReady(false);
    } catch (error) {
      console.error('Image rotation failed:', error);
    } finally {
      setIsTransforming(false);
    }
  }, [isTransforming, workingImageSrc]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
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
      case 'tl':
      case 'br':
        return 'nwse-resize';
      case 'tr':
      case 'bl':
        return 'nesw-resize';
      case 't':
      case 'b':
        return 'ns-resize';
      case 'l':
      case 'r':
        return 'ew-resize';
      default:
        return 'crosshair';
    }
  };

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isTransforming) return;
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
    if (isTransforming) return;
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
      case 'move':
        nb = { ...sb, x: sb.x + dx, y: sb.y + dy };
        break;
      case 'new':
        nb = { x: Math.min(dr.startX, x), y: Math.min(dr.startY, y), w: Math.abs(dx), h: Math.abs(dy) };
        break;
      case 'br':
        nb = { ...sb, w: Math.max(MIN_SIZE, sb.w + dx), h: Math.max(MIN_SIZE, sb.h + dy) };
        break;
      case 'tl':
        nb = { x: sb.x + dx, y: sb.y + dy, w: Math.max(MIN_SIZE, sb.w - dx), h: Math.max(MIN_SIZE, sb.h - dy) };
        break;
      case 'tr':
        nb = { x: sb.x, y: sb.y + dy, w: Math.max(MIN_SIZE, sb.w + dx), h: Math.max(MIN_SIZE, sb.h - dy) };
        break;
      case 'bl':
        nb = { x: sb.x + dx, y: sb.y, w: Math.max(MIN_SIZE, sb.w - dx), h: Math.max(MIN_SIZE, sb.h + dy) };
        break;
      case 't':
        nb = { ...sb, y: sb.y + dy, h: Math.max(MIN_SIZE, sb.h - dy) };
        break;
      case 'b':
        nb = { ...sb, h: Math.max(MIN_SIZE, sb.h + dy) };
        break;
      case 'l':
        nb = { ...sb, x: sb.x + dx, w: Math.max(MIN_SIZE, sb.w - dx) };
        break;
      case 'r':
        nb = { ...sb, w: Math.max(MIN_SIZE, sb.w + dx) };
        break;
    }

    setCropBox(clamp(nb, imgSize));
  };

  const onUp = () => {
    const dr = dragRef.current;
    if (dr.type === 'new' && cropBox.w < MIN_SIZE) {
      setCropBox(clamp({ x: 0, y: 0, w: imgSize.w, h: imgSize.h }, imgSize));
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
      <div className="px-4 py-3 bg-black/60 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <span className="text-white font-semibold text-base">
            {direction === 'rtl' ? 'تعديل الصورة' : 'Edit Image'}
          </span>
          <span className="text-gray-400 text-sm text-right">
            {direction === 'rtl'
              ? 'اسحب لتحديد منطقة القص، ويمكنك التدوير من الأزرار'
              : 'Drag to select crop area, or use rotate buttons'}
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          <button
            type="button"
            onClick={() => rotateImage('left')}
            disabled={isTransforming}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">{direction === 'rtl' ? 'تدوير يسار' : 'Rotate Left'}</span>
          </button>
          <button
            type="button"
            onClick={() => rotateImage('right')}
            disabled={isTransforming}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-sm">{direction === 'rtl' ? 'تدوير يمين' : 'Rotate Right'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        <div
          ref={containerRef}
          className="relative inline-block select-none"
          style={{ cursor: isTransforming ? 'progress' : cursor }}
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
            src={workingImageSrc}
            alt="editable"
            className="block max-w-full object-contain pointer-events-none"
            style={{ maxHeight: '68vh' }}
            draggable={false}
            onLoad={initCropBox}
          />

          {isTransforming && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35 pointer-events-none">
              <span className="text-white text-sm font-medium">
                {direction === 'rtl' ? 'جاري تدوير الصورة...' : 'Rotating image...'}
              </span>
            </div>
          )}

          {showBox && (
            <>
              <div className="absolute bg-black/55 pointer-events-none" style={{ top: 0, left: 0, right: 0, height: y }} />
              <div className="absolute bg-black/55 pointer-events-none" style={{ top: y + h, left: 0, right: 0, bottom: 0 }} />
              <div className="absolute bg-black/55 pointer-events-none" style={{ top: y, left: 0, width: x, height: h }} />
              <div className="absolute bg-black/55 pointer-events-none" style={{ top: y, left: x + w, right: 0, height: h }} />

              <div
                className="absolute pointer-events-none"
                style={{ left: x, top: y, width: w, height: h, border: '2px solid #d4af37', boxSizing: 'border-box' }}
              >
                <div className="absolute inset-y-0 opacity-40 pointer-events-none" style={{ left: '33.33%', borderLeft: '1px solid white' }} />
                <div className="absolute inset-y-0 opacity-40 pointer-events-none" style={{ left: '66.66%', borderLeft: '1px solid white' }} />
                <div className="absolute inset-x-0 opacity-40 pointer-events-none" style={{ top: '33.33%', borderTop: '1px solid white' }} />
                <div className="absolute inset-x-0 opacity-40 pointer-events-none" style={{ top: '66.66%', borderTop: '1px solid white' }} />
              </div>

              <div className="absolute w-3.5 h-3.5 bg-accent-gold border-2 border-white rounded-sm pointer-events-none" style={{ left: x - 7, top: y - 7 }} />
              <div className="absolute w-3.5 h-3.5 bg-accent-gold border-2 border-white rounded-sm pointer-events-none" style={{ left: x + w - 7, top: y - 7 }} />
              <div className="absolute w-3.5 h-3.5 bg-accent-gold border-2 border-white rounded-sm pointer-events-none" style={{ left: x - 7, top: y + h - 7 }} />
              <div className="absolute w-3.5 h-3.5 bg-accent-gold border-2 border-white rounded-sm pointer-events-none" style={{ left: x + w - 7, top: y + h - 7 }} />

              <div className="absolute w-3 h-3 bg-accent-gold border-2 border-white rounded-sm pointer-events-none" style={{ left: x + w / 2 - 6, top: y - 6 }} />
              <div className="absolute w-3 h-3 bg-accent-gold border-2 border-white rounded-sm pointer-events-none" style={{ left: x + w / 2 - 6, top: y + h - 6 }} />
              <div className="absolute w-3 h-3 bg-accent-gold border-2 border-white rounded-sm pointer-events-none" style={{ left: x - 6, top: y + h / 2 - 6 }} />
              <div className="absolute w-3 h-3 bg-accent-gold border-2 border-white rounded-sm pointer-events-none" style={{ left: x + w - 6, top: y + h / 2 - 6 }} />
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3 px-4 py-4 bg-black/60 border-t border-white/10 flex-shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all font-medium"
        >
          <X className="w-5 h-5" />
          {direction === 'rtl' ? 'إلغاء' : 'Cancel'}
        </button>
        <button
          type="button"
          onClick={applyCrop}
          disabled={!ready || w < MIN_SIZE || h < MIN_SIZE || isTransforming}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-gold hover:bg-yellow-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
        >
          <Check className="w-5 h-5" />
          {direction === 'rtl' ? 'تطبيق التعديل' : 'Apply Edit'}
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
