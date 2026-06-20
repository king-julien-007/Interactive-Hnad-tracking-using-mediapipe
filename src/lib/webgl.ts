export class WebGLProcessor {
  gl: WebGLRenderingContext | null = null;
  program: WebGLProgram | null = null;
  canvas: HTMLCanvasElement;
  texture: WebGLTexture | null = null;
  positionBuffer: WebGLBuffer | null = null;
  texCoordBuffer: WebGLBuffer | null = null;
  
  uniformLocations: Record<string, WebGLUniformLocation | null> = {};

  constructor() {
    this.canvas = document.createElement('canvas');
    this.gl = this.canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false });
    
    if (!this.gl) {
      console.warn('WebGL not supported');
      return;
    }

    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      
      uniform sampler2D u_image;
      uniform vec2 u_resolution; 
      uniform vec2 u_offset;
      
      uniform int u_effectStyle; 
      uniform vec3 u_tint;
      uniform vec3 u_c0;
      uniform vec3 u_c1;
      uniform vec3 u_c2;
      uniform vec3 u_c3;
      uniform float u_dotSize;
      uniform float u_posterizeLevels;
      uniform float u_chromaticAberration;
      uniform float u_filmGrain;
      uniform float u_time;
      
      float noise(vec2 co){ return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }

      vec3 getColor(vec2 coord) {
        vec4 color = texture2D(u_image, coord);
        float r = color.r; float g = color.g; float b = color.b;
        float luma = (r * 0.299 + g * 0.587 + b * 0.114);
        
        if (u_effectStyle == 3) {
          // Dither using ordered noise
          vec2 px = coord * u_resolution + u_offset;
          float x = mod(px.x, 4.0);
          float y = mod(px.y, 4.0);
          float m = mod((x + y * 2.0), 4.0) / 4.0;
          float ditheredLuma = clamp(luma + (m - 0.5) / max(2.0, u_posterizeLevels), 0.0, 1.0);
          
          if (ditheredLuma < 0.33333) {
            return mix(u_c0, u_c1, ditheredLuma * 3.0);
          } else if (ditheredLuma < 0.66666) {
            return mix(u_c1, u_c2, (ditheredLuma - 0.33333) * 3.0);
          } else {
            return mix(u_c2, u_c3, (ditheredLuma - 0.66666) * 3.0);
          }
        } else if (u_effectStyle == 1) { 
          // X-Ray
          float invLuma = clamp(1.0 - luma, 0.0, 1.0);
          float contrastLuma = pow(invLuma, 1.5);
          
          if (contrastLuma < 0.33333) {
            return mix(u_c0, u_c1, contrastLuma * 3.0);
          } else if (contrastLuma < 0.66666) {
            return mix(u_c1, u_c2, (contrastLuma - 0.33333) * 3.0);
          } else {
            return mix(u_c2, u_c3, (contrastLuma - 0.66666) * 3.0);
          }
        } else if (u_effectStyle == 2) {
          // LED Matrix Mode
          vec2 px = coord * u_resolution + u_offset;
          float cellX = mod(px.x, u_dotSize) - (u_dotSize / 2.0);
          float cellY = mod(px.y, u_dotSize) - (u_dotSize / 2.0);
          
          // distance from center of cell
          // For square LED, use max(abs(x), abs(y))
          float dist = max(abs(cellX), abs(cellY));
          float ledEdge = (u_dotSize / 2.0) - 1.0; // 1px padding between LEDs
          
          if (dist > ledEdge) {
            return vec3(0.0, 0.0, 0.0); // Black gap
          }
          
          // Sample color from the center of the LED cell
          vec2 cellCenterCoord = floor((coord * u_resolution + u_offset) / u_dotSize) * u_dotSize + (u_dotSize / 2.0);
          cellCenterCoord = (cellCenterCoord - u_offset) / u_resolution;
          vec4 cellColor = texture2D(u_image, cellCenterCoord);
          float cellLuma = (cellColor.r * 0.299 + cellColor.g * 0.587 + cellColor.b * 0.114);
          
          // Animate the glow slightly with time
          float timeGlow = (sin(u_time * 0.005 + cellLuma * 10.0) * 0.5 + 0.5) * 0.3 + 0.7; // Pulse between 0.7 and 1.0
          
          // Quantize luma
          float normalizedPosterize = max(1.0, u_posterizeLevels);
          float pLuma = floor(cellLuma * 255.0);
          float stepSize = 255.0 / normalizedPosterize;
          float quantLuma = floor(pLuma / stepSize) * stepSize / 255.0; 
          
          if (quantLuma < 0.1) {
            return u_tint * 0.05; // tiny glow for disabled LEDs
          }
          
          vec3 outCol;
          if (quantLuma < 0.33333) {
            outCol = mix(u_c0, u_c1, quantLuma * 3.0);
          } else if (quantLuma < 0.66666) {
            outCol = mix(u_c1, u_c2, (quantLuma - 0.33333) * 3.0);
          } else {
            outCol = mix(u_c2, u_c3, (quantLuma - 0.66666) * 3.0);
          }
          outCol *= timeGlow;
          return outCol;

        } else { 
          // Halftone
          float normalizedPosterize = max(1.0, u_posterizeLevels);
          // To match CPU behavior: lumaLevel = floor(luma * 255 / (255/posterizeLevels)) * (255/posterizeLevels)
          // Simplified:
          float pLuma = floor(luma * 255.0);
          float stepSize = 255.0 / normalizedPosterize;
          float lumaLevel = floor(pLuma / stepSize) * stepSize / 255.0; 
          
          vec3 outColor;
          if (lumaLevel * 255.0 < 85.0) { 
            outColor = u_tint * 0.5;
          } else {
            outColor = clamp(u_tint * 1.5 + vec3(r,g,b) * 0.3, 0.0, 1.0);
          }
          
          float radius = (1.0 - lumaLevel) * (u_dotSize * 0.6);
          
          vec2 px = coord * u_resolution + u_offset;
          float cellX = mod(px.x, u_dotSize) - (u_dotSize / 2.0);
          float cellY = mod(px.y, u_dotSize) - (u_dotSize / 2.0);
          
          if (cellX * cellX + cellY * cellY < radius * radius) {
             outColor = u_tint * 0.1;
          }
          return outColor;
        }
      }

      void main() {
        vec3 finalColor;
        if (u_chromaticAberration > 0.0) {
          float shiftX = (u_chromaticAberration / 100.0) * 20.0 / u_resolution.x;
          float r = getColor(vec2(clamp(v_texCoord.x - shiftX, 0.0, 1.0), v_texCoord.y)).r;
          float g = getColor(v_texCoord).g;
          float b = getColor(vec2(clamp(v_texCoord.x + shiftX, 0.0, 1.0), v_texCoord.y)).b;
          finalColor = clamp(vec3(r, g, b) * 1.2, 0.0, 1.0);
        } else {
          finalColor = clamp(getColor(v_texCoord) * 1.2, 0.0, 1.0);
        }
        
        if (u_filmGrain > 0.0) {
          float n = noise((v_texCoord * u_resolution + u_offset) * (u_time + 1.0));
          // Mix noise towards black or additive depending on effect
          float grainAmount = u_filmGrain / 100.0 * 0.4; // max 40%
          finalColor = finalColor - (n * grainAmount) + (grainAmount * 0.5);
          finalColor = clamp(finalColor, 0.0, 1.0);
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const gl = this.gl;
    const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource);
    
    if (!vertexShader || !fragmentShader) return;

    this.program = gl.createProgram();
    if (!this.program) return;
    
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);
    gl.useProgram(this.program);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1, 1,   1, -1,   1, 1
    ]), gl.STATIC_DRAW);

    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,  1, 0,  0, 1,
      0, 1,  1, 0,  1, 1
    ]), gl.STATIC_DRAW);

    const uniforms = [
      'u_image', 'u_resolution', 'u_offset', 'u_effectStyle',
      'u_tint', 'u_c0', 'u_c1', 'u_c2', 'u_c3', 'u_dotSize',
      'u_posterizeLevels', 'u_chromaticAberration', 'u_filmGrain', 'u_time'
    ];
    
    uniforms.forEach(u => {
      this.uniformLocations[u] = gl.getUniformLocation(this.program!, u);
    });

    this.texture = gl.createTexture();
  }

  private loadShader(type: number, source: string) {
    const gl = this.gl;
    if (!gl) return null;
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  process(
    video: HTMLVideoElement | HTMLCanvasElement, 
    minX: number, minY: number, w: number, h: number,
    config: any
  ): HTMLCanvasElement | null {
    const gl = this.gl;
    if (!gl || !this.program) return null;

    // We can draw the full video sub-region onto a smaller canvas then pass to WebGL,
    // OR upload the whole video and specify texture coordinates.
    // For simplicity, we just use a temporary 2D canvas to crop the image, then pass to WebGL.
    // WebGL texture uploads from large video elements every frame are slow if you only need a small rect,
    // but the 2D drawImage handles the crop extremely fast.
    
    // Instead of generating a temp canvas here, we can actually just generate a small temp canvas.
    if (!this._tempCanvas) {
       this._tempCanvas = document.createElement('canvas');
       this._tempCtx = this._tempCanvas.getContext('2d');
    }
    
    if (this._tempCanvas.width !== w || this._tempCanvas.height !== h) {
       this._tempCanvas.width = w;
       this._tempCanvas.height = h;
    }
    
    this._tempCtx!.drawImage(video, minX, minY, w, h, 0, 0, w, h);

    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      gl.viewport(0, 0, w, h);
    }

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._tempCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.useProgram(this.program);

    const posAttr = gl.getAttribLocation(this.program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const texAttr = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.enableVertexAttribArray(texAttr);
    gl.vertexAttribPointer(texAttr, 2, gl.FLOAT, false, 0, 0);

    const parseHex = (hex: string) => {
      let cached = (this as any)._hexCache?.[hex];
      if (cached) return cached;
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      cached = result ? [
        parseInt(result[1], 16) / 255.0,
        parseInt(result[2], 16) / 255.0,
        parseInt(result[3], 16) / 255.0
      ] : [1, 1, 1];
      if (!(this as any)._hexCache) (this as any)._hexCache = {};
      (this as any)._hexCache[hex] = cached;
      return cached;
    };

    gl.uniform2f(this.uniformLocations['u_resolution'], w, h);
    gl.uniform2f(this.uniformLocations['u_offset'], minX, minY);
    let styleInt = 0;
    if (config.effectStyle === 'xray') styleInt = 1;
    else if (config.effectStyle === 'led') styleInt = 2;
    else if (config.effectStyle === 'dither') styleInt = 3;
    gl.uniform1i(this.uniformLocations['u_effectStyle'], styleInt);
    gl.uniform3fv(this.uniformLocations['u_tint'], parseHex(config.color));
    
    if (config.xrayColors && config.xrayColors.length === 4) {
      gl.uniform3fv(this.uniformLocations['u_c0'], parseHex(config.xrayColors[0]));
      gl.uniform3fv(this.uniformLocations['u_c1'], parseHex(config.xrayColors[1]));
      gl.uniform3fv(this.uniformLocations['u_c2'], parseHex(config.xrayColors[2]));
      gl.uniform3fv(this.uniformLocations['u_c3'], parseHex(config.xrayColors[3]));
    } else {
      gl.uniform3fv(this.uniformLocations['u_c0'], [0,0,0]);
      gl.uniform3fv(this.uniformLocations['u_c1'], parseHex(config.color));
      gl.uniform3fv(this.uniformLocations['u_c2'], parseHex(config.color));
      gl.uniform3fv(this.uniformLocations['u_c3'], [1,1,1]);
    }
    
    gl.uniform1f(this.uniformLocations['u_dotSize'], config.dotSize || 6.0);
    gl.uniform1f(this.uniformLocations['u_posterizeLevels'], config.posterizeLevels || 6.0);
    gl.uniform1f(this.uniformLocations['u_chromaticAberration'], config.chromaticAberration || 0.0);
    gl.uniform1f(this.uniformLocations['u_filmGrain'], config.filmGrain || 0.0);
    gl.uniform1f(this.uniformLocations['u_time'], performance.now() % 10000.0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    return this.canvas;
  }
  
  private _tempCanvas: HTMLCanvasElement | null = null;
  private _tempCtx: CanvasRenderingContext2D | null = null;
}
