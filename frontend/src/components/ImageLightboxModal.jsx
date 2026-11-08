import React from 'react';
import { X, Download, ZoomIn, ZoomOut, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export default function ImageLightboxModal({ imageUrl, title, onClose }) {
  const [zoomed, setZoomed] = useState(false);

  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between text-white text-xs px-2">
          <span className="font-semibold text-slate-200 truncate max-w-md">
            {title || 'Report Proof Photograph'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoomed(!zoomed)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={zoomed ? 'Zoom Out' : 'Zoom In'}
            >
              {zoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Open Full Image"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-rose-600 text-white transition-colors"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Canvas */}
        <div className="relative overflow-auto max-h-[80vh] rounded-2xl border border-white/20 shadow-2xl flex items-center justify-center bg-black/40">
          <img
            src={imageUrl}
            alt={title || 'Observation Proof'}
            className={`transition-transform duration-200 object-contain max-h-[78vh] rounded-xl ${
              zoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
            }`}
            onClick={() => setZoomed(!zoomed)}
          />
        </div>
      </div>
    </div>
  );
}

