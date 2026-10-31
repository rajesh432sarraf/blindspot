import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-[#964734]/20 border border-[#964734] p-6 text-left">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-[#964734] text-white shrink-0">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="space-y-2 flex-1">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            Audit Request Error
          </h3>
          <p className="text-xs sm:text-sm font-mono text-[#AFDDE5] break-words">
            {message}
          </p>
          <div className="text-xs font-mono text-[#AFDDE5]/80 space-y-1 pt-1">
            <p className="text-white font-semibold">Possible causes:</p>
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#964734] hover:bg-[#aa533e] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Audit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
