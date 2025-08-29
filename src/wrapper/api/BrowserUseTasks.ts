import * as BrowserUse from "../../api/index.js";
import * as core from "../../core/index.js";
import { Tasks } from "../../api/resources/tasks/client/Client.js";

export class BrowserUseTasks extends Tasks {
    constructor(options: Tasks.Options) {
        super(options);
    }

    public createTask(
        request: BrowserUse.CreateTaskRequest,
        requestOptions?: Tasks.RequestOptions,
    ): core.HttpResponsePromise<BrowserUse.TaskCreatedResponse> {
        return super.createTask(request, requestOptions);
    }

    /**
     * Get detailed information about a specific AI agent task.
     *
     * Retrieves comprehensive information about a task, including its current status,
     * progress, and detailed execution data. You can choose to get just the status
     * (for quick polling) or full details including steps and file information.
     *
     * Use this endpoint to:
     *
     * - Monitor task progress in real-time
     * - Review completed task results
     * - Debug failed tasks by examining steps
     * - Download output files and logs
     *
     * Args:
     *
     * - task_id: The unique identifier of the agent task
     *
     * Returns:
     *
     * - Complete task information
     *
     * Raises:
     *
     * - 404: If the user agent task doesn't exist
     */
    retrieve<T extends ZodType>(
        req: { taskId: string; schema: T },
        options?: RequestOptions,
    ): APIPromise<TaskViewWithSchema<T>>;
    retrieve(taskID: string, options?: RequestOptions): APIPromise<TaskView>;
    retrieve(req: string | { taskId: string; schema: ZodType }, options?: RequestOptions): APIPromise<unknown> {
        if (typeof req === "string") {
            return this._client.get(path`/tasks/${req}`, options);
        }

        const { taskId, schema } = req;

        return this._client
            .get(path`/tasks/${taskId}`, options)
            ._thenUnwrap((rsp) => parseStructuredTaskOutput(rsp as TaskView, schema));
    }
}
