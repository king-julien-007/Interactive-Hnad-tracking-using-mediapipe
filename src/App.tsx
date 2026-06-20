/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import HandTracker from './components/HandTracker';

export default function App() {
  const [confidence, setConfidence] = useState(0.5);
  const [showLandmarks, setShowLandmarks] = useState(true);

  const [hardwareAcceleration, setHardwareAcceleration] = useState<boolean>(true);
  const [bgExposure, setBgExposure] = useState<number>(100);

  // R1 State
  const [effectColor, setEffectColor] = useState('#00FFCC');
  const [showMask, setShowMask] = useState(true);
  const [posterizeLevels, setPosterizeLevels] = useState(6);
  const [dotSize, setDotSize] = useState(6);
  const [glowIntensity, setGlowIntensity] = useState(15);
  const [showScanlines, setShowScanlines] = useState(true);
  const [effectStyle, setEffectStyle] = useState<'halftone'|'xray'|'led'|'dither'>('xray');
  const [xrayColors, setXrayColors] = useState<[string, string, string, string]>(['#0a0b1a', '#00d0ff', '#ff3300', '#111144']);
  const [motionBlur, setMotionBlur] = useState<number>(0);
  const [bloomIntensity, setBloomIntensity] = useState<number>(0);
  const [chromaticAberration, setChromaticAberration] = useState<number>(0);
  const [filmGrain, setFilmGrain] = useState<number>(10);

  // R2 State
  const [r2Color, setR2Color] = useState('#0099FF');
  const [r2ShowMask, setR2ShowMask] = useState(true);
  const [r2PosterizeLevels, setR2PosterizeLevels] = useState(6);
  const [r2DotSize, setR2DotSize] = useState(6);
  const [r2GlowIntensity, setR2GlowIntensity] = useState(25);
  const [r2ShowScanlines, setR2ShowScanlines] = useState(true);
  const [r2EffectStyle, setR2EffectStyle] = useState<'halftone'|'xray'|'led'|'dither'>('xray');
  const [r2XrayColors, setR2XrayColors] = useState<[string, string, string, string]>(['#000033', '#00ffff', '#ffcc00', '#ff0000']);
  const [r2MotionBlur, setR2MotionBlur] = useState<number>(0);
  const [r2BloomIntensity, setR2BloomIntensity] = useState<number>(0);
  const [r2ChromaticAberration, setR2ChromaticAberration] = useState<number>(0);
  const [r2FilmGrain, setR2FilmGrain] = useState<number>(10);

  const [activeRectConfig, setActiveRectConfig] = useState<'R1'|'R2'>('R2');

  const [profiles, setProfiles] = useState<any[]>(() => {
    const saved = localStorage.getItem('handsense_profiles');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'default', name: 'Default Dual',
        r1: { effectColor: '#00FFCC', showMask: true, posterizeLevels: 6, dotSize: 6, glowIntensity: 15, showScanlines: true, effectStyle: 'xray', xrayColors: ['#000000', '#002244', '#0088cc', '#ffffff'], motionBlur: 0, bloomIntensity: 0, chromaticAberration: 0, filmGrain: 10 },
        r2: { color: '#0099FF', showMask: true, posterizeLevels: 6, dotSize: 6, glowIntensity: 25, showScanlines: true, effectStyle: 'xray', xrayColors: ['#000033', '#00ffff', '#ffcc00', '#ff0000'], motionBlur: 0, bloomIntensity: 0, chromaticAberration: 0, filmGrain: 10 }
      },
      {
        id: 'flashlight', name: 'Flashlight Threshold',
        r1: { effectColor: '#FFFFFF', showMask: true, posterizeLevels: 2, dotSize: 1, glowIntensity: 0, showScanlines: false, effectStyle: 'xray', xrayColors: ['#000000', '#555555', '#aaaaaa', '#ffffff'], motionBlur: 0, bloomIntensity: 0, chromaticAberration: 0, filmGrain: 0 },
        r2: { color: '#FFFFFF', showMask: true, posterizeLevels: 2, dotSize: 1, glowIntensity: 0, showScanlines: false, effectStyle: 'xray', xrayColors: ['#000000', '#555555', '#aaaaaa', '#ffffff'], motionBlur: 0, bloomIntensity: 0, chromaticAberration: 0, filmGrain: 0 }
      },
      {
        id: 'spider-noir', name: 'Spider Noir',
        r1: { effectColor: '#FFFFFF', showMask: true, posterizeLevels: 2, dotSize: 4, glowIntensity: 5, showScanlines: true, effectStyle: 'halftone', xrayColors: ['#000000', '#111111', '#555555', '#ffffff'], motionBlur: 40, bloomIntensity: 10, chromaticAberration: 10, filmGrain: 30 },
        r2: { color: '#FF0000', showMask: true, posterizeLevels: 3, dotSize: 3, glowIntensity: 10, showScanlines: true, effectStyle: 'xray', xrayColors: ['#000000', '#220000', '#ff0000', '#ffffff'], motionBlur: 80, bloomIntensity: 40, chromaticAberration: 30, filmGrain: 30 }
      },
      {
        id: 'golden-matrix', name: 'Golden Matrix',
        r1: { effectColor: '#FFCC00', showMask: true, posterizeLevels: 10, dotSize: 10, glowIntensity: 0, showScanlines: true, effectStyle: 'led', xrayColors: ['#000000', '#220a00', '#cc4400', '#ffcc88'], motionBlur: 0, bloomIntensity: 25, chromaticAberration: 0, filmGrain: 5 },
        r2: { color: '#FFCC00', showMask: true, posterizeLevels: 10, dotSize: 10, glowIntensity: 0, showScanlines: true, effectStyle: 'led', xrayColors: ['#000000', '#220a00', '#cc4400', '#ffcc88'], motionBlur: 0, bloomIntensity: 25, chromaticAberration: 0, filmGrain: 5 }
      },
      {
        id: 'heatmap-thermal', name: 'Heatmap Thermal',
        r1: { effectColor: '#FFFFFF', showMask: true, posterizeLevels: 8, dotSize: 4, glowIntensity: 10, showScanlines: false, effectStyle: 'dither', xrayColors: ['#0000aa', '#cc0000', '#ffaa00', '#ffffff'], motionBlur: 20, bloomIntensity: 10, chromaticAberration: 30, filmGrain: 0 },
        r2: { color: '#FFFFFF', showMask: true, posterizeLevels: 8, dotSize: 4, glowIntensity: 10, showScanlines: false, effectStyle: 'dither', xrayColors: ['#0000aa', '#cc0000', '#ffaa00', '#ffffff'], motionBlur: 20, bloomIntensity: 10, chromaticAberration: 30, filmGrain: 0 }
      }
    ];
  });
  
  const saveProfile = () => {
    const newName = prompt("Profile name:");
    if (!newName) return;
    const newProfile = {
      id: Date.now().toString(),
      name: newName,
      r1: { effectColor, showMask, posterizeLevels, dotSize, glowIntensity, showScanlines, effectStyle, xrayColors, motionBlur, bloomIntensity, chromaticAberration, filmGrain },
      r2: { color: r2Color, showMask: r2ShowMask, posterizeLevels: r2PosterizeLevels, dotSize: r2DotSize, glowIntensity: r2GlowIntensity, showScanlines: r2ShowScanlines, effectStyle: r2EffectStyle, xrayColors: r2XrayColors, motionBlur: r2MotionBlur, bloomIntensity: r2BloomIntensity, chromaticAberration: r2ChromaticAberration, filmGrain: r2FilmGrain }
    };
    const newProfiles = [...profiles, newProfile];
    setProfiles(newProfiles);
    localStorage.setItem('handsense_profiles', JSON.stringify(newProfiles));
  };

  const loadProfile = (p: any) => {
    if (!p) return;
    setEffectColor(p.r1.effectColor);
    setShowMask(p.r1.showMask);
    setPosterizeLevels(p.r1.posterizeLevels);
    setDotSize(p.r1.dotSize);
    setGlowIntensity(p.r1.glowIntensity);
    setShowScanlines(p.r1.showScanlines);
    setEffectStyle(p.r1.effectStyle || 'xray');
    if (p.r1.xrayColors) setXrayColors(p.r1.xrayColors);
    if (p.r1.motionBlur !== undefined) setMotionBlur(p.r1.motionBlur);
    if (p.r1.bloomIntensity !== undefined) setBloomIntensity(p.r1.bloomIntensity);
    if (p.r1.chromaticAberration !== undefined) setChromaticAberration(p.r1.chromaticAberration);
    if (p.r1.filmGrain !== undefined) setFilmGrain(p.r1.filmGrain);

    setR2Color(p.r2.color);
    setR2ShowMask(p.r2.showMask);
    setR2PosterizeLevels(p.r2.posterizeLevels);
    setR2DotSize(p.r2.dotSize);
    setR2GlowIntensity(p.r2.glowIntensity);
    setR2ShowScanlines(p.r2.showScanlines);
    setR2EffectStyle(p.r2.effectStyle || 'xray');
    if (p.r2.xrayColors) setR2XrayColors(p.r2.xrayColors);
    if (p.r2.motionBlur !== undefined) setR2MotionBlur(p.r2.motionBlur);
    if (p.r2.bloomIntensity !== undefined) setR2BloomIntensity(p.r2.bloomIntensity);
    if (p.r2.chromaticAberration !== undefined) setR2ChromaticAberration(p.r2.chromaticAberration);
    if (p.r2.filmGrain !== undefined) setR2FilmGrain(p.r2.filmGrain);
  };

  const deleteProfile = (id: string, e: any) => {
    e.stopPropagation();
    const newProfiles = profiles.filter(p => p.id !== id);
    setProfiles(newProfiles);
    localStorage.setItem('handsense_profiles', JSON.stringify(newProfiles));
  };

  const swapEffects = () => {
    const tColor = effectColor;
    const tMask = showMask;
    const tPosterize = posterizeLevels;
    const tDot = dotSize;
    const tGlow = glowIntensity;
    const tScanlines = showScanlines;
    const tStyle = effectStyle;
    const tXray = xrayColors;
    const tMotion = motionBlur;
    const tBloom = bloomIntensity;
    const tAberration = chromaticAberration;
    const tGrain = filmGrain;

    setEffectColor(r2Color);
    setShowMask(r2ShowMask);
    setPosterizeLevels(r2PosterizeLevels);
    setDotSize(r2DotSize);
    setGlowIntensity(r2GlowIntensity);
    setShowScanlines(r2ShowScanlines);
    setEffectStyle(r2EffectStyle);
    setXrayColors(r2XrayColors);
    setMotionBlur(r2MotionBlur);
    setBloomIntensity(r2BloomIntensity);
    setChromaticAberration(r2ChromaticAberration);
    setFilmGrain(r2FilmGrain);

    setR2Color(tColor);
    setR2ShowMask(tMask);
    setR2PosterizeLevels(tPosterize);
    setR2DotSize(tDot);
    setR2GlowIntensity(tGlow);
    setR2ShowScanlines(tScanlines);
    setR2EffectStyle(tStyle);
    setR2XrayColors(tXray);
    setR2MotionBlur(tMotion);
    setR2BloomIntensity(tBloom);
    setR2ChromaticAberration(tAberration);
    setR2FilmGrain(tGrain);
  };

  return (
    <div className="flex h-screen w-full bg-black text-gray-300 font-mono overflow-hidden selection:bg-cyan-500/30">
      <aside className="w-80 bg-[#050505] flex flex-col border-r border-[#1a1a1a]">
        <div className="p-6 border-b border-[#1a1a1a]">
          <h1 className="text-xl font-bold flex items-center gap-3 tracking-tighter text-white">
            <div className="w-3 h-3 bg-cyan-500 animate-pulse outline outline-2 outline-offset-2 outline-cyan-500/30"></div>SYS.TRACK.01
          </h1>
          <p className="text-[10px] text-gray-500 mt-3 uppercase tracking-widest font-sans">v4.2.0-STABLE // ROOT</p>
        </div>
        <div className="p-6 space-y-8 flex-1 overflow-y-auto">
          <section>
            <label className="text-[10px] font-bold uppercase text-cyan-500/80 tracking-widest mb-4 block">Core Configuration</label>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2 text-xs text-gray-400">
                  <span className="uppercase tracking-wider">Feed Exposure</span>
                  <span className="text-cyan-400 font-bold">{bgExposure}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" step="1" 
                  value={bgExposure} 
                  onChange={(e) => setBgExposure(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-[#1a1a1a] h-1 rounded-none appearance-none outline-none cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between mb-2 text-xs text-gray-400">
                  <span className="uppercase tracking-wider">Confidence</span>
                  <span className="text-cyan-400 font-bold">{confidence.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" max="0.9" step="0.1" 
                  value={confidence} 
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 bg-[#1a1a1a] h-1 rounded-none appearance-none outline-none cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-black border border-[#1a1a1a]">
                <span className="text-xs uppercase tracking-wider text-gray-400">HW Accel</span>
                <button 
                  onClick={() => setHardwareAcceleration(!hardwareAcceleration)}
                  className={`w-10 h-4 flex items-center px-0.5 transition-colors ${hardwareAcceleration ? 'bg-cyan-500/20 border border-cyan-500 justify-end' : 'bg-[#1a1a1a] border border-[#333] justify-start'}`}
                >
                  <div className={`w-3 h-3 ${hardwareAcceleration ? 'bg-cyan-400' : 'bg-gray-500'}`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-black border border-[#1a1a1a]">
                <span className="text-xs uppercase tracking-wider text-gray-400">Landmarks</span>
                <button 
                  onClick={() => setShowLandmarks(!showLandmarks)}
                  className={`w-10 h-4 flex items-center px-0.5 transition-colors ${showLandmarks ? 'bg-cyan-500/20 border border-cyan-500 justify-end' : 'bg-[#1a1a1a] border border-[#333] justify-start'}`}
                >
                  <div className={`w-3 h-3 ${showLandmarks ? 'bg-cyan-400' : 'bg-gray-500'}`}></div>
                </button>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-bold uppercase text-cyan-500/80 tracking-widest block m-0">Presets</label>
              <button onClick={saveProfile} className="text-[10px] bg-cyan-500/10 border border-cyan-500 text-cyan-400 px-2 py-1 hover:bg-cyan-500 hover:text-black transition-colors uppercase tracking-wider font-bold">Save</button>
            </div>
            <div className="space-y-2 mb-8">
              {profiles.map(p => (
                <div key={p.id} className="flex justify-between items-center p-2 bg-black border border-[#1a1a1a] cursor-pointer hover:border-cyan-500/50 transition-colors group" onClick={() => loadProfile(p)}>
                  <span className="text-xs tracking-wider text-gray-300 group-hover:text-cyan-400 transition-colors truncate mr-2">{p.name}</span>
                  {p.id !== 'default' && (
                    <button onClick={(e) => deleteProfile(p.id, e)} className="text-gray-600 hover:text-red-500 px-1 text-xs">✕</button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex w-full bg-[#050505] p-1 border border-[#1a1a1a] mb-2">
              <button 
                onClick={() => setActiveRectConfig('R1')}
                className={`flex-1 text-[10px] py-2 uppercase tracking-widest font-bold ${activeRectConfig === 'R1' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Rect_01 
              </button>
              <button 
                onClick={() => setActiveRectConfig('R2')}
                className={`flex-1 text-[10px] py-2 uppercase tracking-widest font-bold ${activeRectConfig === 'R2' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Rect_02
              </button>
            </div>
            <button
               onClick={swapEffects}
               className="w-full text-[10px] py-2 mb-6 uppercase tracking-widest font-bold bg-black border border-[#1a1a1a] text-gray-500 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
            >
               <span>⇅</span> Exchange Buffers
            </button>

            <label className="text-[10px] font-bold uppercase text-cyan-500/80 tracking-widest mb-4 block underline decoration-cyan-500/30 underline-offset-4">{activeRectConfig}_PARAMS</label>
            <div className="space-y-6">
              
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider text-gray-400">Render Pipeline</span>
                <select 
                  value={activeRectConfig === 'R1' ? effectStyle : r2EffectStyle}
                  onChange={(e) => activeRectConfig === 'R1' ? setEffectStyle(e.target.value as 'halftone'|'xray'|'led'|'dither') : setR2EffectStyle(e.target.value as 'halftone'|'xray'|'led'|'dither')}
                  className="bg-black border border-[#1a1a1a] p-2 text-xs text-white focus:outline-none focus:border-cyan-500 uppercase tracking-wider"
                >
                  <option value="halftone">Neon Halftone</option>
                  <option value="xray">Inverted X-Ray</option>
                  <option value="led">LED Matrix</option>
                  <option value="dither">Thermal Dither</option>
                </select>
              </div>

              {['xray', 'led', 'dither'].includes(activeRectConfig === 'R1' ? effectStyle : r2EffectStyle) ? (
                <div className="space-y-3">
                  <span className="text-xs uppercase tracking-wider text-gray-400">Color Matrix</span>
                  <div className="flex justify-between items-center bg-black p-3 border border-[#1a1a1a] relative">
                    <div className="absolute inset-0 m-3 opacity-20 pointer-events-none" style={{
                      background: `linear-gradient(to right, ${(activeRectConfig === 'R1' ? xrayColors : r2XrayColors).join(', ')})`
                    }}></div>
                    
                    {(activeRectConfig === 'R1' ? xrayColors : r2XrayColors).map((c, i) => (
                      <div key={i} className="relative w-6 h-6 border border-gray-600 overflow-hidden cursor-pointer z-10 hover:border-cyan-400 transition-colors">
                        <input 
                          type="color" 
                          value={c}
                          onChange={(e) => {
                            const newCols = [...(activeRectConfig === 'R1' ? xrayColors : r2XrayColors)] as [string, string, string, string];
                            newCols[i] = e.target.value;
                            activeRectConfig === 'R1' ? setXrayColors(newCols) : setR2XrayColors(newCols);
                          }}
                          className="absolute -top-4 -left-4 w-16 h-16 cursor-crosshair border-0 p-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between mb-2 text-xs uppercase tracking-wider text-gray-400">
                    <span>Base Color</span>
                    <span className="text-cyan-400">{activeRectConfig === 'R1' ? effectColor : r2Color}</span>
                  </div>
                  <div className="flex gap-4 items-center mt-2">
                    <div className="relative w-8 h-8 border border-gray-600 overflow-hidden cursor-pointer hover:border-cyan-400 transition-colors">
                      <input 
                        type="color" 
                        value={activeRectConfig === 'R1' ? effectColor : r2Color}
                        onChange={(e) => activeRectConfig === 'R1' ? setEffectColor(e.target.value) : setR2Color(e.target.value)}
                        className="absolute -top-4 -left-4 w-20 h-20 cursor-crosshair border-0 p-0"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-black border border-[#1a1a1a]">
                <span className="text-xs uppercase tracking-wider text-gray-400">Inner Mask</span>
                <button 
                  onClick={() => activeRectConfig === 'R1' ? setShowMask(!showMask) : setR2ShowMask(!r2ShowMask)}
                  className={`w-10 h-4 flex items-center px-0.5 transition-colors ${(activeRectConfig === 'R1' ? showMask : r2ShowMask) ? 'bg-cyan-500/20 border border-cyan-500 justify-end' : 'bg-[#1a1a1a] border border-[#333] justify-start'}`}
                >
                  <div className={`w-3 h-3 ${(activeRectConfig === 'R1' ? showMask : r2ShowMask) ? 'bg-cyan-400' : 'bg-gray-500'}`}></div>
                </button>
              </div>

              <div>
                <div className="flex justify-between mb-2 text-xs uppercase tracking-wider text-gray-400">
                  <span>Quantization</span>
                  <span className="text-cyan-400">{activeRectConfig === 'R1' ? posterizeLevels : r2PosterizeLevels} lvls</span>
                </div>
                <input 
                  type="range" 
                  min="2" max="15" step="1" 
                  value={activeRectConfig === 'R1' ? posterizeLevels : r2PosterizeLevels} 
                  onChange={(e) => activeRectConfig === 'R1' ? setPosterizeLevels(parseInt(e.target.value)) : setR2PosterizeLevels(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-[#1a1a1a] h-1 appearance-none outline-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2 text-xs uppercase tracking-wider text-gray-400">
                  <span>Dot Scale</span>
                  <span className="text-cyan-400">{activeRectConfig === 'R1' ? dotSize : r2DotSize} px</span>
                </div>
                <input 
                  type="range" 
                  min="2" max="20" step="1" 
                  value={activeRectConfig === 'R1' ? dotSize : r2DotSize} 
                  onChange={(e) => activeRectConfig === 'R1' ? setDotSize(parseInt(e.target.value)) : setR2DotSize(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-[#1a1a1a] h-1 appearance-none outline-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2 text-xs uppercase tracking-wider text-gray-400">
                  <span>Bloom Extent</span>
                  <span className="text-cyan-400">{activeRectConfig === 'R1' ? glowIntensity : r2GlowIntensity}</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="50" step="1" 
                  value={activeRectConfig === 'R1' ? glowIntensity : r2GlowIntensity} 
                  onChange={(e) => activeRectConfig === 'R1' ? setGlowIntensity(parseInt(e.target.value)) : setR2GlowIntensity(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-[#1a1a1a] h-1 appearance-none outline-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2 text-xs uppercase tracking-wider text-gray-400">
                  <span>Temporal Blur</span>
                  <span className="text-cyan-400">{activeRectConfig === 'R1' ? motionBlur : r2MotionBlur}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="95" step="1" 
                  value={activeRectConfig === 'R1' ? motionBlur : r2MotionBlur} 
                  onChange={(e) => activeRectConfig === 'R1' ? setMotionBlur(parseInt(e.target.value)) : setR2MotionBlur(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-[#1a1a1a] h-1 appearance-none outline-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2 text-xs uppercase tracking-wider text-gray-400">
                  <span>Inner Radiance</span>
                  <span className="text-cyan-400">{activeRectConfig === 'R1' ? bloomIntensity : r2BloomIntensity}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" step="1" 
                  value={activeRectConfig === 'R1' ? bloomIntensity : r2BloomIntensity} 
                  onChange={(e) => activeRectConfig === 'R1' ? setBloomIntensity(parseInt(e.target.value)) : setR2BloomIntensity(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-[#1a1a1a] h-1 appearance-none outline-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2 text-xs uppercase tracking-wider text-gray-400">
                  <span>Chroma Shift</span>
                  <span className="text-cyan-400">{activeRectConfig === 'R1' ? chromaticAberration : r2ChromaticAberration}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" step="1" 
                  value={activeRectConfig === 'R1' ? chromaticAberration : r2ChromaticAberration} 
                  onChange={(e) => activeRectConfig === 'R1' ? setChromaticAberration(parseInt(e.target.value)) : setR2ChromaticAberration(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-[#1a1a1a] h-1 appearance-none outline-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2 text-xs uppercase tracking-wider text-gray-400">
                  <span>Dither Noise</span>
                  <span className="text-cyan-400">{activeRectConfig === 'R1' ? filmGrain : r2FilmGrain}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" step="1" 
                  value={activeRectConfig === 'R1' ? filmGrain : r2FilmGrain} 
                  onChange={(e) => activeRectConfig === 'R1' ? setFilmGrain(parseInt(e.target.value)) : setR2FilmGrain(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-[#1a1a1a] h-1 appearance-none outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-black border border-[#1a1a1a]">
                <span className="text-xs uppercase tracking-wider text-gray-400">CRT Scanlines</span>
                <button 
                  onClick={() => activeRectConfig === 'R1' ? setShowScanlines(!showScanlines) : setR2ShowScanlines(!r2ShowScanlines)}
                  className={`w-10 h-4 flex items-center px-0.5 transition-colors ${(activeRectConfig === 'R1' ? showScanlines : r2ShowScanlines) ? 'bg-cyan-500/20 border border-cyan-500 justify-end' : 'bg-[#1a1a1a] border border-[#333] justify-start'}`}
                >
                  <div className={`w-3 h-3 ${(activeRectConfig === 'R1' ? showScanlines : r2ShowScanlines) ? 'bg-cyan-400' : 'bg-gray-500'}`}></div>
                </button>
              </div>
            </div>
          </section>
          <section>
            <div className="p-3 bg-[#0a0a0a] border border-[#1a1a1a]">
              <p className="text-[10px] text-gray-500 font-mono leading-relaxed uppercase">
                <span className="text-cyan-500">&gt;</span> INIT SYS.OP...<br />
                <span className="text-cyan-500">&gt;</span> VIDEO_FEED: [OK]<br />
                <span className="text-cyan-500">&gt;</span> SENSOR_ARRAY: [ONLINE]<br />
                <span className="text-cyan-500">&gt;</span> SHADER_MODULE: [RESIDENT]
              </p>
            </div>
          </section>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col relative bg-black">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
        <header className="h-14 border-b border-[#1a1a1a] flex items-center justify-between px-8 bg-black/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-cyan-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">DATA_STREAM</span>
            </div>
            <div className="h-3 w-px bg-[#333]"></div>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-sans">OPTICAL_SENSOR: ACTIVE</span>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-[#1a1a1a] border border-[#333] text-gray-300 hover:text-white hover:border-cyan-500 transition-colors text-[10px] uppercase tracking-widest font-bold">
              RELOAD_FEED
            </button>
          </div>
        </header>
        
        <div className="flex-1 p-8 flex items-center justify-center overflow-hidden z-10">
          <div className="relative p-1 bg-[#050505] border border-[#1f1f1f] shadow-2xl">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500 -translate-x-px -translate-y-px"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500 translate-x-px -translate-y-px"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500 -translate-x-px translate-y-px"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500 translate-x-px translate-y-px"></div>
            
            <HandTracker 
              hardwareAcceleration={hardwareAcceleration}
              bgExposure={bgExposure}
              confidence={confidence}
              effectColor={effectColor}
              showLandmarks={showLandmarks}
              showMask={showMask}
              posterizeLevels={posterizeLevels}
              dotSize={dotSize}
              glowIntensity={glowIntensity}
              showScanlines={showScanlines}
              effectStyle={effectStyle}
              xrayColors={xrayColors}
              motionBlur={motionBlur}
              bloomIntensity={bloomIntensity}
              chromaticAberration={chromaticAberration}
              filmGrain={filmGrain}
              r2Color={r2Color}
              r2ShowMask={r2ShowMask}
              r2PosterizeLevels={r2PosterizeLevels}
              r2DotSize={r2DotSize}
              r2GlowIntensity={r2GlowIntensity}
              r2ShowScanlines={r2ShowScanlines}
              r2EffectStyle={r2EffectStyle}
              r2XrayColors={r2XrayColors}
              r2MotionBlur={r2MotionBlur}
              r2BloomIntensity={r2BloomIntensity}
              r2ChromaticAberration={r2ChromaticAberration}
              r2FilmGrain={r2FilmGrain}
            />
          </div>
        </div>
        
        <footer className="h-16 shrink-0 bg-black border-t border-[#1a1a1a] px-8 flex items-center justify-between z-10">
          <div className="space-y-0.5">
            <p className="text-[9px] text-gray-600 uppercase tracking-widest font-sans">SYS_STATUS</p>
            <div className="flex gap-6 items-baseline">
              <div className="text-xs font-bold text-cyan-500 tracking-widest uppercase flex items-center gap-2">
                <span className="w-1 h-1 bg-cyan-500"></span>
                TRACKING_ENGAGED
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[9px] text-gray-600 uppercase tracking-widest font-sans">PROTOCOL</p>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">HND-TRK-09</p>
            </div>
            <div className="h-8 w-px bg-[#1a1a1a]"></div>
            <div className="font-mono text-cyan-500 font-bold text-xs tracking-widest">
              [OP_MODE: NPR]
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
