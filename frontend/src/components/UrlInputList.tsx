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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-medium text-[#171918] uppercase tracking-wider">
          Source URLs to Review (Public Web)
        </label>
        <span className="text-xs font-mono text-[#625F57]">
          {urls.length}/10 sources
        </span>
      </div>

      <div className="space-y-2">
        {urls.map((url, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-7 text-xs font-mono text-[#625F57] text-right shrink-0">
              S{idx + 1}
            </span>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#625F57]">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(idx, e.target.value)}
                placeholder="https://example.org/article-or-report"
                disabled={disabled}
                className="w-full pl-9 pr-3 py-2 bg-white text-xs font-mono border border-[#D7D2C7] text-[#171918] placeholder-[#A6ADA6] focus:outline-none focus:border-[#171918] focus:ring-1 focus:ring-[#171918] disabled:bg-[#EAE5DA]"
                required
              />
            </div>
            {urls.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveUrl(idx)}
                disabled={disabled}
                className="p-2 border border-[#D7D2C7] bg-[#EAE5DA] text-[#625F57] hover:text-[#D9534F] hover:border-[#D9534F] focus:outline-none disabled:opacity-50"
                title="Remove source row"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {urls.length < 10 && (
        <button
          type="button"
          onClick={handleAddUrl}
          disabled={disabled}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-[#D7D2C7] bg-transparent text-xs font-mono text-[#625F57] hover:border-[#171918] hover:text-[#171918] focus:outline-none disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add another source URL</span>
        </button>
      )}
    </div>
  );
};

