import { useMapStore } from '@/store/mapStore';
import { ToolFunction, ToolCall } from './types';

export const applyPostProcessEffect: ToolFunction = (toolCall: ToolCall): string => {
  console.log('[applyPostProcessEffect] Executing tool client-side');

  const {
    brightness,
    contrast,
    sepia,
    vignetteSize,
    vignetteAmount,
    ink,
    noise,
    reset
  } = toolCall.input as {
    brightness?: number;
    contrast?: number;
    sepia?: number;
    vignetteSize?: number;
    vignetteAmount?: number;
    ink?: number;
    noise?: number;
    reset?: boolean;
  };

  // Validate input ranges
  if (brightness !== undefined && (brightness < -1 || brightness > 1)) {
    return `Invalid brightness value: ${brightness}. Must be between -1 and 1 (default: 0)`;
  }

  if (contrast !== undefined && (contrast < -1 || contrast > 1)) {
    return `Invalid contrast value: ${contrast}. Must be between -1 and 1 (default: 0)`;
  }

  if (sepia !== undefined && (sepia < 0 || sepia > 1)) {
    return `Invalid sepia value: ${sepia}. Must be between 0 and 1 (default: 0.5)`;
  }

  if (vignetteSize !== undefined && (vignetteSize < 0 || vignetteSize > 1)) {
    return `Invalid vignette size: ${vignetteSize}. Must be between 0 and 1 (default: 0.5)`;
  }

  if (vignetteAmount !== undefined && (vignetteAmount < 0 || vignetteAmount > 1)) {
    return `Invalid vignette amount: ${vignetteAmount}. Must be between 0 and 1 (default: 0.5)`;
  }

  if (ink !== undefined && (ink < 0 || ink > 1)) {
    return `Invalid ink value: ${ink}. Must be between 0 and 1 (default: 0.25)`;
  }

  if (noise !== undefined && (noise < 0 || noise > 1)) {
    return `Invalid noise value: ${noise}. Must be between 0 and 1 (default: 0.5)`;
  }

  // If reset is true, clear all existing effects first
  const existingEffects = reset ? {} : (useMapStore.getState().postProcessEffect || {});

  const effectParams: any = { ...existingEffects };

  // Set or remove effects based on values
  // Use null to explicitly remove an effect
  if (brightness !== undefined) {
    if (brightness === 0) {
      delete effectParams.brightness;
    } else {
      effectParams.brightness = brightness;
    }
  }
  if (contrast !== undefined) {
    if (contrast === 0) {
      delete effectParams.contrast;
    } else {
      effectParams.contrast = contrast;
    }
  }
  if (sepia !== undefined) {
    if (sepia === 0) {
      delete effectParams.sepia;
    } else {
      effectParams.sepia = sepia;
    }
  }
  if (vignetteSize !== undefined || vignetteAmount !== undefined) {
    effectParams.vignette = {
      ...(existingEffects.vignette || {}),
      ...(vignetteSize !== undefined && { size: vignetteSize }),
      ...(vignetteAmount !== undefined && { amount: vignetteAmount })
    };
    // Remove vignette if both are 0
    if (effectParams.vignette.size === 0 && effectParams.vignette.amount === 0) {
      delete effectParams.vignette;
    }
  }
  if (ink !== undefined) {
    if (ink === 0) {
      delete effectParams.ink;
    } else {
      effectParams.ink = ink;
    }
  }
  if (noise !== undefined) {
    if (noise === 0) {
      delete effectParams.noise;
    } else {
      effectParams.noise = noise;
    }
  }

  // Use Zustand store to set the post-process effect parameters
  useMapStore.getState().setPostProcessEffect(Object.keys(effectParams).length > 0 ? effectParams : undefined);

  const effects: string[] = [];
  if (brightness !== undefined) effects.push(`brightness: ${brightness}`);
  if (contrast !== undefined) effects.push(`contrast: ${contrast}`);
  if (sepia !== undefined) effects.push(`sepia: ${sepia}`);
  if (vignetteSize !== undefined) effects.push(`vignette size: ${vignetteSize}`);
  if (vignetteAmount !== undefined) effects.push(`vignette amount: ${vignetteAmount}`);
  if (ink !== undefined) effects.push(`ink: ${ink}`);
  if (noise !== undefined) effects.push(`noise: ${noise}`);

  return effects.length > 0
    ? `Successfully applied post-process effects: ${effects.join(', ')}`
    : 'Post-process effects reset to defaults';
};
