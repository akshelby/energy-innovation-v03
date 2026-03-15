import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface PdfViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
}

export default function PdfViewerDialog({ open, onOpenChange, src }: PdfViewerDialogProps) {
  // Use Google Docs viewer for reliable cross-origin PDF rendering
  const viewerUrl = src
    ? `https://docs.google.com/gview?url=${encodeURIComponent(src)}&embedded=true`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-end p-2 border-b border-border bg-muted/30">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-full"
            >
              <a href={src} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-1" />
                Download
              </a>
            </Button>
          </div>
          {src && (
            <iframe
              src={viewerUrl}
              className="w-full flex-1 border-0"
              title="PDF Viewer"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
