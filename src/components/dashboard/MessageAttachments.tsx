import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Paperclip, X, FileText, Image as ImageIcon, Download } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface MessageAttachmentsProps {
  messageId?: string;
  conversationId: string;
  onAttachmentsChange?: (files: File[]) => void;
}

export const MessageAttachments = ({ 
  messageId, 
  conversationId,
  onAttachmentsChange 
}: MessageAttachmentsProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    onAttachmentsChange?.(validFiles);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      onAttachmentsChange?.(newFiles);
      return newFiles;
    });
  };

  const uploadAttachments = async () => {
    if (!messageId || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${conversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('message-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Create attachment record
        const { error: dbError } = await supabase
          .from('message_attachments')
          .insert({
            message_id: messageId,
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            mime_type: file.type,
          });

        if (dbError) throw dbError;
      }

      toast.success("Attachments uploaded successfully");
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error uploading attachments:", error);
      toast.error("Failed to upload attachments");
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Paperclip className="h-4 w-4" />
          Attach Files
        </Button>
        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        {selectedFiles.length > 0 && (
          <Badge variant="secondary">
            {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
          </Badge>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded bg-muted/50"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getFileIcon(file.type)}
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {messageId && (
            <Button
              type="button"
              size="sm"
              onClick={uploadAttachments}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Attachments"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

interface AttachmentDisplayProps {
  messageId: string;
}

export const AttachmentDisplay = ({ messageId }: AttachmentDisplayProps) => {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    const fetchAttachments = async () => {
      const { data, error } = await supabase
        .from('message_attachments')
        .select('*')
        .eq('message_id', messageId);

      if (!error && data) {
        setAttachments(data);
      }
      setLoading(false);
    };

    fetchAttachments();
  });

  const downloadAttachment = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('message-attachments')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast.error("Failed to download attachment");
    }
  };

  if (loading || attachments.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {attachments.map((attachment) => {
        const isImage = attachment.mime_type.startsWith('image/');
        const publicUrl = attachment.file_path.startsWith('http') 
          ? attachment.file_path 
          : supabase.storage.from('message-attachments').getPublicUrl(attachment.file_path).data.publicUrl;

        return (
          <div
            key={attachment.id}
            className="group relative flex flex-col gap-2 p-2 border rounded-lg text-sm bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            {isImage ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black/5">
                <img 
                  src={publicUrl} 
                  alt={attachment.file_name}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="flex-1 truncate">{attachment.file_name}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              {!isImage && <span className="text-xs text-muted-foreground">{attachment.file_name}</span>}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 ml-auto"
                onClick={() => downloadAttachment(attachment.file_path, attachment.file_name)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
