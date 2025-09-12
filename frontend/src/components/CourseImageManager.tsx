'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Image as ImageIcon } from 'lucide-react';

interface CourseImage {
  src: string;
  alt: string;
  page?: number;
}

interface CourseImageManagerProps {
  courseId: number;
  page: number;
  onImagesChange: (images: CourseImage[]) => void;
  initialImages?: CourseImage[];
}

export default function CourseImageManager({ 
  courseId, 
  page, 
  onImagesChange, 
  initialImages = [] 
}: CourseImageManagerProps) {
  const [images, setImages] = useState<CourseImage[]>(initialImages);
  const [newImage, setNewImage] = useState({ src: '', alt: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddImage = () => {
    if (newImage.src && newImage.alt) {
      const imageWithPage = { ...newImage, page };
      const updatedImages = [...images, imageWithPage];
      setImages(updatedImages);
      onImagesChange(updatedImages);
      setNewImage({ src: '', alt: '' });
      setShowAddForm(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const handleImageSrcChange = (value: string) => {
    // Auto-generate alt text from filename if not provided
    const filename = value.split('/').pop()?.split('.')[0] || '';
    const generatedAlt = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    setNewImage({
      src: value,
      alt: newImage.alt || generatedAlt
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Course Images - Page {page}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Images */}
        {images.length > 0 && (
          <div className="space-y-2">
            <Label>Current Images:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {images.map((image, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    className="w-12 h-12 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = '/images/placeholder.jpg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{image.alt}</p>
                    <p className="text-xs text-gray-500 truncate">{image.src}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveImage(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Image */}
        {!showAddForm ? (
          <Button 
            onClick={() => setShowAddForm(true)}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Image
          </Button>
        ) : (
          <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
            <div className="space-y-2">
              <Label htmlFor="image-src">Image Path</Label>
              <Input
                id="image-src"
                placeholder="/images/courses/example.jpg"
                value={newImage.src}
                onChange={(e) => handleImageSrcChange(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Use paths like: /images/courses/plant-training.jpg
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image-alt">Alt Text</Label>
              <Input
                id="image-alt"
                placeholder="Descriptive text for the image"
                value={newImage.alt}
                onChange={(e) => setNewImage({ ...newImage, alt: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddImage} size="sm">
                Add Image
              </Button>
              <Button 
                onClick={() => setShowAddForm(false)} 
                variant="outline" 
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Quick Add Suggestions */}
        <div className="space-y-2">
          <Label>Quick Add:</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              '/images/courses/plant-training.jpg',
              '/images/equipment/excavator-training.jpg',
              '/images/courses/H&S.jpg',
              '/images/facilities/training-hall.jpg'
            ].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewImage({ 
                    src: suggestion, 
                    alt: suggestion.split('/').pop()?.split('.')[0] || '' 
                  });
                  setShowAddForm(true);
                }}
                className="text-xs"
              >
                {suggestion.split('/').pop()}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


