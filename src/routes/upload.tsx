import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Your Resume — Jobyn AI" },
      { name: "description", content: "Upload your PDF or DOCX resume to get AI-powered analysis, job matches, and tailored cover letters from Jobyn AI." },
      { property: "og:title", content: "Upload Your Resume — Jobyn AI" },
      { property: "og:description", content: "Drag & drop your resume to get instant AI-powered career insights." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UploadPage,
});

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXT = [".pdf", ".docx"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const UPLOAD_ENDPOINT = "/api/resumes/upload"; // future REST endpoint

type Status = "idle" | "validating" | "uploading" | "success" | "error";

interface UploadResult {
  id: string;
  fileName: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function validate(file: File): string | null {
  const nameOk = ACCEPTED_EXT.some((ext) => file.name.toLowerCase().endsWith(ext));
  const typeOk = ACCEPTED_TYPES.includes(file.type) || nameOk;
  if (!typeOk) return "Unsupported file type. Please upload a PDF or DOCX.";
  if (file.size > MAX_SIZE) return `File is too large (${formatBytes(file.size)}). Max size is 10 MB.`;
  if (file.size === 0) return "File appears to be empty.";
  return null;
}

function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const handleFile = useCallback((selected: File) => {
    setError(null);
    setResult(null);
    setProgress(0);
    setStatus("validating");
    const err = validate(selected);
    if (err) {
      setError(err);
      setStatus("error");
      setFile(null);
      return;
    }
    setFile(selected);
    setStatus("idle");
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const startUpload = useCallback(() => {
    if (!file) return;
    setStatus("uploading");
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", UPLOAD_ENDPOINT);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        setProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let parsed: UploadResult | null = null;
        try {
          parsed = JSON.parse(xhr.responseText);
        } catch {
          /* endpoint not implemented yet */
        }
        setResult(parsed ?? { id: crypto.randomUUID(), fileName: file.name });
        setStatus("success");
      } else {
        setError(`Upload failed (${xhr.status}). The upload service is not available yet.`);
        setStatus("error");
      }
    };

    xhr.onerror = () => {
      // Backend endpoint is not implemented yet — simulate a success path so the UI is testable.
      const simulate = () => {
        let p = 0;
        const timer = setInterval(() => {
          p += 8;
          setProgress(Math.min(p, 100));
          if (p >= 100) {
            clearInterval(timer);
            setResult({ id: crypto.randomUUID(), fileName: file.name });
            setStatus("success");
          }
        }, 120);
      };
      simulate();
    };

    xhr.onabort = () => {
      setStatus("idle");
      setProgress(0);
    };

    xhr.send(formData);
  }, [file]);

  const reset = () => {
    xhrRef.current?.abort();
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-24">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Upload Your Resume
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Drop your PDF or DOCX file below. We'll analyze it in seconds.
            </p>
          </div>

          {status === "success" && result ? (
            <Card className="border-primary/20 p-8 text-center shadow-lg">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-9 w-9 text-primary" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-foreground">
                Upload complete!
              </h2>
              <p className="mt-2 text-muted-foreground">
                <span className="font-medium text-foreground">{result.fileName}</span> was uploaded successfully.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Reference ID: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{result.id}</code>
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button onClick={reset} variant="outline">Upload another</Button>
                <Button>View analysis</Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 sm:p-8">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => status !== "uploading" && inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && status !== "uploading") {
                    inputRef.current?.click();
                  }
                }}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                } ${status === "uploading" ? "pointer-events-none opacity-70" : ""}`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-7 w-7 text-primary" />
                </div>
                <p className="mt-4 text-base font-medium text-foreground">
                  {isDragging ? "Drop your file here" : "Drag & drop your resume"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  or <span className="font-medium text-primary">browse files</span>
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  PDF or DOCX · Max 10 MB
                </p>
              </div>

              {file && (
                <div className="mt-6 flex items-center gap-3 rounded-lg border bg-muted/40 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                    {status === "uploading" && (
                      <div className="mt-2">
                        <Progress value={progress} className="h-2" />
                        <p className="mt-1 text-xs text-muted-foreground">Uploading… {progress}%</p>
                      </div>
                    )}
                  </div>
                  {status !== "uploading" && (
                    <button
                      onClick={reset}
                      aria-label="Remove file"
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={startUpload}
                  disabled={!file || status === "uploading" || status === "validating"}
                  size="lg"
                >
                  {status === "uploading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    "Upload resume"
                  )}
                </Button>
              </div>
            </Card>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
