import React from 'react';
import { Plus, Trash2, Globe } from 'lucide-react';

interface UrlInputListProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

export const UrlInputList: React.FC<UrlInputListProps> = ({ urls, onChange, disabled }) => {
  const handleUrlChange = (index: number, value: string) => {
    const updated = [...urls];
    updated[index] = value;
    onChange(updated);
  };

  const handleAddUrl = () => {
    if (urls.length < 10) {
      onChange([...urls, '']);
    }
  };

  const handleRemoveUrl = (index: number) => {
    if (urls.length > 1) {
      const updated = urls.filter((_, i) => i !== index);
      onChange(updated);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold text-[#AFDDE5] uppercase tracking-wider">
          Source URLs to Review (Public Web)
        </label>
        <span className="text-xs font-mono text-[#0FA4AF] font-bold">
          {urls.length}/10 sources
        </span>
      </div>

      <div className="space-y-2.5">
        {urls.map((url, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="px-2.5 py-2 bg-[#024950] border border-[#0FA4AF]/40 text-[#AFDDE5] text-xs font-mono font-bold shrink-0">
              S{idx + 1}
            </span>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0FA4AF]">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(idx, e.target.value)}
                disabled={disabled}
                placeholder="https://example.gov.in/policy-or-guidelines"
                className="w-full pl-10 pr-3 py-2.5 bg-[#001c1f] text-xs font-mono border border-[#024950] text-[#AFDDE5] placeholder-[#AFDDE5]/40 focus:outline-none focus:border-[#0FA4AF] focus:ring-1 focus:ring-[#0FA4AF] disabled:opacity-50 transition-colors duration-150"
              />
            </div>
            {urls.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveUrl(idx)}
                disabled={disabled}
                className="p-2.5 border border-[#024950] bg-[#001c1f] text-[#AFDDE5]/70 hover:text-white hover:bg-[#964734] hover:border-[#964734] active:scale-95 transition-all duration-150 disabled:opacity-50 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#964734]"
                title="Remove URL"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {urls.length < 10 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-bold border border-[#0FA4AF] bg-[#00272b] text-[#AFDDE5] hover:bg-[#0FA4AF] hover:text-[#001c1f] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0FA4AF]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Source URL</span>
          </button>
        </div>
      )}
    </div>
  );
};
