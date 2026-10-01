/**
 * A single, consistent way for a form action to report what happened.
 *
 * The pattern this replaces, repeated across dozens of pages:
 *
 *   catch (err) {
 *       setError(err.response?.data?.message || "Something went wrong");
 *   }
 *
 * which is wrong in three ways at once -- it shows internal server wording, it
 * treats a validation problem (already shown on a field) as a page-level
 * failure, and it offers the user no way forward when the failure was a
 * dropped connection that would succeed on a second attempt.
 *
 * Usage:
 *
 *   const { run, validateAll, pending, fieldErrors, formError } =
 *       useActionFeedback({ schema: OFFER_FIELDS, initialValues: payload });
 *
 *   async function onSubmit(event) {
 *       event.preventDefault();
 *
 *       if (!validateAll(payload)) {
 *           return;
 *       }
 *
 *       const { ok } = await run(() => createOffer(payload), {
 *           success: "Offer sent",
 *           retry: true
 *       });
 *
 *       if (ok) {
 *           navigate("/offers");
 *       }
 *   }
 *
 * Validation lives in `useFormValidation` and is surfaced through this hook
 * rather than duplicated, so there is only ever one source of `formError`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../components/ui/ToastProvider";
import useFormValidation from "./useFormValidation";
import { describeError } from "../lib/errorMessages";

// Module-level so an omitted schema does not produce a new object on every
// render, which would needlessly rebuild the validator's internal callbacks.
const NO_SCHEMA = {};
const NO_VALUES = {};

/**
 * @param {object} [options]
 * @param {object} [options.schema] Field rules. Supplying one also declares
 *        that the page renders its field errors, which is what lets a
 *        validation rejection stay on the field instead of becoming a banner.
 * @param {object} [options.initialValues] Current form values, for cross-field
 *        rules and for `validateAll` to check against what is on screen.
 * @param {boolean} [options.handlesFieldErrors] Override the inference above
 *        for the rare page that has a schema but renders errors some other way.
 */
export function useActionFeedback(options = {}) {
    const {
        schema = NO_SCHEMA,
        initialValues = NO_VALUES,
        handlesFieldErrors
    } = options;
    const { showToast } = useToast();
    const [pending, setPending] = useState(false);

    // A schema is the signal that the page is set up to show a problem next to
    // the input that caused it. Without one, attributing a rejection to a field
    // would put the message somewhere nobody is rendering, so it goes to the
    // banner and a toast instead. Defaulting to the visible option is the point:
    // forgetting to render `fieldErrors` must never turn a failed save into a
    // form that silently refuses to submit.
    const rendersFieldErrors =
        handlesFieldErrors ?? Object.keys(schema).length > 0;

    // Lets the toast's "Try again" re-enter `run` without `run` referring to
    // itself, which React's hook lint rules reject.
    const runRef = useRef(null);

    const {
        errors,
        formError,
        announcement,
        touched,
        values,
        setValue,
        setFormError,
        handleChange,
        handleBlur,
        validateAll,
        applyServerError,
        reset
    } = useFormValidation({ schema, initialValues });

    /**
     * @param {() => Promise<any>} task The request to run.
     * @param {object} [config]
     * @param {string} [config.success] Message shown when it resolves.
     * @param {string} [config.failure] Message for a failure with no better one.
     * @param {boolean|(() => void)} [config.retry] Re-run the same `task` from
     *        the toast when `true`, or run the given function.
     * @returns {Promise<{ ok: boolean, data?: any, error?: any }>}
     */
    const run = useCallback(
        async (task, config = {}) => {
            setPending(true);
            setFormError("");

            try {
                const data = await task();

                if (config.success) {
                    showToast(config.success, "success");
                }

                return { ok: true, data };
            } catch (error) {
                const described = describeError(error);

                // A validation rejection belongs on the field that caused it, so
                // it is deliberately given no headline -- repeating it as a
                // banner would tell the user about the same problem twice.
                if (described.kind === "validation") {
                    if (rendersFieldErrors) {
                        applyServerError(error);

                        // A 400/422 with no message body produces no field error
                        // and no banner, which would leave the user with a form
                        // that simply refused to submit. Say something instead
                        // of failing in silence.
                        if (!described.detail) {
                            showToast(
                                config.failure || "Please check the form and try again",
                                "error"
                            );
                        }
                    } else {
                        // Nothing on this page will render a field error, so the
                        // message has to go somewhere that is always on screen.
                        const detail = described.detail || config.failure;

                        setFormError(detail);
                        showToast(
                            config.failure || "Please check the details you entered",
                            "error",
                            detail ? { detail } : undefined
                        );
                    }
                } else {
                    // A dropped connection is not the user's fault and usually
                    // succeeds on a second try, so offer the way forward rather
                    // than only naming the problem.
                    const retryAction =
                        described.retryable && config.retry
                            ? {
                                  label: "Try again",
                                  onClick:
                                      typeof config.retry === "function"
                                          ? config.retry
                                          : () => runRef.current(task, config)
                              }
                            : undefined;

                    showToast(described.title || config.failure || "Something went wrong", "error", {
                        detail: described.detail,
                        action: retryAction
                    });
                }

                return { ok: false, error };
            } finally {
                setPending(false);
            }
        },
        [showToast, setFormError, applyServerError, rendersFieldErrors]
    );

    useEffect(() => {
        runRef.current = run;
    }, [run]);

    return {
        run,
        pending,
        formError,
        setFormError,
        fieldErrors: errors,
        announcement,
        touched,
        values,
        setValue,
        handleChange,
        handleBlur,
        validateAll,
        reset
    };
}

export default useActionFeedback;
