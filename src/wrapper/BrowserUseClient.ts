import { BrowserUseClient as FernClient } from "../Client";
import { BrowserUseTasks } from "./api/BrowserUseTasks";

export class BrowserUseClient extends FernClient {
    protected _tasks: BrowserUseTasks | undefined;

    public get tasks(): BrowserUseTasks {
        return (this._tasks ??= new BrowserUseTasks(this._options));
    }
}
