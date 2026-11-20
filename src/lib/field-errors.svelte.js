import { announce, cancelAnnouncement } from './announce.js'

/**
 * The error messages of a form, field by field, with submit-first timing built in: nothing is checked until the
 * form is validated (its submit or action button). After that a field is checked again when it is left, and its
 * message goes as soon as it is edited. Leaving an untouched field never shows an error. Name each field once:
 *
 *   const form = fieldErrors(() => validate(values));   // validate returns { [field]: message } for what failed
 *
 *   <TextField bind:value={values.name} id="name" label="Name" {...form.field('name')} />
 *   <div {@attach form.group('address')}> …several controls sharing one check… </div>
 *
 *   if (!form.validate()) return;   // on submit: checks everything, false if anything failed
 *
 * field(key): props to spread on a TextField or TextArea: its `error`, plus the blur and input handlers.
 * group(key): attachment for an element wrapping several controls; checks `key` when the focus leaves the
 *   element, clears it on any input inside. Show the messages with `error={form.errors.key}` or ErrorMessage.
 * errors: the current messages (reactive). check(key) / clear(key): one field by hand, for controls that are
 *   not inputs. validate(): every field. set(errors): messages from elsewhere, e.g. the server. reset(): none.
 *
 * With a typed `validate`, the keys are checked: a misspelt field name is a type error.
 *
 * @template {object} E
 * @param {() => E} validate
 */
export function fieldErrors(validate) {
  /** @typedef {keyof E & string} Key */
  let errors = $state(/** @type {E} */ ({}))
  // Whether validate() has run since the last reset: only then does leaving a field check it.
  let validated = false

  /** @param {Key} key */
  function check(key) {
    if (!validated) return
    const found = validate()[key]
    // A message that appears as the field is left is read out (after a pause, so it follows the next field's name).
    if (found && found !== errors[key]) announce(String(found))
    if (found) errors[key] = found
    else delete errors[key]
  }
  /** @param {Key} key */
  function clear(key) {
    if (errors[key]) cancelAnnouncement()
    delete errors[key]
  }

  return {
    get errors() {
      return errors
    },
    check,
    clear,
    validate() {
      validated = true
      errors = validate()
      return Object.keys(errors).length === 0
    },
    /** @param {E | null | undefined} next */
    set(next) {
      errors = next ?? /** @type {E} */ ({})
    },
    reset() {
      validated = false
      errors = /** @type {E} */ ({})
    },
    /** @param {Key} key */
    field(key) {
      return { error: errors[key], onblur: () => check(key), oninput: () => clear(key) }
    },
    /** @param {Key} key */
    group(key) {
      /** @param {HTMLElement} node */
      return (node) => {
        /** @param {FocusEvent} event */
        const left = (event) => {
          if (event.relatedTarget instanceof Node && node.contains(event.relatedTarget)) return
          check(key)
        }
        const edited = () => clear(key)
        node.addEventListener('focusout', left)
        node.addEventListener('input', edited)
        return () => {
          node.removeEventListener('focusout', left)
          node.removeEventListener('input', edited)
        }
      }
    },
  }
}
