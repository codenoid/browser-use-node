import z, { type ZodType } from 'zod';
import type { TaskCreateParams, TaskView } from '../resources/tasks';

// RUN

export type TaskCreateParamsWithSchema<T extends ZodType> = Omit<TaskCreateParams, 'structuredOutputJson'> & {
  structuredOutputJson: T;
};

export function stringifyStructuredOutput<T extends ZodType>(schema: T): string {
  return JSON.stringify(z.toJSONSchema(schema));
}

// RETRIEVE

export type TaskViewWithSchema<T extends ZodType> = Omit<TaskView, 'doneOutput'> & {
  doneOutput: z.output<T> | null;
};

export function parseStructuredTaskOutput<T extends ZodType>(
  res: TaskView,
  schema: T,
): TaskViewWithSchema<T> {
  if (res.doneOutput == null) {
    return { ...res, doneOutput: null };
  }

  try {
    const parsed = JSON.parse(res.doneOutput);

    const response = schema.safeParse(parsed);
    if (!response.success) {
      throw new Error(`Invalid structured output: ${response.error.message}`);
    }

    return { ...res, doneOutput: response.data };
  } catch (e) {
    if (e instanceof SyntaxError) {
      return {
        ...res,
        doneOutput: null,
      };
    }
    throw e;
  }
}
