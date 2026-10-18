"use client";

import { useActionState, useTransition, type FormEvent } from "react";
import type { ActionState } from "./types";

/**
 * Server action-тай форм. React 19 нь `action` prop ашиглахад алдаа гарсан ч талбаруудыг цэвэрлэдэг тул
 * хэрэглэгчийн оруулсан утга алдагдахгүйн тулд submit-ийг өөрсдөө барьж FormData-г шууд дамжуулна.
 */
export function useFormAction(
  fn: (prev: ActionState, fd: FormData) => Promise<ActionState>,
  initial: ActionState,
  prepare?: (fd: FormData) => void,
) {
  const [state, dispatch, pending] = useActionState(fn, initial);
  const [, start] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    prepare?.(fd);
    start(() => dispatch(fd));
  };
  return [state, onSubmit, pending] as const;
}
