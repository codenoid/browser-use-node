import { BrowserUse } from "index.js";
import { FileView, TaskStepView, TaskView } from "../../api/index.js";
import { ZodType } from "zod";

export class BrowserUseCreateTaskResponse<T extends ZodType | null = null> implements BrowserUse.TaskCreatedResponse {
    private readonly _schema: T;
    private readonly _response: BrowserUse.TaskCreatedResponse;

    constructor(response: BrowserUse.TaskCreatedResponse, schema: T) {
        this._response = response;
        this._schema = schema;
    }

    // Getters

    get id() {
        return this._response.id;
    }

    get sessionId() {
        return this._response.sessionId;
    }

    // Utils

    stream() {}
}
