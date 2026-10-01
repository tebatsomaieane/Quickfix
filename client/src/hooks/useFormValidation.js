import { useCallback, useState } from "react";
import { validate, fieldErrorsFromResponse } from "../lib/validation";

/**
 * Drives form validation state.
 *
 * The behaviour here is what separates a form that helps from one that nags:
 *
 *   - Errors never appear while a field is still being typed into for the first
 *     time. Marking an empty required field red the moment the page opens (or
 *     the moment the user types one character) reads as the app attacking them.
 *   - A field is validated on blur, and from then on live as it changes, so a
 *     correction is confirmed immediately.
 *   - Submitting always validates everything, then moves focus to the first
 *     problem and announces how many there are, so the fix is never a hunt.
 *   - A server rejection is mapped back onto the offending field rather than
 *     shown as a detached banner.
 */
export default function useFormValidation({ schema, initialValues }) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [formError, setFormError] = useState("");
    const [announcement, setAnnouncement] = useState("");

    const runValidation = useCallback(
        (next) => validate(next, schema),
        [schema]
    );

    const setValue = useCallback(
        (name, value) => {
            setValues((previous) => {
                const next = { ...previous, [name]: value };

                // Once a field has been judged, keep judging it as it changes.
                if (touched[name] || submitAttempted) {
                    setErrors((current) => {
                        const next = { ...current };
                        const found = validate({ [name]: value }, schema)[name];

                        if (found) {
                            next[name] = found;
                        } else {
                            delete next[name];
                        }

                        return next;
                    });
                }

                return next;
            });

            // A field-level error is now handled inline; clear the banner so the
            // user is not told about two different problems.
            setFormError("");
        },
        [schema, submitAttempted, touched]
    );

    const handleChange = useCallback(
        (event) => {
            const { name, value } = event.target;

            setValue(name, value);
        },
        [setValue]
    );

    const handleBlur = useCallback(
        (event) => {
            const { name, value } = event.target;

            setTouched((previous) => ({ ...previous, [name]: true }));
            setErrors((previous) => {
                const found = validate({ [name]: value }, schema)[name];

                if (found) {
                    return { ...previous, [name]: found };
                }

                const next = { ...previous };

                delete next[name];

                return next;
            });
        },
        [schema]
    );

    const focusField = useCallback((name) => {
        // Wait for the error text to paint before moving focus, so the field and
        // its message arrive together rather than focus landing on a clean field.
        requestAnimationFrame(() => {
            const element = document.querySelector(`[name="${name}"]`);

            if (element) {
                element.focus({ preventScroll: false });
                element.scrollIntoView({
                    block: "center",
                    behavior: "smooth"
                });
            }
        });
    }, []);

    /**
     * Validate everything. Returns true when the form is safe to submit.
     * The caller owns the actual request and its pending state.
     *
     * Values are passed in rather than read from a ref so the check always runs
     * against the state that is actually on screen.
     */
    const validateAll = useCallback(
        (currentValues) => {
            const found = runValidation(currentValues);

            setSubmitAttempted(true);
            setErrors(found);
            setTouched((previous) => {
                const next = { ...previous };

                for (const field of Object.keys(found)) {
                    next[field] = true;
                }

                return next;
            });

            const fields = Object.keys(found);

            if (fields.length > 0) {
                focusField(fields[0]);
                setAnnouncement(
                    fields.length === 1
                        ? "There is 1 problem with this form."
                        : `There are ${fields.length} problems with this form.`
                );
            } else {
                setAnnouncement("");
            }

            return fields.length === 0;
        },
        [focusField, runValidation]
    );

    /**
     * Turn an API rejection into per-field messages. The banner is used only
     * when the message cannot be attributed to a specific input.
     */
    const applyServerError = useCallback((error) => {
        const mapped = fieldErrorsFromResponse(error);
        const { form, ...fields } = mapped;

        if (Object.keys(fields).length > 0) {
            setErrors((previous) => ({ ...previous, ...fields }));
            setSubmitAttempted(true);
            setTouched((previous) => {
                const next = { ...previous };

                for (const field of Object.keys(fields)) {
                    next[field] = true;
                }

                return next;
            });

            const first = Object.keys(fields)[0];

            focusField(first);
            setAnnouncement(
                `Please correct the ${first.replace(/_/g, " ")} field.`
            );
        }

        setFormError(form || "");
    }, [focusField]);

    const reset = useCallback((nextValues = initialValues) => {
        setValues(nextValues);
        setErrors({});
        setTouched({});
        setSubmitAttempted(false);
        setFormError("");
        setAnnouncement("");
    }, [initialValues]);

    return {
        values,
        errors,
        formError,
        announcement,
        touched,
        setValue,
        setFormError,
        handleChange,
        handleBlur,
        validateAll,
        applyServerError,
        reset
    };
}
