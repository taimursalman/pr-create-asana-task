import * as core from "@actions/core";
import {createAsanaTaskAction} from "@/create-asana-task/create-asana-task-action";
import {ActionType} from "@/actions.types";
import {assignAsanaTaskAction} from "@/assign-asana-task/assign-asana-task";


const getCurrentAction = (): ActionType => {
    const input = core.getInput('method');
    if (!input) {
        return ActionType.CREATE_TASK;
    }

    const currentMethod: ActionType | undefined = input as ActionType;
    if (!currentMethod) {
        return ActionType.CREATE_TASK;
    }

    return currentMethod;
}

const currentAction = getCurrentAction();

switch (currentAction) {
    case ActionType.CREATE_TASK:
        void createAsanaTaskAction();
        break;
    case ActionType.ASSIGN_TASK:
        void assignAsanaTaskAction();
        break;
    case ActionType.COMPLETE_TASK:
        core.info('Not implemented yet');
        break;
}