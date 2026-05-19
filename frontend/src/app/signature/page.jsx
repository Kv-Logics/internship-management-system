'use client';
import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { UploadCloud, Check, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (!file) {
        reject(new Error('Canvas is empty'));
        return;
      }
      file.name = 'signature_crop.png';
      resolve(file);
    }, 'image/png');
  });
};

export default function SignaturePage() {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  
  const fileInputRef = useRef(null);

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      let imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
    }
  };

  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      const formData = new FormData();
      formData.append('file', croppedImageBlob, 'signature.png');

      const response = await api.post('/auth/faculty/signature', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Signature uploaded successfully!');
      
      // Show preview
      const previewUrl = URL.createObjectURL(croppedImageBlob);
      setUploadedPreview(previewUrl);
      
      // Reset cropping UI
      setImageSrc(null);
    } catch (error) {
      toast.error('Failed to upload signature. Please try again.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const cancelCrop = () => {
    setImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Upload E-Signature</h1>
        <p className="mt-2 text-sm text-gray-600">
          Upload a clear image of your signature. Use the crop tool to tightly frame the signature so it sits perfectly above the mentor line in generated certificates. A rectangular crop is recommended.
        </p>
      </div>

      {!imageSrc ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
          <div className="mx-auto w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <UploadCloud size={40} className="text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Select a Signature Image</h3>
          <p className="text-gray-500 mb-8">PNG or JPG formats supported.</p>
          
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={onFileChange}
            className="hidden"
            id="sig-upload"
          />
          <label
            htmlFor="sig-upload"
            className="cursor-pointer inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all"
          >
            Browse Files
          </label>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Crop Your Signature</h3>
          <p className="text-sm text-amber-600 mb-4 font-medium bg-amber-50 p-3 rounded-lg">
            Drag the image to position it. Use the slider to zoom. Crop it tightly around the ink to avoid awkward white space in the certificate.
          </p>
          
          <div className="relative h-96 w-full bg-slate-900 rounded-xl overflow-hidden mb-6">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={3 / 1} 
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Zoom</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              onClick={cancelCrop}
              disabled={isUploading}
              className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center px-6 py-2.5 bg-indigo-600 rounded-xl text-white font-bold hover:bg-indigo-700 shadow-md transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Crop & Save Signature'}
              {!isUploading && <Check size={18} className="ml-2" />}
            </button>
          </div>
        </div>
      )}

      {uploadedPreview && !imageSrc && (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-col items-center animate-fadeIn">
          <div className="bg-emerald-100 p-2 rounded-full mb-4">
            <Check size={24} className="text-emerald-600" />
          </div>
          <h3 className="text-emerald-800 font-bold mb-4">Signature Saved Successfully!</h3>
          <p className="text-emerald-700 text-sm mb-6 text-center max-w-lg">
            This signature will now be automatically embedded in the bottom-left corner of any certificates you generate for your interns.
          </p>
          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm w-72 h-24 flex items-center justify-center">
            <img src={uploadedPreview} alt="Saved Signature" className="max-w-full max-h-full object-contain mix-blend-multiply" />
          </div>
        </div>
      )}
    </div>
  );
}
