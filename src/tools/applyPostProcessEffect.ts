import { useMapStore } from '@/store/mapStore';
import { ToolFunction, ToolCall } from './types';
import { z } from 'zod';

export const applyPostProcessEffectSchema = {
  description:
    "Apply post-process visual effects to the map visualization including brightness, contrast, sepia, vignette, ink, and noise. Effects are additive - they merge with existing effects. To remove an effect, set it to 0. Use reset: true to clear all effects first.",
  inputSchema: z.object({
    brightness: z
      .number()
      .gte(-1)
      .lte(1)
      .optional()
      .describe(
        "Brightness adjustment (-1 to 1). Set to 0 to remove brightness effect"
      ),
    contrast: z
      .number()
      .gte(-1)
      .lte(1)
      .optional()
      .describe(
        "Contrast adjustment (-1 to 1). Set to 0 to remove contrast effect"
      ),
    sepia: z
      .number()
      .nonnegative()
      .lte(1)
      .optional()
      .describe(
        "Sepia tone effect (0 to 1). Set to 0 to remove sepia"
      ),
    vignetteSize: z
      .number()
      .nonnegative()
      .lte(1)
      .optional()
      .describe(
        "Vignette size (0 to 1). Set to 0 to remove vignette"
      ),
    vignetteAmount: z
      .number()
      .nonnegative()
      .lte(1)
      .optional()
      .describe(
        "Vignette intensity (0 to 1). Set to 0 to remove vignette"
      ),
    ink: z
      .number()
      .nonnegative()
      .lte(1)
      .optional()
      .describe(
        "Ink effect strength (0 to 1). Set to 0 to remove ink effect"
      ),
    noise: z
      .number()
      .nonnegative()
      .lte(1)
      .optional()
      .describe(
        "Noise amount (0 to 1). Set to 0 to remove noise"
      ),
    reset: z
      .boolean()
      .optional()
      .describe(
        "Set to true to clear all existing effects before applying new ones"
      ),
  }),
};

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
  } = applyPostProcessEffectSchema.inputSchema.parse(toolCall.input);

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
