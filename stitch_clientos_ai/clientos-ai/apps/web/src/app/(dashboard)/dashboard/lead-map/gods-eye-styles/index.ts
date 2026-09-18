// Visual style shaders adapted from God's Eye View (MIT License).
// See ATTRIBUTION.md in this directory for details.
import { thermalShader } from './thermal.js';
import { nightVisionShader } from './surveillance.js';
import { retroShader } from './retro.js';
import { noirShader } from './noir.js';
import { snowShader } from './snow.js';
import { animeShader } from './anime.js';

export interface VisualStyleUniformMeta {
  default: number;
  min: number;
  max: number;
  label: string;
}

export interface VisualStyleShader {
  name: string;
  uniforms?: Record<string, VisualStyleUniformMeta>;
  fragmentShader: string;
}

export type VisualMode = 'normal' | 'thermal' | 'nightVision' | 'retro' | 'noir' | 'snow' | 'anime';

export const VISUAL_STYLES: Record<Exclude<VisualMode, 'normal'>, VisualStyleShader> = {
  thermal: thermalShader,
  nightVision: nightVisionShader,
  retro: retroShader,
  noir: noirShader,
  snow: snowShader,
  anime: animeShader,
};

export const VISUAL_MODE_OPTIONS: { value: VisualMode; label: string; icon: string }[] = [
  { value: 'normal', label: 'Normal', icon: '🌐' },
  { value: 'thermal', label: 'FLIR', icon: '🔥' },
  { value: 'nightVision', label: 'NVG', icon: '🟢' },
  { value: 'retro', label: 'CRT', icon: '📺' },
  { value: 'noir', label: 'Noir', icon: '🎬' },
  { value: 'snow', label: 'Snow', icon: '❄️' },
  { value: 'anime', label: 'Anime', icon: '🎨' },
];
