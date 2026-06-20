import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

import { WebGLProcessor } from '../lib/webgl';

interface HandTrackerProps {
  hardwareAcceleration?: boolean;
  bgExposure?: number;
  confidence?: number;
  effectColor?: string;
  showLandmarks?: boolean;
  showMask?: boolean;
  posterizeLevels?: number;
  dotSize?: number;
  glowIntensity?: number;
  showScanlines?: boolean;
  effectStyle?: 'halftone' | 'xray' | 'led' | 'dither';
  xrayColors?: [string, string, string, string];
  motionBlur?: number;
  bloomIntensity?: number;
  chromaticAberration?: number;
  filmGrain?: number;
  
  // R2 props
  r2Color?: string;
  r2ShowMask?: boolean;
  r2PosterizeLevels?: number;
  r2DotSize?: number;
  r2GlowIntensity?: number;
  r2ShowScanlines?: boolean;
  r2EffectStyle?: 'halftone' | 'xray' | 'led';
  r2XrayColors?: [string, string, string, string];
  r2MotionBlur?: number;
  r2BloomIntensity?: number;
  r2ChromaticAberration?: number;
  r2FilmGrain?: number;
}

export default function HandTracker({
  hardwareAcceleration = true,
  bgExposure = 100,
  confidence = 0.5,
  effectColor = '#00FFCC',
  showLandmarks = true,
  showMask = true,
  posterizeLevels = 6,
  dotSize = 6,
  glowIntensity = 15,
  showScanlines = true,
  effectStyle = 'halftone',
  xrayColors = ['#000000', '#002244', '#0088cc', '#ffffff'],
  motionBlur = 0,
  bloomIntensity = 0,
  chromaticAberration = 0,
  filmGrain = 10,
  r2Color = '#FF0000',
  r2ShowMask = true,
  r2PosterizeLevels = 6,
  r2DotSize = 6,
  r2GlowIntensity = 15,
  r2ShowScanlines = true,
  r2EffectStyle = 'xray',
  r2XrayColors = ['#000000', '#220000', '#ff0000', '#ffffff'],
  r2MotionBlur = 0,
  r2BloomIntensity = 0,
  r2ChromaticAberration = 0,
  r2FilmGrain = 10,
}: HandTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const effectCanvasRef = useRef<HTMLCanvasElement>(null);
  const feedCanvasRef = useRef<HTMLCanvasElement>(null);
  const scanlineCanvasRef = useRef<HTMLCanvasElement>(null);
  const blurCanvasR1Ref = useRef<HTMLCanvasElement>(null);
  const blurCanvasR2Ref = useRef<HTMLCanvasElement>(null);
  const scanlinePatternRef = useRef<CanvasPattern | null>(null);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);
  const webglRef = useRef<WebGLProcessor | null>(null);
  const outPixelsRef = useRef<Uint8ClampedArray | null>(null);
  const powLUTRef = useRef<Float32Array | null>(null);
  const smoothedCoordsRef = useRef<{[key: string]: {x: number, y: number} | null}>({});
  
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [status, setStatus] = useState<string>('Loading model...');
  const [fps, setFps] = useState<number>(0);
  const [latency, setLatency] = useState<number>(0);
  
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const dashOffsetRef = useRef(0);
  const wasOpenRef = useRef(false);

  const effectColorRef = useRef(effectColor);
  const showLandmarksRef = useRef(showLandmarks);
  const showMaskRef = useRef(showMask);
  const posterizeLevelsRef = useRef(posterizeLevels);
  const dotSizeRef = useRef(dotSize);
  const glowIntensityRef = useRef(glowIntensity);
  const showScanlinesRef = useRef(showScanlines);
  const effectStyleRef = useRef(effectStyle);
  const xrayColorsRef = useRef(xrayColors);
  const bgExposureRef = useRef(bgExposure);
  const motionBlurRef = useRef(motionBlur);
  const bloomIntensityRef = useRef(bloomIntensity);
  const chromaticAberrationRef = useRef(chromaticAberration);
  const filmGrainRef = useRef(filmGrain);

  const r2ColorRef = useRef(r2Color);
  const r2ShowMaskRef = useRef(r2ShowMask);
  const r2PosterizeLevelsRef = useRef(r2PosterizeLevels);
  const r2DotSizeRef = useRef(r2DotSize);
  const r2GlowIntensityRef = useRef(r2GlowIntensity);
  const r2ShowScanlinesRef = useRef(r2ShowScanlines);
  const r2EffectStyleRef = useRef(r2EffectStyle);
  const r2XrayColorsRef = useRef(r2XrayColors);
  const r2MotionBlurRef = useRef(r2MotionBlur);
  const r2BloomIntensityRef = useRef(r2BloomIntensity);
  const r2ChromaticAberrationRef = useRef(r2ChromaticAberration);
  const r2FilmGrainRef = useRef(r2FilmGrain);

  useEffect(() => {
    bgExposureRef.current = bgExposure;
    effectColorRef.current = effectColor;
    showLandmarksRef.current = showLandmarks;
    showMaskRef.current = showMask;
    posterizeLevelsRef.current = posterizeLevels;
    dotSizeRef.current = dotSize;
    glowIntensityRef.current = glowIntensity;
    showScanlinesRef.current = showScanlines;
    effectStyleRef.current = effectStyle;
    xrayColorsRef.current = xrayColors;
    motionBlurRef.current = motionBlur;
    bloomIntensityRef.current = bloomIntensity;
    chromaticAberrationRef.current = chromaticAberration;
    filmGrainRef.current = filmGrain;

    r2ColorRef.current = r2Color;
    r2ShowMaskRef.current = r2ShowMask;
    r2PosterizeLevelsRef.current = r2PosterizeLevels;
    r2DotSizeRef.current = r2DotSize;
    r2GlowIntensityRef.current = r2GlowIntensity;
    r2ShowScanlinesRef.current = r2ShowScanlines;
    r2EffectStyleRef.current = r2EffectStyle;
    r2XrayColorsRef.current = r2XrayColors;
    r2MotionBlurRef.current = r2MotionBlur;
    r2BloomIntensityRef.current = r2BloomIntensity;
    r2ChromaticAberrationRef.current = r2ChromaticAberration;
    r2FilmGrainRef.current = r2FilmGrain;
  }, [
    bgExposure, effectColor, showLandmarks, showMask, posterizeLevels, dotSize, glowIntensity, showScanlines, effectStyle, xrayColors, motionBlur, bloomIntensity, chromaticAberration, filmGrain,
    r2Color, r2ShowMask, r2PosterizeLevels, r2DotSize, r2GlowIntensity, r2ShowScanlines, r2EffectStyle, r2XrayColors, r2MotionBlur, r2BloomIntensity, r2ChromaticAberration, r2FilmGrain
  ]);

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let animationFrameId: number;
    let lastVideoTime = -1;

    // Helper functions for NPR shading
    const hexCache: Record<string, {r:number, g:number, b:number}> = {};
    const hexToRgb = (hex: string) => {
      if (hexCache[hex]) return hexCache[hex];
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      const parsed = result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 255, b: 204 };
      hexCache[hex] = parsed;
      return parsed;
    };

    const initializeHandTracker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );

        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: confidence,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        setIsModelLoaded(true);
        setStatus('Model loaded. Requesting camera access...');
        startCamera();
      } catch (error) {
        console.error('Error initializing models:', error);
        setStatus('Error loading models. Check console for details.');
      }
    };

    const startCamera = async () => {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
        setStatus('');
      } catch (error) {
        console.error('Error accessing camera:', error);
        setStatus('Error accessing camera. Please ensure you have granted camera permissions.');
      }
    };

    const predictWebcam = async () => {
      if (!videoRef.current || !canvasRef.current || !handLandmarker) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');

      if (!canvasCtx) return;

      // Make sure the canvas matches the video dimensions
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
         canvas.width = video.videoWidth;
         canvas.height = video.videoHeight;
      }

      // Initialize an offscreen canvas for the halftone effect
      if (!effectCanvasRef.current) {
         effectCanvasRef.current = document.createElement('canvas');
      }
      const effectCanvas = effectCanvasRef.current;

      if (!scanlinePatternRef.current && canvasCtx) {
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 4;
        pCanvas.height = 4;
        const pCtx = pCanvas.getContext('2d')!;
        pCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        pCtx.fillRect(0, 0, 4, 2);
        scanlinePatternRef.current = canvasCtx.createPattern(pCanvas, 'repeat');
      }

      let startTimeMs = performance.now();
      
      if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        const results = handLandmarker.detectForVideo(video, startTimeMs);

        const currentLatency = performance.now() - startTimeMs;
        
        frameCountRef.current++;
        const now = performance.now();
        if (now - lastFpsTimeRef.current >= 1000) {
          setFps(Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current)));
          setLatency(Math.round(currentLatency));
          frameCountRef.current = 0;
          lastFpsTimeRef.current = now;
        }

        dashOffsetRef.current -= 1; // marching ants

        canvasCtx.save();
        // Clear canvas
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!feedCanvasRef.current) feedCanvasRef.current = document.createElement('canvas');
        if (feedCanvasRef.current.width !== canvas.width || feedCanvasRef.current.height !== canvas.height) {
          feedCanvasRef.current.width = canvas.width;
          feedCanvasRef.current.height = canvas.height;
        }
        const feedCtx = feedCanvasRef.current.getContext('2d')!;

        // Draw the bright video frame mirrored to feedCanvas
        feedCtx.save();
        feedCtx.scale(-1, 1);
        feedCtx.translate(-canvas.width, 0);
        feedCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
        feedCtx.restore();

        // Draw the full frame to the visible canvas
        canvasCtx.drawImage(feedCanvasRef.current, 0, 0);

        if (bgExposureRef.current !== undefined && bgExposureRef.current < 100) {
          canvasCtx.fillStyle = `rgba(0, 0, 0, ${(100 - bgExposureRef.current) / 100})`;
          canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        }

        const processMotionBlur = (blurCanvas: HTMLCanvasElement | null, motionBlurAmt: number) => {
          if (!blurCanvas) return;
          if (blurCanvas.width !== canvas.width || blurCanvas.height !== canvas.height) {
            blurCanvas.width = canvas.width;
            blurCanvas.height = canvas.height;
          }
          if (motionBlurAmt > 0) {
            canvasCtx.drawImage(blurCanvas, 0, 0);
            const bCtx = blurCanvas.getContext('2d')!;
            bCtx.globalCompositeOperation = 'destination-out';
            bCtx.fillStyle = `rgba(0, 0, 0, ${1 - (motionBlurAmt / 100)})`;
            bCtx.fillRect(0, 0, blurCanvas.width, blurCanvas.height);
            bCtx.globalCompositeOperation = 'source-over';
          } else {
            blurCanvas.getContext('2d')!.clearRect(0, 0, blurCanvas.width, blurCanvas.height);
          }
        };

        if (!blurCanvasR1Ref.current) blurCanvasR1Ref.current = document.createElement('canvas');
        if (!blurCanvasR2Ref.current) blurCanvasR2Ref.current = document.createElement('canvas');

        processMotionBlur(blurCanvasR1Ref.current, motionBlurRef.current);
        processMotionBlur(blurCanvasR2Ref.current, r2MotionBlurRef.current);

        if (results.landmarks && results.landmarks.length > 0) {
          // Manually mirror landmarks so they match the flipped video feed
          const mirroredLandmarks = results.landmarks.map(hand => 
            hand.map(lm => ({ ...lm, x: 1 - lm.x }))
          );

          // If two hands are detected, draw the quadrilateral and apply halftone
          if (mirroredLandmarks.length >= 2) {
            const hand1 = mirroredLandmarks[0];
            const hand2 = mirroredLandmarks[1];

            const isHandOpen = (landmarks: any[]) => {
              const wrist = landmarks[0];
              let openFingers = 0;
              [
                [8, 6], [12, 10], [16, 14], [20, 18]
              ].forEach(([tipIdx, pipIdx]) => {
                const tip = landmarks[tipIdx];
                const pip = landmarks[pipIdx];
                const distTip = Math.hypot((tip.x - wrist.x) * canvas.width, (tip.y - wrist.y) * canvas.height);
                const distPip = Math.hypot((pip.x - wrist.x) * canvas.width, (pip.y - wrist.y) * canvas.height);
                if (distTip > distPip) {
                  openFingers++;
                }
              });
              return openFingers >= 3;
            };

            if (isHandOpen(hand1) && isHandOpen(hand2)) {
              if (!wasOpenRef.current) {
                smoothedCoordsRef.current = {};
              }
              wasOpenRef.current = true;

              const applyEma = (key: string, current: {x: number, y: number}, alpha = 0.3) => {
                const prev = smoothedCoordsRef.current[key];
                if (!prev) {
                  smoothedCoordsRef.current[key] = { x: current.x, y: current.y };
                  return current;
                }
                const smoothed = {
                  x: current.x * alpha + prev.x * (1 - alpha),
                  y: current.y * alpha + prev.y * (1 - alpha)
                };
                smoothedCoordsRef.current[key] = smoothed;
                return smoothed;
              };

              // 4 is THUMB_TIP, 8 is INDEX_FINGER_TIP
              const h1Thumb = applyEma('h1Thumb', hand1[4]);
              const h1Index = applyEma('h1Index', hand1[8]);
              const h2Thumb = applyEma('h2Thumb', hand2[4]);
              const h2Index = applyEma('h2Index', hand2[8]);
              
              const h1Middle = applyEma('h1Middle', hand1[12]);
              const h2Middle = applyEma('h2Middle', hand2[12]);

              const getPx = (landmark: {x: number, y: number}) => ({
                x: landmark.x * canvas.width,
                y: landmark.y * canvas.height
              });

            const drawShadedQuad = (
              p1: {x: number, y: number}, p2: {x: number, y: number},
              p3: {x: number, y: number}, p4: {x: number, y: number},
              config: {
                showMask: boolean, color: string, posterizeLevels: number,
                dotSize: number, glowIntensity: number, showScanlines: boolean,
                effectStyle?: 'halftone' | 'xray' | 'led' | 'dither',
                xrayColors?: [string, string, string, string],
                motionBlur?: number, bloomIntensity?: number, blurCanvas?: HTMLCanvasElement | null,
                chromaticAberration?: number, filmGrain?: number
              }
            ) => {
              let minX = Math.floor(Math.min(p1.x, p2.x, p3.x, p4.x));
              let maxX = Math.ceil(Math.max(p1.x, p2.x, p3.x, p4.x));
              let minY = Math.floor(Math.min(p1.y, p2.y, p3.y, p4.y));
              let maxY = Math.ceil(Math.max(p1.y, p2.y, p3.y, p4.y));
  
              minX = Math.max(0, minX);
              minY = Math.max(0, minY);
              maxX = Math.min(canvas.width, maxX);
              maxY = Math.min(canvas.height, maxY);
  
              const w = maxX - minX;
              const h = maxY - minY;
  
              let activeEffectCanvas = effectCanvas;
              if (config.showMask && w > 0 && h > 0) {
                if (hardwareAcceleration) {
                  if (!webglRef.current) {
                    webglRef.current = new WebGLProcessor();
                  }
                  
                  const outCanvas = webglRef.current.process(feedCanvasRef.current!, minX, minY, w, h, {
                    ...config,
                    effectStyle: config.effectStyle || 'halftone'
                  });
                  
                  if (outCanvas) {
                    activeEffectCanvas = outCanvas as HTMLCanvasElement;
                  }
                } else {
                  if (effectCanvas.width !== w || effectCanvas.height !== h) {
                    effectCanvas.width = w;
                    effectCanvas.height = h;
                  } else {
                    effectCanvas.getContext('2d')!.clearRect(0, 0, w, h);
                  }
                  const effCtx = effectCanvas.getContext('2d')!;
                  
                  const imgData = feedCanvasRef.current!.getContext('2d')!.getImageData(minX, minY, w, h);
                  const data = imgData.data;
                  const tint = hexToRgb(config.color);
                  
                  // Pre-allocate or reuse a buffer for chromatic aberration to avoid GC pauses
                  if (!outPixelsRef.current || outPixelsRef.current.length < data.length) {
                     outPixelsRef.current = new Uint8ClampedArray(data.length);
                  }
                  const outPixels = outPixelsRef.current;
                  
                  const isXray = config.effectStyle === 'xray' || config.effectStyle === 'dither';
                  const hasAberration = config.chromaticAberration && config.chromaticAberration > 0;
                  const hasFilmGrain = config.filmGrain && config.filmGrain > 0;
                  const needsPostProcess = hasAberration || hasFilmGrain;
                  
                  // Precompute xray colors outside the loop
                  const c0 = config.xrayColors ? hexToRgb(config.xrayColors[0]) : {r: 0, g: 0, b: 0};
                  const c1 = config.xrayColors ? hexToRgb(config.xrayColors[1]) : tint;
                  const c2 = config.xrayColors ? hexToRgb(config.xrayColors[2]) : tint;
                  const c3 = config.xrayColors ? hexToRgb(config.xrayColors[3]) : {r: 255, g: 255, b: 255};
                  
                  // Precompute power curve lookup table (0-255) to avoid Math.pow in loop
                  if (!powLUTRef.current) {
                    powLUTRef.current = new Float32Array(256);
                    for (let i = 0; i < 256; i++) {
                       powLUTRef.current[i] = Math.pow(i / 255, 1.5) * 255;
                    }
                  }
                  const powLUT = powLUTRef.current;
  
                  const targetBuffer = needsPostProcess ? outPixels : data;
  
                  for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];
                    
                    const luma = (r * 299 + g * 587 + b * 114) / 1000; // fast int math
                    let outR = 0, outG = 0, outB = 0;
  
                    if (isXray) {
                      // X-Ray / Inverted Thermal Look
                      const invLuma = Math.max(0, Math.min(255, Math.floor(255 - luma)));
                      // Boost contrast with precomputed power curve
                      const contrastLuma = powLUT[invLuma];
                      
                      if (contrastLuma < 85) {
                        const mix = contrastLuma / 85;
                        outR = c0.r + (c1.r - c0.r) * mix;
                        outG = c0.g + (c1.g - c0.g) * mix;
                        outB = c0.b + (c1.b - c0.b) * mix;
                      } else if (contrastLuma < 170) {
                        const mix = (contrastLuma - 85) / 85;
                        outR = c1.r + (c2.r - c1.r) * mix;
                        outG = c1.g + (c2.g - c1.g) * mix;
                        outB = c1.b + (c2.b - c1.b) * mix;
                      } else {
                        const mix = (contrastLuma - 170) / 85;
                        outR = c2.r + (c3.r - c2.r) * mix;
                        outG = c2.g + (c3.g - c2.g) * mix;
                        outB = c2.b + (c3.b - c2.b) * mix;
                      }
                    } else if (config.effectStyle === 'led') {
                      // Fallback CPU implementation for LED
                      const step = 255 / config.posterizeLevels;
                      const lumaLevel = Math.floor(luma / step) * step + (step/2);
                      const pixelIdx = i / 4;
                      const px = minX + (pixelIdx % w);
                      const py = minY + Math.floor(pixelIdx / w);
                      
                      const cellX = (px % config.dotSize) - (config.dotSize / 2);
                      const cellY = (py % config.dotSize) - (config.dotSize / 2);
                      const dist = Math.max(Math.abs(cellX), Math.abs(cellY));
                      const ledEdge = (config.dotSize / 2) - 1;
                      if (dist > ledEdge) {
                        outR = 0; outG = 0; outB = 0;
                      } else {
                        const timeGlow = (Math.sin((performance.now() % 10000) * 0.005 + lumaLevel * 10) * 0.5 + 0.5) * 0.3 + 0.7;
                        if (lumaLevel < 25) {
                          outR = tint.r * 0.05; outG = tint.g * 0.05; outB = tint.b * 0.05;
                        } else {
                          const mixAmount = lumaLevel / 255;
                          if (mixAmount < 0.33) {
                            const mix = mixAmount * 3.0;
                            outR = c0.r + (c1.r - c0.r) * mix; outG = c0.g + (c1.g - c0.g) * mix; outB = c0.b + (c1.b - c0.b) * mix;
                          } else if (mixAmount < 0.66) {
                            const mix = (mixAmount - 0.33) * 3.0;
                            outR = c1.r + (c2.r - c1.r) * mix; outG = c1.g + (c2.g - c1.g) * mix; outB = c1.b + (c2.b - c1.b) * mix;
                          } else {
                            const mix = (mixAmount - 0.66) * 3.0;
                            outR = c2.r + (c3.r - c2.r) * mix; outG = c2.g + (c3.g - c2.g) * mix; outB = c2.b + (c3.b - c2.b) * mix;
                          }
                        }
                        outR *= timeGlow; outG *= timeGlow; outB *= timeGlow;
                      }
                    } else {
                      // Halftone Cartoon Look
                      const step = 255 / config.posterizeLevels;
                      const lumaLevel = Math.floor(luma / step) * step + (step/2);
                      
                      if (luma < 60) {
                        outR = tint.r * 0.15;
                        outG = tint.g * 0.15;
                        outB = tint.b * 0.15;
                      } else if (luma < 150) {
                        outR = tint.r * 0.5;
                        outG = tint.g * 0.5;
                        outB = tint.b * 0.5;
                      } else {
                        outR = tint.r * 1.5 + (r * 0.3);
                        outG = tint.g * 1.5 + (g * 0.3);
                        outB = tint.b * 1.5 + (b * 0.3);
                      }
                      
                      const radius = (1 - (lumaLevel / 255)) * (config.dotSize * 0.6);
                      const pixelIdx = i / 4;
                      const px = minX + (pixelIdx % w);
                      const py = minY + Math.floor(pixelIdx / w);
                      
                      const cellX = (px % config.dotSize) - (config.dotSize / 2);
                      const cellY = (py % config.dotSize) - (config.dotSize / 2);
                      
                      if ((cellX * cellX + cellY * cellY) < (radius * radius)) {
                         outR = tint.r * 0.1;
                         outG = tint.g * 0.1;
                         outB = tint.b * 0.1;
                      }
                    }
                    
                    targetBuffer[i] = outR * 1.2;
                    targetBuffer[i+1] = outG * 1.2;
                    targetBuffer[i+2] = outB * 1.2;
                    if (!needsPostProcess) {
                       targetBuffer[i+3] = 255;
                    }
                  }
                  
                  if (needsPostProcess) {
                    const shift = hasAberration ? Math.floor((config.chromaticAberration! / 100) * 20) : 0;
                    const grainAmount = hasFilmGrain ? (config.filmGrain! / 100) * 0.4 * 255 : 0;
                    const timeSeed = performance.now() % 10000;
                    for (let i = 0; i < data.length; i += 4) {
                      const idx = i / 4;
                      const x = idx % w;
                      const y = Math.floor(idx / w);
  
                      const iR = i - Math.min(x, shift) * 4;
                      const iB = i + Math.min(w - 1 - x, shift) * 4;
  
                      let r = targetBuffer[iR];
                      let g = targetBuffer[i+1];
                      let b = targetBuffer[iB+2];

                      if (hasFilmGrain) {
                        // pseudo random noise, using simple hash
                        let n = Math.sin(x * 12.9898 + y * 78.233 + timeSeed) * 43758.5453;
                        n = n - Math.floor(n);
                        let grain = (grainAmount * 0.5) - (n * grainAmount);
                        r = r + grain;
                        g = g + grain;
                        b = b + grain;
                      }

                      data[i] = r;
                      data[i+1] = g;
                      data[i+2] = b;
                      data[i+3] = 255;
                    }
                  }
  
                  effCtx.putImageData(imgData, 0, 0);
                }
              }
              
              if (config.showMask || config.showScanlines) {
                canvasCtx.save();
                canvasCtx.beginPath();
                canvasCtx.moveTo(p1.x, p1.y);
                canvasCtx.lineTo(p2.x, p2.y);
                canvasCtx.lineTo(p3.x, p3.y);
                canvasCtx.lineTo(p4.x, p4.y);
                canvasCtx.closePath();
                canvasCtx.clip();
                
                if (config.showMask && w > 0 && h > 0) {
                  canvasCtx.drawImage(activeEffectCanvas, minX, minY);

                  if (config.bloomIntensity && config.bloomIntensity > 0) {
                    canvasCtx.save();
                    canvasCtx.globalCompositeOperation = 'screen';
                    canvasCtx.globalAlpha = config.bloomIntensity / 100;
                    canvasCtx.filter = `blur(${Math.max(2, config.bloomIntensity / 5)}px)`;
                    canvasCtx.drawImage(activeEffectCanvas, minX, minY);
                    canvasCtx.restore();
                  }

                  if (config.motionBlur && config.motionBlur > 0 && config.blurCanvas) {
                    const bCtx = config.blurCanvas.getContext('2d')!;
                    bCtx.save();
                    bCtx.beginPath();
                    bCtx.moveTo(p1.x, p1.y);
                    bCtx.lineTo(p2.x, p2.y);
                    bCtx.lineTo(p3.x, p3.y);
                    bCtx.lineTo(p4.x, p4.y);
                    bCtx.closePath();
                    bCtx.clip();
                    bCtx.drawImage(activeEffectCanvas, minX, minY);
                    if (config.bloomIntensity && config.bloomIntensity > 0) {
                      bCtx.globalCompositeOperation = 'screen';
                      bCtx.globalAlpha = config.bloomIntensity / 100;
                      bCtx.filter = `blur(${Math.max(2, config.bloomIntensity / 5)}px)`;
                      bCtx.drawImage(activeEffectCanvas, minX, minY);
                    }
                    bCtx.restore();
                  }
                }
                  
                if (config.showScanlines && w > 0 && h > 0 && scanlinePatternRef.current) {
                  canvasCtx.fillStyle = scanlinePatternRef.current;
                  canvasCtx.fillRect(minX, minY, w, h);
                }
                
                canvasCtx.restore();
              }

              canvasCtx.beginPath();
              canvasCtx.moveTo(p1.x, p1.y);
              canvasCtx.lineTo(p2.x, p2.y);
              canvasCtx.lineTo(p3.x, p3.y);
              canvasCtx.lineTo(p4.x, p4.y);
              canvasCtx.closePath();
              canvasCtx.lineWidth = 4;
              canvasCtx.strokeStyle = config.color;
              canvasCtx.lineDashOffset = dashOffsetRef.current;
              canvasCtx.setLineDash([15, 10]);
              canvasCtx.shadowColor = config.color;
              canvasCtx.shadowBlur = config.glowIntensity;
              canvasCtx.stroke();
              canvasCtx.setLineDash([]);
              canvasCtx.shadowBlur = 0;
            };

            // Draw R1
            drawShadedQuad(
              getPx(h1Index), getPx(h2Index), getPx(h2Thumb), getPx(h1Thumb),
              {
                showMask: showMaskRef.current,
                color: effectColorRef.current,
                posterizeLevels: posterizeLevelsRef.current,
                dotSize: dotSizeRef.current,
                glowIntensity: glowIntensityRef.current,
                showScanlines: showScanlinesRef.current,
                effectStyle: effectStyleRef.current,
                xrayColors: xrayColorsRef.current,
                motionBlur: motionBlurRef.current,
                bloomIntensity: bloomIntensityRef.current,
                blurCanvas: blurCanvasR1Ref.current,
                chromaticAberration: chromaticAberrationRef.current,
                filmGrain: filmGrainRef.current
              }
            );

            // Draw R2 (using middle fingers and index fingers)
            // 12 is MIDDLE_FINGER_TIP
            drawShadedQuad(
              getPx(h1Middle), getPx(h2Middle), getPx(h2Index), getPx(h1Index),
              {
                showMask: r2ShowMaskRef.current,
                color: r2ColorRef.current,
                posterizeLevels: r2PosterizeLevelsRef.current,
                dotSize: r2DotSizeRef.current,
                glowIntensity: r2GlowIntensityRef.current,
                showScanlines: r2ShowScanlinesRef.current,
                effectStyle: r2EffectStyleRef.current,
                xrayColors: r2XrayColorsRef.current,
                motionBlur: r2MotionBlurRef.current,
                bloomIntensity: r2BloomIntensityRef.current,
                blurCanvas: blurCanvasR2Ref.current,
                chromaticAberration: r2ChromaticAberrationRef.current,
                filmGrain: r2FilmGrainRef.current
              }
            );
            } else {
              wasOpenRef.current = false;
            }
          } else {
            wasOpenRef.current = false;
          }

          // Draw hand landmarks over everything
          if (showLandmarksRef.current) {
            if (!drawingUtilsRef.current) {
                drawingUtilsRef.current = new DrawingUtils(canvasCtx);
            }
            for (const landmarks of mirroredLandmarks) {
              drawingUtilsRef.current.drawConnectors(
                landmarks,
                HandLandmarker.HAND_CONNECTIONS,
                { color: '#00FFCC', lineWidth: 2 }
              );
              drawingUtilsRef.current.drawLandmarks(landmarks, {
                color: effectColorRef.current,
                lineWidth: 2,
                radius: 4,
              });
            }
          }
        }
        canvasCtx.restore();
      }

      animationFrameId = window.requestAnimationFrame(predictWebcam);
    };

    initializeHandTracker();

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (handLandmarker) {
        handLandmarker.close();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[80vh] max-w-5xl aspect-video bg-black overflow-hidden border border-[#1f1f1f] flex items-center justify-center -translate-y-4">
      <div className="absolute top-4 left-4 z-20 flex gap-4">
        <div className="bg-black/80 backdrop-blur-md border border-[#333] px-3 py-2 shadow-lg flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-600 font-bold tracking-widest uppercase font-sans">FPS</span>
            <span className="text-white font-mono text-base leading-none">{fps > 0 ? fps : '--'}</span>
          </div>
          <div className="w-px h-6 bg-[#333]"></div>
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-600 font-bold tracking-widest uppercase font-sans">SYS_DLAY</span>
            <span className="text-[#00ffff] font-mono text-base leading-none">{latency > 0 ? `${latency}ms` : '--'}</span>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 z-20 flex gap-4">
        <div className="bg-black/80 backdrop-blur-md border border-[#333] px-3 py-2 shadow-lg flex items-center gap-3">
          <div className="w-2 h-2 bg-cyan-500 animate-pulse"></div>
          <span className="text-[10px] text-cyan-500 uppercase tracking-widest font-mono">REC_ACTIVE</span>
        </div>
      </div>

      <div className="absolute top-0 bottom-0 left-1/3 w-px bg-cyan-500/10 pointer-events-none mix-blend-screen"></div>
      <div className="absolute top-0 bottom-0 right-1/3 w-px bg-cyan-500/10 pointer-events-none mix-blend-screen"></div>
      <div className="absolute top-1/3 left-0 right-0 h-px bg-cyan-500/10 pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-1/3 left-0 right-0 h-px bg-cyan-500/10 pointer-events-none mix-blend-screen"></div>

      {status && (
        <div className="absolute z-10 flex flex-col items-center justify-center text-[#00ffff] p-6 bg-black/90 border border-cyan-500/30 backdrop-blur-md">
          {!isModelLoaded && (
            <div className="w-8 h-8 border-4 border-[#00ffff] border-t-transparent animate-spin mb-4"></div>
          )}
          <p className="text-xs font-bold tracking-widest uppercase font-mono">{status}</p>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
      ></video>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      ></canvas>
    </div>
  );
}
