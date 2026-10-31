import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-[#F9EBEA] border border-[#D9534F] p-6 text-left">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-[#F2D7D5] border border-[#D9534F] text-[#D9534F] shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-2 flex-1">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#D9534F]">
            Audit Request Error
          </h3>
          <p className="text-xs font-mono text-[#171918] break-words">
            {message}
          </p>
          <div className="text-[11px] font-mono text-[#625F57] space-y-1 pt-1">
            <p>Possible causes:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Backend server is offline or unreachable on port 8000.</li>
              <li>Provided URLs failed security checks (private IP, SSRF block, timeout).</li>
              <li>Target sites blocked retrieval (paywall, CAPTCHA, robot policy).</li>
            </ul>
          </div>
          {onRetry && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171918] text-[#F3F0E8] text-xs font-mono uppercase tracking-wider hover:bg-[#202321] transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Try Again</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

