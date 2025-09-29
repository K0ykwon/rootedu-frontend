import { parse, format, addMinutes, differenceInMinutes } from 'date-fns';
import type { SubjectPlan } from '@/lib/types/study-plan';

export const PIXELS_PER_HOUR = 80; // Reduced from 150 to 80 for better overview
export const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
export const SNAP_INTERVAL_MINUTES = 15;

/**
 * Convert pixel position to time string
 */
export function pixelsToTime(pixels: number, timelineStartTime: string): string {
  const startDate = parse(timelineStartTime, 'HH:mm', new Date());
  const minutesFromStart = Math.round(pixels / PIXELS_PER_MINUTE);
  const resultDate = addMinutes(startDate, minutesFromStart);
  return format(resultDate, 'HH:mm');
}

/**
 * Convert time string to pixel position
 */
export function timeToPixels(time: string, timelineStartTime: string): number {
  const startDate = parse(timelineStartTime, 'HH:mm', new Date());
  const timeDate = parse(time, 'HH:mm', new Date());
  const minutesFromStart = differenceInMinutes(timeDate, startDate);
  return minutesFromStart * PIXELS_PER_MINUTE;
}

/**
 * Snap time to nearest interval (default 15 minutes)
 */
export function snapTimeToGrid(time: string, intervalMinutes: number = SNAP_INTERVAL_MINUTES): string {
  const date = parse(time, 'HH:mm', new Date());
  const minutes = date.getMinutes();
  const hours = date.getHours();

  const snappedMinutes = Math.round(minutes / intervalMinutes) * intervalMinutes;

  if (snappedMinutes === 60) {
    return format(new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours + 1, 0), 'HH:mm');
  }

  return format(new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, snappedMinutes), 'HH:mm');
}

/**
 * Calculate duration in minutes between two times
 */
export function getTimeDuration(startTime: string, endTime: string): number {
  const startDate = parse(startTime, 'HH:mm', new Date());
  const endDate = parse(endTime, 'HH:mm', new Date());
  return differenceInMinutes(endDate, startDate);
}

/**
 * Check if two time blocks overlap
 */
export function doBlocksOverlap(block1: Pick<SubjectPlan, 'startTime' | 'endTime'>, block2: Pick<SubjectPlan, 'startTime' | 'endTime'>): boolean {
  const start1 = parse(block1.startTime, 'HH:mm', new Date());
  const end1 = parse(block1.endTime, 'HH:mm', new Date());
  const start2 = parse(block2.startTime, 'HH:mm', new Date());
  const end2 = parse(block2.endTime, 'HH:mm', new Date());

  return start1 < end2 && start2 < end1;
}

/**
 * Find conflicts when moving a block to new time
 */
export function findTimeConflicts(
  movingBlock: SubjectPlan,
  newStartTime: string,
  newEndTime: string,
  allBlocks: SubjectPlan[]
): SubjectPlan[] {
  const conflicts: SubjectPlan[] = [];
  const newBlock = { startTime: newStartTime, endTime: newEndTime };

  for (const block of allBlocks) {
    if (block.id === movingBlock.id) continue;

    if (doBlocksOverlap(newBlock, block)) {
      conflicts.push(block);
    }
  }

  return conflicts;
}

/**
 * Calculate new times when dragging a block
 */
export function calculateNewTimes(
  originalBlock: SubjectPlan,
  deltaPixels: number,
  timelineStartTime: string
): { startTime: string; endTime: string } {
  const duration = getTimeDuration(originalBlock.startTime, originalBlock.endTime);

  const originalStartPixels = timeToPixels(originalBlock.startTime, timelineStartTime);
  const newStartPixels = originalStartPixels + deltaPixels;

  const rawNewStartTime = pixelsToTime(newStartPixels, timelineStartTime);
  const snappedNewStartTime = snapTimeToGrid(rawNewStartTime);

  const newStartDate = parse(snappedNewStartTime, 'HH:mm', new Date());
  const newEndDate = addMinutes(newStartDate, duration);
  const newEndTime = format(newEndDate, 'HH:mm');

  return {
    startTime: snappedNewStartTime,
    endTime: newEndTime
  };
}

/**
 * Calculate new times when resizing a block with pixel deltas
 */
export function calculateResizedTimes(
  originalBlock: SubjectPlan,
  resizeFromTop: boolean,
  heightDelta: number,
  topDelta: number,
  timelineStartTime: string,
  minDurationMinutes: number = 15
): { startTime: string; endTime: string } | null {
  console.log('🔍 calculateResizedTimes called:', {
    originalBlock: {
      id: originalBlock.id,
      subject: originalBlock.subject,
      startTime: originalBlock.startTime,
      endTime: originalBlock.endTime
    },
    resizeFromTop,
    heightDelta,
    topDelta,
    timelineStartTime,
    minDurationMinutes
  });

  if (resizeFromTop) {
    // Resizing from top - change start time based on top position change
    const startMinutesDelta = Math.round(topDelta / PIXELS_PER_MINUTE);
    const originalStartDate = parse(originalBlock.startTime, 'HH:mm', new Date());
    const newStartDate = addMinutes(originalStartDate, startMinutesDelta);
    const newStartTime = snapTimeToGrid(format(newStartDate, 'HH:mm'));

    console.log('🔍 Top resize calculation:', {
      startMinutesDelta,
      originalStartTime: originalBlock.startTime,
      newStartTime,
      endTime: originalBlock.endTime
    });

    // Validate time boundaries
    if (!isTimeWithinBounds(newStartTime, '00:00', '23:59')) {
      console.log('❌ Top resize: new start time out of bounds:', newStartTime);
      return null;
    }

    const duration = getTimeDuration(newStartTime, originalBlock.endTime);
    if (duration < minDurationMinutes) {
      console.log('❌ Top resize: duration too short:', duration, 'min');
      return null;
    }

    console.log('✅ Top resize successful:', { startTime: newStartTime, endTime: originalBlock.endTime });
    return {
      startTime: newStartTime,
      endTime: originalBlock.endTime
    };
  } else {
    // Resizing from bottom - change end time based on height change
    const endMinutesDelta = Math.round(heightDelta / PIXELS_PER_MINUTE);
    const originalEndDate = parse(originalBlock.endTime, 'HH:mm', new Date());
    const newEndDate = addMinutes(originalEndDate, endMinutesDelta);
    const newEndTime = snapTimeToGrid(format(newEndDate, 'HH:mm'));

    console.log('🔍 Bottom resize calculation:', {
      endMinutesDelta,
      originalEndTime: originalBlock.endTime,
      newEndTime,
      startTime: originalBlock.startTime,
      heightDelta,
      PIXELS_PER_MINUTE
    });

    // Validate time boundaries
    if (!isTimeWithinBounds(newEndTime, '00:01', '23:59')) {
      console.log('❌ Bottom resize: new end time out of bounds:', newEndTime);
      return null;
    }

    const duration = getTimeDuration(originalBlock.startTime, newEndTime);
    if (duration < minDurationMinutes) {
      console.log('❌ Bottom resize: duration too short:', duration, 'min');
      return null;
    }

    console.log('✅ Bottom resize successful:', { startTime: originalBlock.startTime, endTime: newEndTime });
    return {
      startTime: originalBlock.startTime,
      endTime: newEndTime
    };
  }
}

/**
 * Legacy function for backward compatibility - converts height delta to time changes
 */
export function calculateResizedTimesLegacy(
  originalBlock: SubjectPlan,
  resizeFromTop: boolean,
  deltaPixels: number,
  timelineStartTime: string,
  minDurationMinutes: number = 15
): { startTime: string; endTime: string } | null {
  // For legacy support, assume height delta = top delta when resizing from top
  const topDelta = resizeFromTop ? deltaPixels : 0;
  const heightDelta = resizeFromTop ? -deltaPixels : deltaPixels;

  return calculateResizedTimes(
    originalBlock,
    resizeFromTop,
    heightDelta,
    topDelta,
    timelineStartTime,
    minDurationMinutes
  );
}

/**
 * Validate if a time is within bounds
 */
export function isTimeWithinBounds(time: string, earliestTime: string, latestTime: string): boolean {
  const timeDate = parse(time, 'HH:mm', new Date());
  const earliestDate = parse(earliestTime, 'HH:mm', new Date());
  const latestDate = parse(latestTime, 'HH:mm', new Date());

  return timeDate >= earliestDate && timeDate <= latestDate;
}

/**
 * Validate time format (HH:mm)
 */
export function isValidTimeFormat(time: string): boolean {
  if (!time || typeof time !== 'string') return false;

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
  if (!timeRegex.test(time)) return false;

  try {
    const parsed = parse(time, 'HH:mm', new Date());
    return !isNaN(parsed.getTime());
  } catch {
    return false;
  }
}

/**
 * Validate time range (startTime < endTime)
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return false;
  }

  const startDate = parse(startTime, 'HH:mm', new Date());
  const endDate = parse(endTime, 'HH:mm', new Date());

  return startDate < endDate;
}

/**
 * Validate subject update request
 */
export function validateSubjectUpdate(updates: { startTime?: string; endTime?: string; content?: string; completed?: boolean }): { valid: boolean; error?: string } {
  // Validate time formats
  if (updates.startTime && !isValidTimeFormat(updates.startTime)) {
    return { valid: false, error: `Invalid start time format: ${updates.startTime}` };
  }

  if (updates.endTime && !isValidTimeFormat(updates.endTime)) {
    return { valid: false, error: `Invalid end time format: ${updates.endTime}` };
  }

  // Validate time range if both times are provided
  if (updates.startTime && updates.endTime) {
    if (!isValidTimeRange(updates.startTime, updates.endTime)) {
      return { valid: false, error: `Start time must be before end time: ${updates.startTime} >= ${updates.endTime}` };
    }
  }

  // Validate content length if provided
  if (updates.content !== undefined && typeof updates.content === 'string' && updates.content.length > 1000) {
    return { valid: false, error: 'Content too long (max 1000 characters)' };
  }

  // Validate completed flag
  if (updates.completed !== undefined && typeof updates.completed !== 'boolean') {
    return { valid: false, error: 'Completed must be a boolean value' };
  }

  return { valid: true };
}

/**
 * Auto-resolve conflicts by adjusting other blocks
 */
export function autoResolveConflicts(
  movingBlock: SubjectPlan,
  newStartTime: string,
  newEndTime: string,
  allBlocks: SubjectPlan[],
  timelineStartTime: string,
  timelineEndTime: string
): { success: boolean; updatedBlocks: SubjectPlan[]; conflicts: SubjectPlan[] } {
  const conflicts = findTimeConflicts(movingBlock, newStartTime, newEndTime, allBlocks);

  if (conflicts.length === 0) {
    return {
      success: true,
      updatedBlocks: allBlocks.map(block =>
        block.id === movingBlock.id
          ? { ...block, startTime: newStartTime, endTime: newEndTime }
          : block
      ),
      conflicts: []
    };
  }

  // For now, return conflicts without auto-resolution
  // TODO: Implement smart conflict resolution (push blocks, swap, etc.)
  return {
    success: false,
    updatedBlocks: allBlocks,
    conflicts
  };
}