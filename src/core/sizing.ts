/**
 * Sizing arithmetic taken from the KATA assumptions (A1-A10, A8, A9).
 * Pure functions only: no I/O, no time, so they are easy to test.
 */

/** A1: sampling interval in seconds. */
export const SAMPLE_INTERVAL_S = 10;

/** A2: metrics collected per machine at each sampling. */
export const METRICS_PER_MACHINE = 50;

/** A4: average raw sample size in bytes. */
export const SAMPLE_BYTES = 32;

/** A9: replay cap per site, in bits per second. */
export const REPLAY_CAP_BITS_PER_S = 5_000_000;

/** Samples per second produced by one machine. */
export function samplesPerSecondPerMachine(
  metrics: number = METRICS_PER_MACHINE,
  intervalS: number = SAMPLE_INTERVAL_S,
): number {
  if (metrics < 0 || intervalS <= 0) {
    throw new RangeError("metrics must be >= 0 and interval must be > 0");
  }
  return metrics / intervalS;
}

/** Samples per second for a fleet of machines (A2, A3). */
export function fleetSamplesPerSecond(machines: number): number {
  if (machines < 0) {
    throw new RangeError("machines must be >= 0");
  }
  return machines * samplesPerSecondPerMachine();
}

/** Raw bytes per second for a given samples-per-second rate (A4). */
export function rawBytesPerSecond(samplesPerSecond: number): number {
  return samplesPerSecond * SAMPLE_BYTES;
}

/** Samples per second that the replay cap allows (A9). */
export function replaySamplesPerSecond(): number {
  return Math.floor(REPLAY_CAP_BITS_PER_S / 8 / SAMPLE_BYTES);
}

/**
 * Raw bytes needed to buffer an outage at a given live rate (A8).
 * Example: 2 h at 1,000 samples/s is about 230 MB.
 */
export function outageBufferBytes(outageHours: number, samplesPerSecond: number): number {
  if (outageHours < 0 || samplesPerSecond < 0) {
    throw new RangeError("outage and rate must be >= 0");
  }
  return outageHours * 3600 * samplesPerSecond * SAMPLE_BYTES;
}

/**
 * Hours a buffer of the given size can hold at a given live rate.
 */
export function bufferHoursAtRate(bufferBytes: number, samplesPerSecond: number): number {
  if (bufferBytes < 0 || samplesPerSecond <= 0) {
    throw new RangeError("buffer must be >= 0 and rate must be > 0");
  }
  return bufferBytes / SAMPLE_BYTES / samplesPerSecond / 3600;
}

/**
 * Seconds to drain a backlog while live traffic shares the replay cap (A9).
 * Net drain rate is the replay rate minus live traffic.
 */
export function drainSeconds(backlogSamples: number, liveSamplesPerSecond: number): number {
  const net = replaySamplesPerSecond() - liveSamplesPerSecond;
  if (net <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  return backlogSamples / net;
}
