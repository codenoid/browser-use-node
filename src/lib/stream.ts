import type { TaskView, TaskStepView } from '../resources/tasks';
import { type DeepMutable, ExhaustiveSwitchCheck } from './types';

export type ReducerEvent = TaskView | null;

export type BrowserState = Readonly<{
  taskId: string;
  sessionId: string;

  liveUrl: string | null;
  steps: ReadonlyArray<TaskStepView>;
  doneOutput: string | null;
}> | null;

type BrowserAction = {
  kind: 'status';
  status: TaskView;
};

export function reducer(state: BrowserState, action: BrowserAction): [BrowserState, ReducerEvent] {
  switch (action.kind) {
    case 'status': {
      // INIT

      if (state == null) {
        const liveUrl = action.status.session.liveUrl ?? null;
        const doneOutput = action.status.doneOutput ?? null;

        const state: BrowserState = {
          taskId: action.status.id,
          sessionId: action.status.sessionId,
          liveUrl: liveUrl,
          steps: action.status.steps,
          doneOutput: doneOutput,
        };

        return [state, action.status];
      }

      // UPDATE

      const liveUrl = action.status.session.liveUrl ?? state.liveUrl;
      const doneOutput = action.status.doneOutput ?? state.doneOutput;

      const steps: TaskStepView[] = [...state.steps];
      if (action.status.steps != null) {
        const newSteps = action.status.steps.slice(state.steps.length);

        for (const step of newSteps) {
          steps.push(step);
        }
      }

      const newState: DeepMutable<BrowserState> = {
        ...state,
        liveUrl,
        steps,
        doneOutput,
      };

      // CHANGES

      if (
        (state.liveUrl == null && liveUrl != null) ||
        state.steps.length !== steps.length ||
        state.doneOutput != doneOutput
      ) {
        const update: ReducerEvent = {
          ...action.status,
          steps: newState.steps,
          session: {
            ...action.status.session,
            liveUrl: newState.liveUrl,
          },
          doneOutput: newState.doneOutput,
        };

        return [newState, update];
      }

      return [newState, null];
    }
    default:
      throw new ExhaustiveSwitchCheck(action.kind);
  }
}
