import { Loader2 } from "lucide-react";

interface LoadingPopupProps {
  message: string;
  subMessage?: string;
}

export function LoadingPopup({ message, subMessage }: LoadingPopupProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 text-[var(--gov-blue)] animate-spin" />
          <h3 className="text-lg font-semibold text-[var(--gov-blue-dark)]">{message}</h3>
          {subMessage && (
            <p className="text-center text-[var(--gov-gray-dark)]">{subMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}