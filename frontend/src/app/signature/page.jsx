'use client';
import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { UploadCloud, Check, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Canvas is empty')); return; }
      resolve(blob);
    }, 'image/png');
  });
};

export default function SignaturePage() {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch current faculty profile to check if signature exists
  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    },
  });

  const hasSignature = me?.signature_path;
  // Build public URL for existing signature
  const signatureUrl = hasSignature
    ? `${API_BASE}/${me.signature_path.replace(/\\/g, '/')}`
    : null;

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result));
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const formData = new FormData();
      formData.append('file', blob, 'signature.png');
      await api.post('/auth/faculty/signature', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(hasSignature ? 'Signature replaced successfully!' : 'Signature uploaded successfully!');
      setImageSrc(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Refresh /me so new signature shows immediately
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (err) {
      toast.error('Upload failed. Please try again.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const cancelCrop = () => {
    setImageSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isLoading) return <p className="text-sm text-gray-400">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">E-Signature</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your signature is automatically embedded in all certificates you generate.
        </p>
      </div>

      {/* Existing signature preview */}
      {hasSignature && !imageSrc && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                <Check size={12} /> Signature on file
              </span>
            </div>
            <label
              htmlFor="sig-upload"
              className="cursor-pointer flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <RefreshCw size={14} /> Replace
            </label>
          </div>
          {/* Show the actual stored signature */}
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-center h-28 px-6">
            <img
              src={`${signatureUrl}?t=${Date.now()}`}
              alt="Your e-signature"
              className="max-h-24 max-w-full object-contain mix-blend-multiply"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            This is what appears on all generated certificates. Click <strong>Replace</strong> to upload a new one.
          </p>
        </div>
      )}

      {/* Upload trigger (shown when no signature) */}
      {!hasSignature && !imageSrc && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-dashed border-gray-200 text-center">
          <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5">
            <UploadCloud size={36} className="text-indigo-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">No signature uploaded yet</h3>
          <p className="text-sm text-gray-400 mb-6">Upload your signature so it appears on certificates.</p>
          <label
            htmlFor="sig-upload"
            className="cursor-pointer inline-flex items-center gap-2 px-7 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-all"
          >
            <UploadCloud size={16} /> Browse & Upload
          </label>
        </div>
      )}

      {/* Hidden file input (shared) */}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} className="hidden" id="sig-upload" />

      {/* Crop UI */}
      {imageSrc && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-base font-bold text-gray-900 mb-2">Crop Your Signature</h3>
          <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg mb-4">
            Drag to position, zoom to frame tightly. A clean crop = clean certificate.
          </p>
          <div className="relative h-80 w-full bg-slate-900 rounded-xl overflow-hidden mb-5">
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
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Zoom</label>
            <input
              type="range" value={zoom} min={1} max={3} step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={cancelCrop}
              disabled={isUploading}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Saving...' : hasSignature ? 'Replace Signature' : 'Save Signature'}
              {!isUploading && <Check size={15} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
