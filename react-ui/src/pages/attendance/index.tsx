import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useCookies } from "react-cookie";
import { toast } from "sonner";
import Button from "../../components/Button";
import { createAttendance, uploadAttendancePhoto } from "../../api/api";

export default function AttendancePage() {
  const [now, setNow] = useState(new Date());
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "uploaded" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cookies] = useCookies(["token"]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadPromiseRef = useRef<Promise<string> | null>(null);
  const uploadGenerationRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOpen]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!photoUrl) return;
    return () => URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  async function openCamera() {
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera capture is unavailable in this browser. Choose an image file instead.");
      return;
    }

    setCameraBusy(true);
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      setCameraOpen(true);
    } catch {
      setCameraError("Camera access was blocked or unavailable. Allow camera access or choose an image file.");
    } finally {
      setCameraBusy(false);
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("The camera is not ready yet. Try again in a moment.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("Could not capture the photo. Please try again.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError("Something went wrong. Please try again.");
        return;
      }

      setSelectedPhoto(new File([blob], `attendance-${Date.now()}.jpg`, { type: "image/jpeg" }));
      stopCamera();
      setCameraError(null);
    }, "image/jpeg", 0.9);
  }

  function setSelectedPhoto(file: File | null) {
    setPhoto(file);
    setPhotoUrl(file ? URL.createObjectURL(file) : null);
    setUploadError(null);
    const generation = ++uploadGenerationRef.current;
    uploadPromiseRef.current = null;

    if (!file) {
      uploadPromiseRef.current = null;
      setUploadState("idle");
      return;
    }
    const token = cookies.token;
    if (!token) {
      setUploadState("error");
      setUploadError("Your session has expired. Sign in again before uploading.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadState("error");
      setUploadError("Photo must be smaller than 5 MB.");
      return;
    }

    setUploadState("uploading");
    const uploadPromise = uploadAttendancePhoto(file, token)
      .then((res) => {
        if (res.statusCode < 200 || res.statusCode >= 300 || !res.data) {
          toast.error(res.message ?? 'Photo upload failed');
        }
        const imageKey = res.data?.imageKey;
        if (!imageKey) {
          toast.error('Photo upload failed');
          throw new Error('Photo upload failed');
        }
        if (generation === uploadGenerationRef.current) setUploadState("uploaded");
        return imageKey;
      })
      .catch((error: unknown) => {
        if (generation === uploadGenerationRef.current) {
          setUploadState("error");
          setUploadError(error instanceof Error ? error.message : "Photo upload failed.");
        }
        throw error;
      });
    uploadPromise.catch(() => undefined);
    uploadPromiseRef.current = uploadPromise;
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error("Choose a JPEG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    setSelectedPhoto(file);
    setCameraError(null);
    stopCamera();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photo) {
      toast.error("Capture or choose a photo before submitting attendance.");
      return;
    }
    const token = cookies.token;
    if (!token) {
      toast.error("Your session has expired. Sign in again.");
      return;
    }

    setSubmitting(true);
    try {
      const imageKey = await uploadPromiseRef.current;

      if (!imageKey) throw new Error(uploadError ?? "Photo upload has not completed.");

      const res = await createAttendance(imageKey, token);
      if (res.statusCode < 200 || res.statusCode >= 300 || !res.data) {
        toast.error(res.message ?? 'Attendance submission failed');
        throw new Error(res.message ?? 'Attendance submission failed');
      }

      toast.success("Attendance submitted successfully.");

      setSelectedPhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit attendance.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-gray-700 p-4">
      <p className="mb-4 text-center text-2xl font-bold">WFH Attendance Form</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="time">Time</label>
          <p id="time" className="w-full rounded-md border border-gray-700 p-2 text-sm text-gray-500">
            {now.toLocaleString()}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span>Photo evidence</span>

          {cameraError && <p role="alert" className="text-sm text-red-700">{cameraError}</p>}
          {uploadState === "uploading" && <p role="status" className="text-sm text-gray-600">Uploading photo securely…</p>}
          {uploadState === "uploaded" && <p role="status" className="text-sm text-green-700">Photo uploaded and ready to submit.</p>}
          {uploadError && <p role="alert" className="text-sm text-red-700">{uploadError}</p>}
          {photoUrl && (
            <div className="flex flex-col gap-2">
              <img src={photoUrl} alt="Attendance photo preview" className="max-h-80 w-full rounded-md object-contain" />
              <div className="flex items-center justify-between">
                <p className="truncate text-sm text-gray-600">{photo?.name}</p>
                <p className="truncate text-sm text-red-600 underline cursor-pointer" onClick={() => {
                  setSelectedPhoto(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}>remove photo</p>
              </div>
            </div>
          )}

          {cameraOpen ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="max-h-80 w-full rounded-md bg-black object-contain"
                aria-label="Camera preview"
              />
              <div className="flex gap-2">
                <Button type="button" className="flex-1" onClick={capturePhoto}>Take photo</Button>
                <Button type="button" variant="secondary" onClick={stopCamera}>Cancel</Button>
              </div>
            </>
          ) : (
            <Button type="button" onClick={openCamera} disabled={cameraBusy}>
              {cameraBusy ? "Opening camera…" : "Capture photo"}
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Choose photo from device"
          />
          <p className="text-sm text-gray-600 underline cursor-pointer" onClick={() => fileInputRef.current?.click()}>or choose an image file</p>

          {uploadState === "error" && photo && (
            <Button type="button" variant="secondary" onClick={() => setSelectedPhoto(photo)}>
              Retry photo upload
            </Button>
          )}
        </div>

        <Button type="submit" className="mt-5" disabled={submitting || uploadState === "uploading" || uploadState === "error"}>
          {submitting ? "Submitting…" : "Submit attendance"}
        </Button>
      </form>
    </div>
  );
}
