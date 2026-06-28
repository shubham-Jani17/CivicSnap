import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  Camera,
  Sparkles,
  MapPin,
  Check,
  AlertCircle,
  FileText,
  RefreshCw,
  Award,
  ChevronRight,
  Shield,
  Clock
} from "lucide-react";

export const CreateReportPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Step state: 1 = upload/location, 2 = AI analysis in progress, 3 = edit/review AI draft
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File & Camera state
  const [dragActive, setDragActive] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [cameraActive, setCameraActive] = useState(false);
  
  // Geolocation & Location input
  const [locationName, setLocationName] = useState("");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number }>({
    latitude: 37.7749,
    longitude: -122.4194, // Default SF
  });
  const [fetchingGeo, setFetchingGeo] = useState(false);

  // Gemini Triage results to edit
  const [triageTitle, setTriageTitle] = useState("");
  const [triageDescription, setTriageDescription] = useState("");
  const [triageCategory, setTriageCategory] = useState("ROAD_HAZARD");
  const [triageSeverity, setTriageSeverity] = useState("MEDIUM");
  const [triageAuthority, setTriageAuthority] = useState("");
  const [triageSummary, setTriageSummary] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const fetchAddress = async (lat: number, lon: number) => {
    setFetchingGeo(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
        {
          headers: {
            "Accept-Language": "en"
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          const addressParts = data.display_name.split(",");
          // Join the first 4 specific parts (e.g., building, street, neighborhood, city)
          const mainAddress = addressParts.slice(0, 4).join(",").trim();
          setLocationName(mainAddress || data.display_name);
        } else {
          setLocationName(`Sector Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        }
      } else {
        setLocationName(`Sector Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      }
    } catch (err) {
      console.warn("Reverse address lookup failed:", err);
      setLocationName(`Sector Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    } finally {
      setFetchingGeo(false);
    }
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      setFetchingGeo(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setCoordinates({ latitude: lat, longitude: lon });
          await fetchAddress(lat, lon);
        },
        (err) => {
          console.warn("Geolocation failed:", err);
          setError("Failed to acquire GPS signal. Please type your address manually.");
          setFetchingGeo(false);
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      setError("Browser geolocation is not supported on this device.");
    }
  };

  // Fetch location automatically on mount
  useEffect(() => {
    detectLocation();
  }, []);

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      } else {
        setError("Please select a valid photographic image asset.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Camera capture triggers
  const startCamera = async () => {
    setError(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Camera hardware access denied/not supported in preview:", err);
      setError("Unable to initialize camera stream. Please use file selection instead.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "captured-incident.jpg", { type: "image/jpeg" });
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            stopCamera();
          }
        }, "image/jpeg");
      }
    }
  };

  // Submit image to Gemini Vision route
  const handleTriageImage = async () => {
    if (!imageFile) {
      setError("Please snap/select an image of the civic defect first.");
      return;
    }
    if (!locationName) {
      setError("Please provide a descriptive location address.");
      return;
    }

    setError(null);
    setStep(2); // AI analyzing step

    try {
      const response = await apiService.analyzeImageUpload(imageFile, locationName);
      if (response && response.success) {
        const analysis = response.analysis;
        setTriageTitle(analysis.title);
        setTriageDescription(analysis.description);
        setTriageCategory(analysis.category);
        setTriageSeverity(analysis.severity);
        setTriageAuthority(analysis.authority);
        setTriageSummary(analysis.summary);
        setStep(3); // Transition to review step
      } else {
        throw new Error("Invalid structured AI analysis response.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to establish Gemini link. Please retry.");
      setStep(1);
    }
  };

  // Submit complete text report to FastAPI / Firestore
  const handleFinalSubmission = async () => {
    setLoading(true);
    try {
      const payload = {
        title: triageTitle,
        description: triageDescription,
        category: triageCategory,
        severity: triageSeverity,
        authority: triageAuthority,
        summary: triageSummary,
        locationName: locationName,
        coordinates: coordinates,
      };

      const res = await apiService.submitIssue(payload);
      if (res && res.success) {
        await refreshProfile(); // Sync points (+50 XP!)
        navigate("/dashboard");
      } else {
        throw new Error("Unable to save report to FastAPI service.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Submitting report failed.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Visual Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
          Multimodal AI Triage
        </h1>
        <p className="text-xs text-slate-400">
          Our cloud Gemini system automatically indexes safety defects and maps municipal authorities.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Upload or camera capture */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="rounded-3xl bg-slate-900/40 border border-slate-900 p-6 md:p-8 space-y-6 shadow-xl"
          >
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/10 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Camera Viewport panel */}
            {cameraActive ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-slate-800">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={capturePhoto}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 transition"
                  >
                    <Check className="w-4 h-4" />
                    Capture Photo
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-slate-400 border border-slate-800 hover:text-white transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Drag & Drop Visual Box */
              <div className="space-y-4">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-4 relative overflow-hidden h-64 ${
                    dragActive
                      ? "border-teal-500 bg-teal-500/5"
                      : imagePreview
                      ? "border-slate-800 bg-slate-950"
                      : "border-slate-800 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/40"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="absolute inset-0">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-slate-900/90 text-[10px] text-teal-400 font-bold px-3 py-1.5 rounded-full border border-slate-800">
                          Click / Drag to replace image
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 rounded-full bg-slate-950 text-slate-400 border border-slate-850">
                        <Upload className="w-6 h-6 text-sky-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-200">
                          Drag and drop your incident image here, or <span className="text-sky-400">browse</span>
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                          PNG, JPG, JPEG up to 12MB
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Switch to camera trigger */}
                <div className="flex justify-end">
                  <button
                    onClick={startCamera}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-850 transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Take snapshot using camera
                  </button>
                </div>
              </div>
            )}

            {/* Location context field */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center gap-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  Descriptive Location Address
                </label>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={fetchingGeo}
                  className="text-[10px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 bg-sky-500/10 hover:bg-sky-500/20 px-2 py-1 rounded-xl border border-sky-500/10 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${fetchingGeo ? "animate-spin" : ""}`} />
                  {fetchingGeo ? "Detecting..." : "Auto-Detect Location"}
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. 104 Oakwood Lane Boulevard, Sector 7"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-850 focus:border-teal-500/50 rounded-xl py-3 px-4 text-xs text-white placeholder-slate-550 focus:outline-none transition font-sans"
              />
              <p className="text-[9px] text-slate-500 font-mono">
                {fetchingGeo ? "Fetching live coordinates..." : `GPS Coordinates aligned: ${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`}
              </p>
            </div>

            {/* Triage Submit Trigger */}
            <button
              onClick={handleTriageImage}
              disabled={!imageFile || !locationName}
              className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:scale-100 disabled:pointer-events-none transition duration-150"
            >
              <Sparkles className="w-4.5 h-4.5 stroke-[2.5px] text-slate-950" />
              Analyze Hazard with Gemini AI
            </button>
          </motion.div>
        )}

        {/* Step 2: Running Gemini analysis animation spinner */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-3xl bg-slate-900/40 border border-slate-900 p-12 text-center flex flex-col items-center justify-center space-y-6 shadow-xl"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-slate-950 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
              </div>
              <Sparkles className="w-5 h-5 text-sky-400 absolute top-0 right-0 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-lg text-white">Gemini Multimodal Triaging</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Gemini is parsing the incident image, categorizing severity indicators, locating regional departments, and assembling report models.
              </p>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review / Edit AI triage before saving */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-slate-900/40 border border-slate-900 p-6 md:p-8 space-y-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/10">
                  <Check className="w-4.5 h-4.5" />
                </div>
                <h2 className="text-base font-bold text-white">
                  Triage Review & Calibration
                </h2>
              </div>
              <span className="text-[10px] bg-slate-950 border border-slate-850 text-teal-400 px-2.5 py-1 rounded-full font-mono font-bold uppercase">
                AI Output Loaded
              </span>
            </div>

            <div className="space-y-4">
              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350">Triage Report Title</label>
                <input
                  type="text"
                  value={triageTitle}
                  onChange={(e) => setTriageTitle(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 focus:border-teal-500/50 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none transition font-sans"
                />
              </div>

              {/* Category / Severity Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-350">Category</label>
                  <select
                    value={triageCategory}
                    onChange={(e) => setTriageCategory(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-850 focus:border-teal-500/50 rounded-xl py-2.5 px-3 text-xs text-slate-300 focus:outline-none transition cursor-pointer"
                  >
                    <option value="ROAD_HAZARD" className="bg-slate-950">ROAD HAZARD</option>
                    <option value="WASTE_MANAGEMENT" className="bg-slate-950">WASTE MANAGEMENT</option>
                    <option value="INFRASTRUCTURE" className="bg-slate-950">INFRASTRUCTURE</option>
                    <option value="PARK_MAINTENANCE" className="bg-slate-950">PARK MAINTENANCE</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-350">Severity Threat Level</label>
                  <select
                    value={triageSeverity}
                    onChange={(e) => setTriageSeverity(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-850 focus:border-teal-500/50 rounded-xl py-2.5 px-3 text-xs text-slate-300 focus:outline-none transition cursor-pointer"
                  >
                    <option value="LOW" className="bg-slate-950">LOW</option>
                    <option value="MEDIUM" className="bg-slate-950">MEDIUM</option>
                    <option value="HIGH" className="bg-slate-950">HIGH</option>
                    <option value="CRITICAL" className="bg-slate-950">CRITICAL</option>
                  </select>
                </div>
              </div>

              {/* Authority Department */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350">Targeted Municipal Authority</label>
                <input
                  type="text"
                  value={triageAuthority}
                  onChange={(e) => setTriageAuthority(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 focus:border-teal-500/50 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none transition font-sans"
                />
              </div>

              {/* Triage Summary */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350">Brief Objective Summary</label>
                <input
                  type="text"
                  value={triageSummary}
                  onChange={(e) => setTriageSummary(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 focus:border-teal-500/50 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none transition font-sans"
                />
              </div>

              {/* Detailed Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350">Detailed Incident Description</label>
                <textarea
                  rows={4}
                  value={triageDescription}
                  onChange={(e) => setTriageDescription(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 focus:border-teal-500/50 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none transition font-sans resize-none"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-900">
              <button
                onClick={handleFinalSubmission}
                disabled={loading}
                className="flex-grow py-3 rounded-xl font-bold bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-sky-500/10 transition"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-950 border-t-transparent"></div>
                ) : (
                  <>
                    <Award className="w-4.5 h-4.5 text-slate-950 stroke-[2.2px] animate-bounce" />
                    Submit Report & Earn 50 Points
                  </>
                )}
              </button>
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="px-5 py-3 rounded-xl text-xs font-bold bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition"
              >
                Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
