import React from 'react';
import { XCircle } from 'lucide-react';

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

export default function ErrorModal({ message, onClose }: ErrorModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="relative w-[90vw] max-w-[90vw] sm:max-w-sm bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col p-6" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Error</h2>
          <p className="text-sm text-muted-foreground mb-6">{message}</p>
          <div className="flex justify-center w-full">
            <button onClick={onClose} className="w-full px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:opacity-80 transition-opacity rounded-lg">OK</button>
          </div>
        </div>
      </div>
    </div>
  );
}
