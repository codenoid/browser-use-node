import { CreateTaskRequest, TaskView } from "api";
import z, { type ZodType } from "zod";

// RUN

export type TaskCreateParamsWithSchema<T extends ZodType> = Omit<CreateTaskRequest, "structuredOutput"> & {
    schema: T;
};

export function stringifyStructuredOutput<T extends ZodType>(schema: T): string {
    return JSON.stringify(z.toJSONSchema(schema));
}

// RETRIEVE

export type TaskViewWithSchema<T extends ZodType> = TaskView & {
    /**
     * The parsed output of the task.
     *
     * @example
     * ```ts
     * const task = await client.tasks.retrieve(taskId, { schema: z.object({ name: z.string() }) });
     * console.log(task.parsed);
     * ```
     */
    parsed: z.output<T> | null;
};

export function parseStructuredTaskOutput<T extends ZodType>(res: TaskView, schema: T): TaskViewWithSchema<T> {
    if (res.output == null) {
        return { ...res, parsed: null };
    }

    try {
        const parsed = JSON.parse(res.output);

        const response = schema.safeParse(parsed);
        if (!response.success) {
            throw new Error(`Invalid structured output: ${response.error.message}`);
        }

        return { ...res, parsed: response.data };
    } catch (e) {
        if (e instanceof SyntaxError) {
            return {
                ...res,
                parsed: null,
            };
        }
        throw e;
    }
}
