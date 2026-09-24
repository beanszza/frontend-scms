"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Camera, CheckCircle2, AlertCircle, RefreshCw, Barcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  itemName: string;
  suggestedLot: string;
  onScanSuccess: (scannedLot: string) => void;
}

export default function QrScannerModal({
  open,
  onClose,
  itemName,
  suggestedLot,
  onScanSuccess,
}: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scanStatus, setScanStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open) {
      stopCamera();
      setScanStatus("idle");
      setErrorMessage("");
      setManualCode("");
      return;
    }

    startCamera();
    return () => {
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        setStream(s);
        setHasCamera(true);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      } else {
        setHasCamera(false);
      }
    } catch {
      // Camera not granted or not available in this environment
      setHasCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const verifyLot = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    const expected = suggestedLot.trim().toUpperCase();

    if (!trimmed) {
      setScanStatus("error");
      setErrorMessage("Please enter or scan a valid QR/Barcode lot number.");
      return;
    }

    if (trimmed === expected) {
      setScanStatus("success");
      setErrorMessage("");
      setTimeout(() => {
        onScanSuccess(suggestedLot);
        onClose();
      }, 700);
    } else {
      setScanStatus("error");
      setErrorMessage(`Verification Failed: Scanned code "${code}" does not match required Lot "${suggestedLot}".`);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-xs">
              <Camera size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Scan Ingredient QR Code</h3>
              <p className="text-xs text-muted-foreground truncate max-w-[260px]">{itemName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Camera / Viewfinder Body */}
        <div className="p-5 space-y-4">
          <div className="relative w-full aspect-4/3 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-border">
            {hasCamera ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <Barcode className="w-12 h-12 text-muted-foreground/40 mb-2 animate-pulse" />
                <p className="text-xs font-semibold text-foreground">Camera Scanner Active</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Point camera at packaging lot QR tag or use barcode simulator below
                </p>
              </div>
            )}

            {/* Target Reticle */}
            <div className="absolute inset-8 border-2 border-foreground/50 rounded-xl pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-foreground" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-foreground" />
              </div>
              <div className="text-center">
                <span className="text-[10px] uppercase tracking-wider font-mono bg-black/70 text-white px-2 py-0.5 rounded">
                  Target Lot: {suggestedLot}
                </span>
              </div>
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-foreground" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-foreground" />
              </div>
            </div>

            {/* Success Overlay */}
            {scanStatus === "success" && (
              <div className="absolute inset-0 bg-background/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-12 h-12 text-foreground" />
                <p className="text-sm font-bold text-foreground">Lot Verified!</p>
                <p className="text-xs text-muted-foreground font-mono">{suggestedLot}</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {scanStatus === "error" && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/40 text-foreground text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-foreground" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Simulation / Scanner test buttons */}
          <div className="space-y-2 pt-1 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Expected Lot Verification</span>
              <span className="font-mono font-bold text-foreground">{suggestedLot}</span>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Scan or input lot code..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") verifyLot(manualCode);
                }}
                className="h-9 text-xs font-mono"
              />
              <Button
                onClick={() => verifyLot(manualCode)}
                className="h-9 px-4 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 shrink-0"
              >
                Verify
              </Button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => verifyLot(suggestedLot)}
                className="w-full text-xs font-medium border-border hover:bg-muted"
              >
                Simulate Successful Scan ({suggestedLot})
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-border bg-muted/20">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs font-semibold border-border hover:bg-muted"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
