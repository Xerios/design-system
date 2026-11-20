// Tick marks for a slider's stops (Slider, RangeSlider): drawn under the track when there are few enough stops to tell
// apart and to aim for (a rating of 1–5, years 0–10, a range in tens), left out when they would only draw a comb.

/** The most stops a slider shows ticks for with `ticks: 'auto'`: 11, such as 0–10, or 0–100 in tens. */
export const MAX_TICKS = 11

/**
 * The values a slider's ticks mark: every stop from min to max (and max itself when the range isn't a whole number of
 * steps). With 'auto', only when there are 3 to MAX_TICKS of them; with true, always (up to 200); with false, none.
 * @param {number} min
 * @param {number} max
 * @param {number} step
 * @param {'auto' | boolean} [ticks]
 * @returns {number[]}
 */
export function sliderTicks(min, max, step, ticks = 'auto') {
  if (!ticks || !(step > 0) || !(max > min)) return []
  const whole = Math.floor((max - min) / step + 1e-9)
  const count = whole + 1 + ((max - min) / step - whole > 1e-9 ? 1 : 0)
  if (count > (ticks === 'auto' ? MAX_TICKS : 200) || count < 3) return []
  const values = Array.from({ length: whole + 1 }, (_, i) => min + i * step)
  if (count > whole + 1) values.push(max)
  return values
}
