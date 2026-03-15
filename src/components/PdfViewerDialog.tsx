import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PdfViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
}

export default function PdfViewerDialog({ open, onOpenChange, src }: PdfViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden">
        {src && (
          <iframe
            src={src}
            className="w-full h-full border-0"
            title="PDF Viewer"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
