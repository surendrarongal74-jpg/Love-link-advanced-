import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Image as ImageIcon, Video as VideoIcon, Play, Trash2, Eye, Plus, Maximize2, Sparkles, AlertCircle } from 'lucide-react';
import { sound } from '../lib/sound';

export interface QuestionAttachmentItem {
  id: string;
  type: 'image' | 'video';
  url: string; // Object URL or Data URL
  name: string;
  size: number;
  duration?: number; // Video duration in seconds
  thumbnailUrl?: string;
  file?: File;
}

interface DailyQuestionAttachmentPreviewProps {
  attachments: QuestionAttachmentItem[];
  onRemoveAttachment: (id: string) => void;
  onClearAll?: () => void;
  onAddMore?: () => void;
  disabled?: boolean;
  maxAttachments?: number;
  className?: string;
}

export function DailyQuestionAttachmentPreview({
  attachments,
  onRemoveAttachment,
  onClearAll,
  onAddMore,
  disabled = false,
  maxAttachments = 5,
  className = ''
}: DailyQuestionAttachmentPreviewProps) {
  const [selectedPreview, setSelectedPreview] = useState<QuestionAttachmentItem | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Video';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (disabled) return;
    sound.playPop();
    onRemoveAttachment(id);
    if (selectedPreview?.id === id) {
      setSelectedPreview(null);
    }
  };

  const photoCount = attachments.filter(a => a.type === 'image').length;
  const videoCount = attachments.filter(a => a.type === 'video').length;

  return (
    <div className={`w-full my-3 ${className}`}>
      {/* Header bar with counter and clear action */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-900 bg-rose-100/70 border border-rose-200/80 px-2.5 py-1 rounded-full shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>
              {attachments.length} {attachments.length === 1 ? 'Attachment' : 'Attachments'}
              {photoCount > 0 && videoCount > 0 && (
                <span className="text-rose-600/80 font-normal ml-1">
                  ({photoCount} {photoCount === 1 ? 'photo' : 'photos'}, {videoCount} {videoCount === 1 ? 'video' : 'videos'})
                </span>
              )}
            </span>
          </span>
          <span className="text-[11px] text-rose-700/60 font-medium">
            (Tap to preview or remove)
          </span>
        </div>

        {attachments.length > 1 && onClearAll && !disabled && (
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              onClearAll();
            }}
            className="text-xs font-medium text-rose-500 hover:text-rose-700 hover:underline transition-colors px-1"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Attachments preview list */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <AnimatePresence mode="popLayout">
          {attachments.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.75, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              onClick={() => setSelectedPreview(item)}
              className="group relative bg-white/95 rounded-2xl border border-rose-200/90 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-rose-300 transition-all active:scale-[0.98]"
            >
              {/* Media Content */}
              <div className="relative aspect-4/3 w-full bg-rose-50/70 overflow-hidden flex items-center justify-center">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
                    <video
                      src={item.url}
                      className="w-full h-full object-cover opacity-85"
                      muted
                      playsInline
                      preload="metadata"
                      onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
                      onMouseLeave={(e) => {
                        const v = e.currentTarget as HTMLVideoElement;
                        v.pause();
                        v.currentTime = 0;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow-md backdrop-blur-xs group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Overlay Gradient for Contrast */}
                <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none" />

                {/* Remove Button - Prominent, accessible, instant removal */}
                <button
                  type="button"
                  aria-label={`Remove ${item.type === 'image' ? 'photo' : 'video'} ${item.name}`}
                  onClick={(e) => handleRemove(e, item.id)}
                  disabled={disabled}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-rose-950/80 hover:bg-rose-600 text-white flex items-center justify-center shadow-md backdrop-blur-xs transition-all active:scale-90 hover:scale-110"
                  title="Remove attachment"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>

                {/* Type & Duration Badge */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/65 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs">
                  {item.type === 'image' ? (
                    <>
                      <ImageIcon className="w-3 h-3 text-rose-300" />
                      <span>Photo</span>
                    </>
                  ) : (
                    <>
                      <VideoIcon className="w-3 h-3 text-amber-300" />
                      <span>{formatDuration(item.duration)}</span>
                    </>
                  )}
                </div>

                {/* Expand / Inspect hint on hover */}
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white rounded-full p-1">
                  <Maximize2 className="w-3 h-3" />
                </div>
              </div>

              {/* Bottom Metadata bar */}
              <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] bg-white border-t border-rose-100">
                <span className="truncate max-w-[95px] text-rose-950 font-medium" title={item.name}>
                  {item.name}
                </span>
                <span className="text-rose-700/60 font-mono text-[10px] shrink-0">
                  {formatFileSize(item.size)}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add more button if limit not reached */}
        {onAddMore && attachments.length < maxAttachments && !disabled && (
          <motion.button
            layout
            type="button"
            onClick={onAddMore}
            className="aspect-4/3 rounded-2xl border-2 border-dashed border-rose-300/80 hover:border-rose-400 bg-rose-50/40 hover:bg-rose-100/50 flex flex-col items-center justify-center gap-1.5 text-rose-600 hover:text-rose-700 transition-all active:scale-[0.98] group"
          >
            <div className="w-8 h-8 rounded-full bg-white text-rose-500 shadow-xs flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">Add more</span>
            <span className="text-[10px] text-rose-400">Photo or clip</span>
          </motion.button>
        )}
      </div>

      {/* Fullscreen Preview Lightbox Modal */}
      <AnimatePresence>
        {selectedPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPreview(null)}
            className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-black/50 border-b border-white/10 text-white z-10">
                <div className="flex items-center gap-2 overflow-hidden">
                  {selectedPreview.type === 'image' ? (
                    <ImageIcon className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <VideoIcon className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="text-sm font-semibold truncate">{selectedPreview.name}</span>
                  <span className="text-xs text-white/50 shrink-0">
                    ({formatFileSize(selectedPreview.size)})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, selectedPreview.id)}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPreview(null)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body / Media View */}
              <div className="relative flex-1 bg-black flex items-center justify-center p-2 min-h-[260px] overflow-hidden">
                {selectedPreview.type === 'image' ? (
                  <img
                    src={selectedPreview.url}
                    alt={selectedPreview.name}
                    className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl"
                  />
                ) : (
                  <video
                    src={selectedPreview.url}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[65vh] w-auto max-w-full rounded-xl"
                  />
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 bg-zinc-950 flex items-center justify-between text-xs text-zinc-400 border-t border-white/10">
                <span>
                  {selectedPreview.type === 'image' ? 'Image preview' : 'Video clip preview'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPreview(null)}
                  className="text-rose-300 hover:text-rose-200 font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to process File objects into QuestionAttachmentItem
export async function processFileToAttachment(file: File): Promise<QuestionAttachmentItem> {
  const isVideo = file.type.startsWith('video/');
  const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  if (isVideo) {
    const objectUrl = URL.createObjectURL(file);
    // Measure video duration
    const duration = await new Promise<number>((resolve) => {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.src = objectUrl;
      v.onloadedmetadata = () => resolve(v.duration || 0);
      v.onerror = () => resolve(0);
    });

    return {
      id,
      type: 'video',
      url: objectUrl,
      name: file.name || 'Video clip',
      size: file.size,
      duration,
      file
    };
  }

  // Compress image to fast DataURL for instant inline storage
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1000;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

        resolve({
          id,
          type: 'image',
          url: compressedDataUrl,
          name: file.name || 'Photo',
          size: Math.round(compressedDataUrl.length * 0.75), // approximate byte size
          file
        });
      };
      img.onerror = () => {
        resolve({
          id,
          type: 'image',
          url: reader.result as string,
          name: file.name || 'Photo',
          size: file.size,
          file
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
