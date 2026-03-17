import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function FileUploader() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:4000/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            return response.json();
        },
        onSuccess: (data) => {
            toast.success(`Processed ${data.filename}`, {
                description: `Added ${data.addedTests} new tests to "${data.assignedFeature}"`
            });
            queryClient.invalidateQueries({ queryKey: ['features'] });
            setIsUploading(false);
        },
        onError: () => {
            toast.error("Failed to upload test file");
            setIsUploading(false);
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.ts') && !file.name.endsWith('.js')) {
            toast.error("Only .ts or .js files are supported");
            return;
        }

        setIsUploading(true);
        uploadMutation.mutate(file);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".ts,.js,.tsx,.jsx"
                onChange={handleFileChange}
            />
            <Button
                variant="default"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
            >
                {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="mr-2 h-4 w-4" />
                )}
                {isUploading ? "Uploading..." : "Upload Tests"}
            </Button>
        </>
    );
}
