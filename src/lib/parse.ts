import z from 'zod';
import type { TaskCreateParams, TaskRetrieveParams, TaskView } from '../resources/tasks';

// RUN

export type RunTaskCreateParamsWithStructuredOutput<T extends z.ZodTypeAny> = Omit<
  TaskCreateParams,
  'structuredOutputJson'
> & {
  structuredOutputJson: T;
};

export function stringifyStructuredOutput<T extends z.ZodTypeAny>(
  req: RunTaskCreateParamsWithStructuredOutput<T>,
): TaskCreateParams {
  return {
    ...req,
    structuredOutputJson: JSON.stringify(z.toJSONSchema(req.structuredOutputJson)),
  };
}

// RETRIEVE

export type GetTaskStatusParamsWithStructuredOutput<T extends z.ZodTypeAny> = Omit<
  TaskRetrieveParams,
  'statusOnly'
> & {
  statusOnly?: false;
  structuredOutputJson: T;
};

export type TaskViewWithStructuredOutput<T extends z.ZodTypeAny> = Omit<TaskView, 'doneOutput'> & {
  doneOutput: z.output<T> | null;
};

export function parseStructuredTaskOutput<T extends z.ZodTypeAny>(
  res: TaskView,
  body: GetTaskStatusParamsWithStructuredOutput<T>,
): TaskViewWithStructuredOutput<T> {
  try {
    const parsed = JSON.parse(res.doneOutput);

    const response = body.structuredOutputJson.safeParse(parsed);
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
