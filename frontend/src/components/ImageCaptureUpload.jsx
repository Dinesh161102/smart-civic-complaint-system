import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';

export default function ImageCaptureUpload({
  value,
  onChange,
  label = 'Attach Issue Photo / Evidence',
  helperText = 'Upload a photo or capture live using your device camera.',
  required = false
}) {
  const [mode, setMode] = useState('upload'); // 'upload' | 'camera'
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop camera streams
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  // Clean up on unmount or mode change
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Start live camera stream
  const startCamera = async () => {
    setCameraError('');
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by this browser.');
      }

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access or use the Upload Image option.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. Please use the Upload Image option.');
      } else {
        setCameraError(err.message || 'Unable to start camera.');
      }
      setIsStreaming(false);
    }
  };

  const handleModeSwitch = (newMode) => {
    if (newMode === 'camera') {
      setMode('camera');
      startCamera();
    } else {
      stopCameraStream();
      setMode('upload');
      setCameraError('');
    }
  };

  // Capture frame from video canvas
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopCameraStream();
    onChange(dataUrl);
  };

  // Handle file input
  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    stopCameraStream();
    onChange(null);
  };

  return (
    <div className="manual-form-group" style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label className="manual-field-label" style={{ margin: 0 }}>
          {label} {required && <span className="required-star">*</span>}
        </label>
        {value && (
          <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={13} /> Photo Attached
          </span>
        )}
      </div>

      {helperText && (
        <p style={{ fontSize: '12.5px', color: '#64748B', margin: '0 0 10px 0' }}>
          {helperText}
        </p>
      )}

      {/* If Photo already selected / captured: Show Preview */}
      {value ? (
        <div style={{
          position: 'relative',
          borderRadius: '12px',
          border: '1.5px solid #CBD5E1',
          background: '#0F172A',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxHeight: '260px'
        }}>
          <img
            src={value}
            alt="Complaint Evidence"
            style={{
              width: '100%',
              maxHeight: '220px',
              objectFit: 'contain',
              display: 'block'
            }}
          />
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            gap: '8px'
          }}>
            <button
              type="button"
              onClick={() => {
                handleRemove();
                handleModeSwitch('camera');
              }}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backdropFilter: 'blur(4px)'
              }}
            >
              <RefreshCw size={13} /> Retake
            </button>
            <button
              type="button"
              onClick={handleRemove}
              style={{
                background: 'rgba(220, 38, 38, 0.85)',
                color: '#FFFFFF',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backdropFilter: 'blur(4px)'
              }}
              title="Remove photo"
            >
              <X size={14} /> Remove
            </button>
          </div>
        </div>
      ) : (
        /* If No Photo: Show Segmented Options & Input */
        <div style={{
          border: '1.5px solid #E2E8F0',
          borderRadius: '14px',
          background: '#FFFFFF',
          overflow: 'hidden'
        }}>
          {/* Two-Option Mode Selector */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            padding: '4px',
            gap: '6px'
          }}>
            <button
              type="button"
              onClick={() => handleModeSwitch('upload')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'upload' ? '#FFFFFF' : 'transparent',
                color: mode === 'upload' ? '#0F172A' : '#64748B',
                fontWeight: mode === 'upload' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: mode === 'upload' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Upload size={16} color={mode === 'upload' ? '#059669' : '#64748B'} />
              <span>Upload Image</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeSwitch('camera')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'camera' ? '#FFFFFF' : 'transparent',
                color: mode === 'camera' ? '#0F172A' : '#64748B',
                fontWeight: mode === 'camera' ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: mode === 'camera' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Camera size={16} color={mode === 'camera' ? '#059669' : '#64748B'} />
              <span>Use Camera</span>
            </button>
          </div>

          {/* Option 1: Upload Dropzone */}
          {mode === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '24px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? '#F0FDF4' : '#FAFAFA',
                border: dragOver ? '2px dashed #059669' : '2px dashed transparent',
                borderRadius: '0 0 14px 14px',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#ECFDF5',
                color: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px'
              }}>
                <Upload size={22} />
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                Click to browse or drag & drop photo
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Supports JPG, PNG, WebP (Max 10MB)
              </div>
            </div>
          )}

          {/* Option 2: Live Camera Viewfinder */}
          {mode === 'camera' && (
            <div style={{ padding: '16px', background: '#0F172A', borderRadius: '0 0 14px 14px', textAlign: 'center' }}>
              {cameraError ? (
                <div style={{ padding: '20px 16px', color: '#F87171', fontSize: '13px' }}>
                  <AlertCircle size={32} style={{ marginBottom: '8px' }} />
                  <div>{cameraError}</div>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('upload')}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#059669',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Switch to Upload
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{
                    position: 'relative',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: '#000000',
                    maxHeight: '260px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      style={{ width: '100%', maxHeight: '240px', objectFit: 'cover' }}
                    />
                    {isStreaming && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(239, 68, 68, 0.85)',
                        color: '#FFFFFF',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF', animation: 'pulse 1.5s infinite' }} />
                        LIVE CAMERA
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '14px' }}>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      disabled={!isStreaming}
                      style={{
                        padding: '10px 22px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#059669',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: isStreaming ? 'pointer' : 'not-allowed',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 8px rgba(5, 150, 105, 0.4)'
                      }}
                    >
                      <Camera size={16} /> Capture Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('upload')}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'transparent',
                        color: '#94A3B8',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
