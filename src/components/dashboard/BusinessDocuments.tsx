import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Loader2, CheckCircle2, AlertCircle, Eye, Brain } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BusinessDocumentsProps {
  businessId: string;
}

export const BusinessDocuments = ({ businessId }: BusinessDocumentsProps) => {
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: docChunks, isLoading: loadingChunks } = useQuery({
    queryKey: ["document-chunks", selectedDoc?.id],
    queryFn: async () => {
      if (!selectedDoc) return [];
      const { data, error } = await supabase
        .from("knowledge_chunks")
        .select("content")
        .eq("source_id", selectedDoc.id)
        .eq("source_type", "document")
        .order("chunk_index", { ascending: true });
        
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDoc,
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ["business-documents", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_documents")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const doc = documents?.find(d => d.id === docId);
      if (!doc) throw new Error("Document not found");

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("business-documents")
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("business_documents")
        .delete()
        .eq("id", docId);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-documents", businessId] });
      toast({
        title: "Document deleted",
        description: "The document has been removed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 20MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/json'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, Word, text, markdown, and JSON files are supported",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload to storage
      const filePath = `${businessId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("business-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data: newDoc, error: dbError } = await supabase
        .from("business_documents")
        .insert({
          business_id: businessId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          status: "processing",
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Process the document
      const { error: processError } = await supabase.functions.invoke("process-document", {
        body: { documentId: newDoc.id },
      });

      if (processError) {
        console.error("Document processing error:", processError);
      }

      queryClient.invalidateQueries({ queryKey: ["business-documents", businessId] });

      toast({
        title: "Document uploaded",
        description: "Your document is being processed...",
      });

      // Reset input
      event.target.value = "";
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Ready</Badge>;
      case "processing":
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Processing</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Knowledge Base</CardTitle>
        <CardDescription>
          Upload documents about your business for the AI to learn from. Supports PDF, Word, text, markdown, and JSON files (max 20MB).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md,.json"
            onChange={handleFileUpload}
            disabled={uploading}
            className="flex-1"
          />
          <Button disabled={uploading} variant="outline">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>

        {documents && documents.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Uploaded Documents ({documents.length})</h3>
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.file_name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{doc.file_size ? formatFileSize(doc.file_size) : "Unknown size"}</span>
                      <span>•</span>
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                    {doc.summary && (
                      <p className="text-sm text-muted-foreground mt-1">{doc.summary}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(doc.status)}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedDoc(doc)}
                    title="View Extracted Knowledge"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(doc.id)}
                    disabled={deleteMutation.isPending}
                    title="Delete Document"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No documents uploaded yet</p>
            <p className="text-sm">Upload documents to help the AI understand your business better</p>
          </div>
        )}
      </CardContent>

      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Knowledge Verification
            </DialogTitle>
            <DialogDescription>
              This is exactly how the AI understands "{selectedDoc?.file_name}"
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4 -mr-4 mt-2">
            <div className="space-y-6">
              {selectedDoc?.summary && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-primary">Master Summary</h3>
                  <div className="p-4 bg-muted/50 rounded-lg border text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedDoc.summary}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Extracted Text Chunks</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  The document was broken down into these exact chunks for the AI to retrieve during conversations.
                </p>
                {loadingChunks ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : docChunks && docChunks.length > 0 ? (
                  <div className="grid gap-3">
                    {docChunks.map((chunk: any, i: number) => (
                      <div key={i} className="p-3 bg-card border rounded-md text-sm whitespace-pre-wrap">
                        <Badge variant="outline" className="mb-2">Chunk {i + 1}</Badge>
                        <div className="text-card-foreground/90">{chunk.content}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                    <p>No extracted text found.</p>
                    <p className="text-xs mt-1">If the document is still processing, please check back later.</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
