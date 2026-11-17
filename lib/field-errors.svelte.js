/**
 * The error messages of a form, field by field, with the blur-first timing built in: a field is checked when
 * it is left, and its message goes as soon as it is edited. Name each field once:
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

  /** @param {Key} key */
  function check(key) {
    const found = validate()[key]
    if (found) errors[key] = found
    else delete errors[key]
  }
  /** @param {Key} key */
  function clear(key) {
    delete errors[key]
  }

  return {
    get errors() {
      return errors
    },
    check,
    clear,
    validate() {
      errors = validate()
      return Object.keys(errors).length === 0
    },
    /** @param {E | null | undefined} next */
    set(next) {
      errors = next ?? /** @type {E} */ ({})
    },
    reset() {
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
