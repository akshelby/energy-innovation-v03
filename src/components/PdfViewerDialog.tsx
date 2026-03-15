import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface PdfViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
}

export default function PdfViewerDialog({ open, onOpenChange, src }: PdfViewerDialogProps) {
  const embeddedPdfUrl = src ? `${src}#toolbar=1&navpanes=0&view=FitH` : "";
  const googleViewerUrl = src
    ? `https://docs.google.com/gview?url=${encodeURIComponent(src)}&embedded=true`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden [&>button]:top-3 [&>button]:right-3 [&>button]:z-20 [&>button]:bg-background [&>button]:rounded-full [&>button]:border [&>button]:border-border [&>button]:p-1.5 [&>button]:shadow-sm">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
            <span className="text-sm font-medium text-foreground">PDF Document</span>
            <Button variant="outline" size="sm" asChild className="mr-8">
              <a href={src} download target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-1.5" />
                Download
              </a>
            </Button>
          </div>
          {src && (
            <object data={embeddedPdfUrl} type="application/pdf" className="w-full flex-1">
              <iframe src={googleViewerUrl} className="w-full h-full border-0" title="PDF Viewer" />
            </object>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
