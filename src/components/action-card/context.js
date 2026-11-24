// What an ActionCard hands the actions inside it, so each knows whether to show its label or only its icon.

/**
 * @typedef {object} ActionCardContext
 * @property {boolean} labels the actions show their labels beside their icons (false: icon only, the label in a tooltip)
 */

export const ACTION_CARD = Symbol('action-card')
