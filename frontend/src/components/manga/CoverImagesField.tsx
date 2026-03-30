import { useState } from 'react';
import { ExternalBlob } from '../../backend';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { X, Upload } from 'lucide-react';

interface CoverImagesFieldProps {
  coverImages: ExternalBlob[];
  onChange: (images: ExternalBlob[]) => void;
}

export function CoverImagesField({ coverImages, onChange }: CoverImagesFieldProps) {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const addImageFromFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
      setUploadProgress(percentage);
    });
    onChange([...coverImages, blob]);
    setUploadProgress(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      addImageFromFile(file);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    onChange(coverImages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label>Cover Images</Label>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative w-[30%]">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="cover-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('cover-upload')?.click()}
              className="w-full gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Image
            </Button>
          </div>
        </div>

        {uploadProgress !== null && (
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Uploading: {uploadProgress}%</div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {coverImages.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {coverImages.map((image, index) => (
            <div key={index} className="relative aspect-[2/3] rounded-md overflow-hidden border border-border group">
              <img
                src={image.getDirectURL()}
                alt={`Cover ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
