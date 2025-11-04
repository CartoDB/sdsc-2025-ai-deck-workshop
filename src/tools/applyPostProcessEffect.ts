import { useMapStore } from '@/store/mapStore';
import { ToolFunction, ToolCall } from './types';
import { z } from 'zod';
import { PostProcessEffect } from '@deck.gl/core';
import { brightnessContrast, noise, sepia, vignette, ink } from '@luma.gl/effects';

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
    sepia: sepiaValue,
    vignetteSize,
    vignetteAmount,
    ink: inkValue,
    noise: noiseValue,
    reset
  } = applyPostProcessEffectSchema.inputSchema.parse(toolCall.input);

  // Build array of actual luma.gl effects
  const effects: PostProcessEffect[] = [];
  const appliedEffects: string[] = [];

  if (!reset) {
    // Get existing effects if not resetting
    const existingEffects = useMapStore.getState().postProcessEffects || [];
    effects.push(...existingEffects);
  }

  // Add brightness/contrast effect
  if (brightness !== undefined || contrast !== undefined) {
    effects.push(
      new PostProcessEffect(brightnessContrast, {
        brightness: brightness ?? 0,
        contrast: contrast ?? 0,
      })
    );
    if (brightness !== undefined) appliedEffects.push(`brightness: ${brightness}`);
    if (contrast !== undefined) appliedEffects.push(`contrast: ${contrast}`);
  }

  // Add sepia effect
  if (sepiaValue !== undefined && sepiaValue > 0) {
    effects.push(new PostProcessEffect(sepia, { amount: sepiaValue }));
    appliedEffects.push(`sepia: ${sepiaValue}`);
  }

  // Add vignette effect
  if ((vignetteSize !== undefined && vignetteSize > 0) || (vignetteAmount !== undefined && vignetteAmount > 0)) {
    effects.push(
      new PostProcessEffect(vignette, {
        size: vignetteSize ?? 0.5,
        amount: vignetteAmount ?? 0.5,
      })
    );
    if (vignetteSize !== undefined) appliedEffects.push(`vignette size: ${vignetteSize}`);
    if (vignetteAmount !== undefined) appliedEffects.push(`vignette amount: ${vignetteAmount}`);
  }

  // Add ink effect
  if (inkValue !== undefined && inkValue > 0) {
    effects.push(new PostProcessEffect(ink, { strength: inkValue }));
    appliedEffects.push(`ink: ${inkValue}`);
  }

  // Add noise effect
  if (noiseValue !== undefined && noiseValue > 0) {
    effects.push(new PostProcessEffect(noise, { amount: noiseValue }));
    appliedEffects.push(`noise: ${noiseValue}`);
  }

  // Update store with built effects
  useMapStore.getState().setPostProcessEffects(effects.length > 0 ? effects : undefined);

  return appliedEffects.length > 0
    ? `Successfully applied post-process effects: ${appliedEffects.join(', ')}`
    : 'Post-process effects reset to defaults';
};
