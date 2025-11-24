import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X, Reply, FileText, Image, Eye } from 'lucide-react';
import { TypewriterText } from '@/components/TypewriterText';
import { FilePreviewModal } from './FilePreviewModal';
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ayn';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  isTyping?: boolean;
  attachment?: {
    url: string;
    name: string;
    type: string;
  };
}
const getFileIcon = (file: File) => {
  if (file.type.includes('pdf')) return <FileText className="w-3 h-3 text-primary" />;
  if (file.type.includes('image')) return <Image className="w-3 h-3 text-primary" />;
  if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) return <FileText className="w-3 h-3 text-primary" />;
  return <Paperclip className="w-3 h-3 text-primary" />;
};

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled: boolean;
  isUploading: boolean;
  selectedFile: File | null;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
  selectedMode: string;
  isDragOver: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  replyingTo: Message | null;
  onClearReply: () => void;
  placeholderTexts: string[];
  placeholderIndex: number;
  showPlaceholder: boolean;
  isInputFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  language: string;
  direction: 'ltr' | 'rtl';
  messagesLength: number;
  isTyping: boolean;
  showFileTypes: boolean;
  onShowFileTypes: (show: boolean) => void;
  onAttachmentClick: () => void;
  getSendButtonClass: (mode: string) => string;
}
export const ChatInput = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  disabled,
  isUploading,
  selectedFile,
  onFileSelect,
  onFileRemove,
  selectedMode,
  isDragOver,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  replyingTo,
  onClearReply,
  placeholderTexts,
  placeholderIndex,
  showPlaceholder,
  isInputFocused,
  onFocus,
  onBlur,
  fileInputRef,
  inputRef,
  language,
  direction,
  messagesLength,
  isTyping,
  showFileTypes,
  onShowFileTypes,
  onAttachmentClick,
  getSendButtonClass
}: ChatInputProps) => {
  // Create preview URL for all file types
  const [filePreviewUrl, setFilePreviewUrl] = React.useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  
  React.useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setFilePreviewUrl(url);
      
      // Cleanup: revoke object URL when file changes or component unmounts
      return () => {
        URL.revokeObjectURL(url);
        setFilePreviewUrl(null);
      };
    } else {
      setFilePreviewUrl(null);
    }
  }, [selectedFile]);
  
  const isImageFile = selectedFile?.type.startsWith('image/');
  
  const handleFileChipClick = () => {
    if (selectedFile) {
      setIsPreviewOpen(true);
    }
  };
  
  return <div dir="ltr" className={`input-area ${messagesLength > 0 ? 'bottom-position' : 'center-position'}`} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
      {/* Reply indicator */}
      {replyingTo && <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Reply className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Replying to: "{replyingTo.content.substring(0, 50)}{replyingTo.content.length > 50 ? '...' : ''}"
            </span>
          </div>
          <button onClick={onClearReply} className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>}
      
      {/* Note: Full-screen drag overlay now handled by MessageList component */}

      <div className={`input-container ${isDragOver ? 'drag-over' : ''}`}>
        {/* Enhanced Attachment Button with Drag & Drop Hints */}
        {selectedMode.toLowerCase().includes('pdf') || selectedMode.toLowerCase().includes('vision') || selectedMode.toLowerCase().includes('general') || selectedMode.toLowerCase().includes('civil engineering') ? <div className="relative">
            <button className="attachment-button group relative" onClick={onAttachmentClick} onMouseEnter={() => onShowFileTypes(true)} onMouseLeave={() => onShowFileTypes(false)} disabled={disabled || isUploading} title="Attach file or drag & drop anywhere">
              <Paperclip className="w-4 h-4" />
            </button>
            
            {/* Enhanced File Types Tooltip with Drag Hint */}
            {showFileTypes && !isDragOver && <div className="absolute bottom-full left-0 mb-2 bg-popover border border-border rounded-lg shadow-xl p-4 min-w-[260px] z-50 animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Paperclip className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-sm font-semibold text-foreground">Click or drag & drop</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-muted-foreground">Images:</span>
                    <span className="text-foreground font-medium">JPG, PNG, GIF, WebP</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-muted-foreground">Documents:</span>
                    <span className="text-foreground font-medium">PDF, DOC, DOCX</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-muted-foreground">Text:</span>
                    <span className="text-foreground font-medium">TXT files</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-muted-foreground">Data:</span>
                    <span className="text-foreground font-medium">JSON files</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-primary bg-primary/5 rounded-md py-2 px-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Drag files anywhere in chat
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Max size: <strong>10MB</strong></span>
                  </div>
                </div>
              </div>}
          </div> : null}
        
        {/* Hidden File Input */}
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt,.json" onChange={onFileSelect} className="hidden" />
        
        {/* Input Wrapper containing both file chip and textarea */}
        <div className="input-wrapper">
          {/* Inline File Chip */}
          {selectedFile && (
            <div 
              className="file-chip-inline group"
              onClick={handleFileChipClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleFileChipClick();
                }
              }}
            >
              {/* Image Thumbnail or File Icon */}
              <div className="relative">
                {isImageFile && filePreviewUrl ? (
                  <div className="file-thumbnail">
                    <img src={filePreviewUrl} alt={selectedFile.name} className="file-thumbnail-image" />
                    {/* Hover overlay with eye icon */}
                    <div className="file-thumbnail-overlay">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="file-icon">
                    {getFileIcon(selectedFile)}
                  </div>
                )}
              </div>
              <div className="file-info">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onFileRemove();
                }}
                className="remove-button"
                title={language === 'ar' ? 'إزالة الملف' : 'Remove file'}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {/* File Preview Modal */}
          <FilePreviewModal
            open={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            file={selectedFile}
            previewUrl={filePreviewUrl}
          />
          
          {/* Text Input Area */}
          <Textarea ref={inputRef} unstyled={true} className="message-input resize-none min-h-[40px] max-h-[200px] overflow-hidden" value={value} onChange={e => {
            onChange(e.target.value);
            // Auto-resize textarea
            const textarea = e.target as HTMLTextAreaElement;
            textarea.style.height = 'auto';
            const newHeight = Math.min(textarea.scrollHeight, 200);
            textarea.style.height = newHeight + 'px';

            // Show scrollbar only when content exceeds max height
            if (textarea.scrollHeight > 200) {
              textarea.style.overflowY = 'auto';
            } else {
              textarea.style.overflowY = 'hidden';
            }
          }} onKeyPress={onKeyPress} onFocus={onFocus} onBlur={onBlur} placeholder="" disabled={disabled || isUploading} rows={1} />
          
          {/* Typewriter Animation Placeholder */}
          {showPlaceholder && !value.trim() && !isInputFocused && !selectedFile && <div className={`absolute ${direction === 'rtl' ? 'right-[var(--input-left-offset)]' : 'left-[var(--input-left-offset)]'} top-[var(--input-vertical-offset)] pointer-events-none z-10 ${direction === 'rtl' ? 'text-right' : 'text-left'} transition-all duration-300 ease-in-out`}>
              <TypewriterText key={`${selectedMode}-${placeholderIndex}-${language}-${direction}`} text={placeholderTexts[placeholderIndex]} speed={50} className="typewriter-text text-muted-foreground" showCursor={true} />
            </div>}
        </div>
        
        {/* Send Button */}
        <button className={`send-button ${getSendButtonClass(selectedMode)}`} onClick={onSend} disabled={!value.trim() && !selectedFile || disabled || isTyping || isUploading} title="Send message">
          <Send className="w-4 h-4" />
        </button>
      </div>
      
      {/* Character Count */}
      {value.length > 0 && <div className="text-xs text-muted-foreground text-right mt-1 px-2">
          {value.length} characters
        </div>}
    </div>;
};