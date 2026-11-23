import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  UploadCloud,
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  Video,
  X,
  Bookmark,
  Globe2,
  ShieldAlert,
  Languages,
} from 'lucide-react';
import type { RecognitionResult, ProduceItem } from '../types/produce.ts';
import { api } from '../services/api.ts';
import {
  calculateResizedDimensions,
  compressImageForUpload,
} from '../utils/imageCompression.ts';

interface AiScannerProps {
  onSelectProduce: (item: ProduceItem) => void;
  onSaveHistory: (result: RecognitionResult) => void;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  onBookmarkSaved?: () => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const AiScanner: React.FC<AiScannerProps> = ({
  onSelectProduce,
  onSaveHistory,
  isAuthenticated,
  onRequireAuth,
  onBookmarkSaved,
  onNotify,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bookmarking states
  const [bookmarkNote, setBookmarkNote] = useState('');
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [bookmarkSavedMsg, setBookmarkSavedMsg] = useState<string | null>(null);

  // Live Camera Stream states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setError('Camera access could not be initialized. Please upload an image file instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const rawW = videoRef.current.videoWidth || 640;
    const rawH = videoRef.current.videoHeight || 480;
    const { width, height } = calculateResizedDimensions(rawW, rawH, 1024);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopCamera();
      handleImageSelect(dataUrl, 'image/jpeg');
    }
  };

  const processSelectedFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    setError(null);
    setBookmarkSavedMsg(null);
    setBookmarkNote('');
    setResult(null);
    setIsScanning(true);
    setScanStep('Optimizing image size (max 1024px JPEG) before AI recognition...');

    try {
      const compressed = await compressImageForUpload(file, 1024, 0.85);
      await handleImageSelect(compressed.dataUrl, 'image/jpeg', compressed.file);
    } catch (err: any) {
      setIsScanning(false);
      setScanStep('');
      setError(err?.message || 'Unable to process uploaded image.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void processSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processSelectedFile(file);
    }
  };

  const buildRecognitionResult = (data: Awaited<ReturnType<typeof api.identifyProduce>>, previewUrl?: string): RecognitionResult => ({
    isProduce: true,
    confidence: data.confidence,
    scanId: data.scanId,
    item: {
      ...data.produceItem,
      imageUrl: data.produceItem.imageUrl || previewUrl || '',
    },
    alternativeMatches: [],
    similarProduce: [],
    unclearWarning: null,
    recognizedAt: data.recognizedAt,
    queryImage: previewUrl,
  });

  const handleImageSelect = async (base64Url: string, mimeType: string = 'image/jpeg', file?: File) => {
    setError(null);
    setBookmarkSavedMsg(null);
    setBookmarkNote('');
    setSelectedImage(base64Url);
    setResult(null);
    setIsScanning(true);
    setScanStep('Sending image to Gemini Vision & nutritional engine...');

    try {
      const t1 = setTimeout(() => setScanStep('Detecting botanical morphology & origin traits...'), 600);
      const t2 = setTimeout(() => setScanStep('Retrieving USDA FoodData Central & clinical precautions...'), 1200);

      const identified = await api.identifyProduce({
        file,
        imageBase64: file ? undefined : base64Url,
        mimeType,
        language,
      });

      clearTimeout(t1);
      clearTimeout(t2);

      const recognitionResult = buildRecognitionResult(identified, base64Url);
      setResult(recognitionResult);
      onSaveHistory(recognitionResult);
      onNotify?.(`Identified ${recognitionResult.item.name} (${recognitionResult.confidence}% confidence).`, 'success');
    } catch (err: any) {
      const msg = err.message || 'Recognition service was unable to process image.';
      setError(msg);
      onNotify?.(msg, 'error');
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  const handleBookmarkScan = async () => {
    if (!result?.scanId) return;
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    setError(null);
    setIsBookmarking(true);
    try {
      await api.saveBookmark(result.scanId, bookmarkNote.trim());
      setBookmarkSavedMsg('Saved to your Saved Bookmarks!');
      onNotify?.(`Bookmarked ${result.item.name} to your Saved tab.`, 'success');
      if (onBookmarkSaved) onBookmarkSaved();
    } catch (err: any) {
      const msg = err?.message || 'Failed to save bookmark.';
      setError(msg);
      onNotify?.(msg, 'error');
    } finally {
      setIsBookmarking(false);
    }
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    setBookmarkSavedMsg(null);
    setBookmarkNote('');
    stopCamera();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Multimodal AI Vision
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-50 tracking-tight">
          AI Fruit & Vegetable Recognition
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Capture or upload any produce photo. Our AI engine identifies the botanical specimen, logs the scan, cross-references USDA FoodData Central nutrition, and flags clinical precautions for diabetes and kidney health.
        </p>

        {/* Output Language Preference */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Languages className="w-3.5 h-3.5 text-orange-400" /> Report Language:
          </span>
          <div className="inline-flex bg-slate-900/90 border border-white/10 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg transition-all ${
                language === 'en'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-slate-50'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ur')}
              className={`px-3 py-1 rounded-lg transition-all font-serif ${
                language === 'ur'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-slate-50'
              }`}
            >
              اردو + English
            </button>
          </div>
        </div>
      </div>

      {/* Main Upload / Camera / Scanner Surface */}
      <div className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {error && (
          <div className="p-4 bg-rose-950/60 border-b border-rose-500/30 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-300 hover:text-rose-100 font-bold"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isCameraActive ? (
          <div className="relative bg-slate-950 p-4 flex flex-col items-center justify-center min-h-[360px] sm:min-h-[440px]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-[440px] object-contain rounded-2xl border border-white/10"
            />
            <div className="absolute bottom-6 flex items-center gap-4">
              <button
                onClick={capturePhotoFromCamera}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-extrabold text-sm rounded-full shadow-lg shadow-orange-500/30 flex items-center gap-2 transition-transform active:scale-95"
              >
                <Camera className="w-5 h-5" /> Take Photo
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-3 bg-slate-900/90 border border-white/15 hover:bg-slate-800 text-slate-200 text-sm font-semibold rounded-full"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : !selectedImage ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="relative overflow-hidden p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 border-2 border-dashed border-white/15 rounded-3xl m-4 bg-slate-950/55 hover:bg-orange-500/5 hover:border-orange-400/50 transition-all cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            {/* Corner reticle brackets */}
            <span className="pointer-events-none absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-orange-400/50 rounded-tl-md" />
            <span className="pointer-events-none absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-orange-400/50 rounded-tr-md" />
            <span className="pointer-events-none absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-lime-400/50 rounded-bl-md" />
            <span className="pointer-events-none absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-lime-400/50 rounded-br-md" />

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/10 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <p className="text-base font-bold text-slate-100">
                Drag and drop your produce photo here, or{' '}
                <span className="text-orange-400 underline decoration-orange-400/60 underline-offset-4">browse</span>
              </p>
              <p className="text-xs text-slate-400">
                Supports JPG, PNG, WEBP (Clear, well-lit photos give highest confidence)
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all"
              >
                <UploadCloud className="w-4 h-4" /> Upload File
              </button>
              <button
                onClick={startCamera}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-lime-400/40 text-slate-100 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all"
              >
                <Video className="w-4 h-4 text-lime-400" /> Live Camera
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative w-full sm:w-64 h-64 rounded-2xl overflow-hidden bg-slate-950 border border-orange-500/35 shrink-0 shadow-lg shadow-orange-500/10">
                <img
                  src={selectedImage}
                  alt="Scanned produce preview"
                  className="w-full h-full object-cover"
                />

                {isScanning && (
                  <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-slate-50 p-4 text-center">
                    <div className="w-12 h-12 border-3 border-orange-400 border-t-transparent rounded-full animate-spin mb-3" />
                    <span className="text-xs font-semibold text-amber-200 animate-pulse">
                      {scanStep}
                    </span>
                    <div className="animate-scan-laser absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_16px_rgba(249,115,22,0.9)]" />
                  </div>
                )}

                <button
                  onClick={resetScanner}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 border border-white/15 text-slate-100 hover:bg-slate-900 hover:border-orange-400/50 transition-all text-xs"
                  title="Scan another photo"
                  aria-label="Scan another item"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 w-full space-y-4">
                {isScanning ? (
                  <div className="space-y-3 py-6">
                    <div className="h-6 bg-slate-800 rounded-md w-3/4 animate-pulse" />
                    <div className="h-4 bg-slate-800/70 rounded-md w-1/2 animate-pulse" />
                    <div className="h-16 bg-slate-950/60 rounded-xl border border-white/10 p-3 animate-pulse" />
                    <p className="text-xs text-slate-400 italic">
                      Evaluating botanical traits, color pigmentation, rind geometry and nutritional database...
                    </p>
                  </div>
                ) : result ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tabular-nums bg-lime-500/15 text-lime-300 border border-lime-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
                          {result.confidence}% Confidence
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 uppercase font-semibold">
                          {result.item.category}
                        </span>
                      </div>

                      <span className="text-[11px] font-mono tabular-nums text-slate-400">
                        Scan #{result.scanId ?? '—'} · Saved to History
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-50 flex flex-wrap items-center gap-2.5">
                        {result.item.name}
                        {result.item.urduName && result.item.urduName !== result.item.name && (
                          <span className="text-xl sm:text-2xl font-serif text-amber-300 font-normal">
                            {result.item.urduName}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 italic font-serif">
                        {result.item.scientificName} · Family: {result.item.family}
                      </p>
                    </div>

                    {/* Origin & Growing Regions */}
                    <div className="p-3 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-slate-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-100">
                        <Globe2 className="w-3.5 h-3.5 text-orange-400" /> Origin & Cultivation
                      </div>
                      <p>
                        <strong className="text-slate-200">Origin:</strong> {result.item.origin}
                      </p>
                      <p>
                        <strong className="text-slate-200">Major Regions:</strong> {result.item.cultivationRegions.join(', ')}
                      </p>
                    </div>

                    {/* Nutrition & Clinical Snapshot */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1">
                      <div className="p-2.5 bg-slate-950/65 border border-white/10 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 font-medium block">Energy</span>
                        <span className="font-bold font-mono tabular-nums text-slate-50 text-sm">
                          {result.item.nutritionPer100g.calories} kcal
                        </span>
                        <span className="text-[10px] text-slate-500 block">per 100g</span>
                      </div>
                      <div className="p-2.5 bg-slate-950/65 border border-white/10 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 font-medium block">Fiber / Carbs</span>
                        <span className="font-bold font-mono tabular-nums text-slate-50 text-sm">
                          {result.item.nutritionPer100g.fiberG}g / {result.item.nutritionPer100g.carbsG}g
                        </span>
                        <span className="text-[10px] text-slate-500 block">per 100g</span>
                      </div>
                      <div className="p-2.5 bg-slate-950/65 border border-lime-500/25 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 font-medium block">Glycemic Index</span>
                        <span className="font-bold font-mono tabular-nums text-lime-400 text-sm">
                          GI {result.item.precautions.diabetes.glycemicIndex}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {result.item.precautions.diabetes.category}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-950/65 border border-white/10 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 font-medium block">Potassium</span>
                        <span className="font-bold font-mono tabular-nums text-orange-300 text-sm">
                          {result.item.nutritionPer100g.potassium_mg} mg
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {result.item.precautions.kidneyDisease.potassiumTier.split(' ')[0]}
                        </span>
                      </div>
                    </div>

                    {/* Benefits & Precautions Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-lime-950/35 border border-lime-500/25 rounded-xl text-slate-200 space-y-1">
                        <strong className="font-bold flex items-center gap-1.5 text-lime-300">
                          <Sparkles className="w-3.5 h-3.5" /> Health Benefits
                        </strong>
                        <p className="leading-relaxed text-slate-300">
                          {result.item.healthBenefits[0]?.title}: {result.item.healthBenefits[0]?.description}
                        </p>
                      </div>

                      <div className="p-3 bg-amber-950/35 border border-amber-500/25 rounded-xl text-slate-200 space-y-1">
                        <strong className="font-bold flex items-center gap-1.5 text-amber-300">
                          <ShieldAlert className="w-3.5 h-3.5" /> Clinical Precautions
                        </strong>
                        <p className="leading-relaxed text-slate-300">
                          <strong className="text-amber-200">Diabetes ({result.item.precautions.diabetes.suitability}):</strong>{' '}
                          {result.item.precautions.diabetes.advice}
                        </p>
                      </div>
                    </div>

                    {/* Bookmark / Save to Account Box */}
                    <div className="p-3 bg-slate-950/60 border border-white/10 rounded-xl space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={bookmarkNote}
                          onChange={(e) => setBookmarkNote(e.target.value)}
                          placeholder="Add an optional personal health note before bookmarking..."
                          className="flex-1 px-3 py-2 bg-slate-900/90 border border-white/15 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-400/60 focus:ring-2 focus:ring-orange-500/20"
                        />
                        <button
                          type="button"
                          disabled={isBookmarking}
                          onClick={handleBookmarkScan}
                          className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/15 disabled:opacity-60 text-slate-100 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-orange-400" />
                          {isAuthenticated ? 'Bookmark Result' : 'Sign In to Bookmark'}
                        </button>
                      </div>
                      {bookmarkSavedMsg && (
                        <p className="text-xs font-semibold text-lime-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {bookmarkSavedMsg}
                        </p>
                      )}
                    </div>

                    {/* CTA: Open Full Nutrition & Clinical Profile */}
                    <div className="pt-1 flex flex-wrap gap-3">
                      <button
                        onClick={() => onSelectProduce(result.item)}
                        className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all"
                      >
                        Explore Complete Profile & Precautions <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={resetScanner}
                        className="px-4 py-2.5 border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 font-semibold text-xs rounded-xl transition-all"
                      >
                        Scan Another Photo
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
