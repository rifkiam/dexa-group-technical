import { useEffect, useState } from "react";

type ImagePreviewModalProps = {
  imageUrl: string | null;
  onClose: () => void;
};

export default function ImagePreviewModal({ imageUrl, onClose }: ImagePreviewModalProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoading, setImageLoading] = useState(Boolean(imageUrl));

  useEffect(() => {
    setImageFailed(false);
    setImageLoading(Boolean(imageUrl));
  }, [imageUrl]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendance-photo-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col gap-3 rounded-xl bg-[#1f2028] p-4 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="attendance-photo-title" className="text-lg font-semibold">Attendance photo</h2>
          </div>
          <p className="text-2xl font-bold cursor-pointer pr-2" onClick={onClose}>
            &times;
          </p>
        </div>
        <div className="flex min-h-48 items-center justify-center overflow-auto rounded-lg bg-[#282931] p-2">
          {imageLoading ? (
            <p role="status" className="text-gray-600">Loading image…</p>
          ) : null}
          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt="Employee work from home attendance evidence"
              className="max-h-[70vh] max-w-full object-contain"
              onLoad={() => setImageLoading(false)}
              onError={() => { setImageLoading(false); setImageFailed(true); }}
            />
          ) : !imageLoading ? (
            <p role="alert" className="text-center text-red-700">Could not load this attendance image.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
