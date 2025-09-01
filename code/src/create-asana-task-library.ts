import {info, warning} from '@actions/core';
import {
    AsanaWorkspaceResponse,
    AsanaUser,
    AsanaUserResponse,
    TaskData,
    AsanaTaskResponse
} from './create-asana-task.types';

export const findAsanaUserByEmail = async (email: string, token: string, workspaceId: string): Promise<AsanaUser | null> => {
    try {
        info(`Searching for Asana user with email: ${email}`);

        const response = await fetch(`https://app.asana.com/api/1.0/users?workspace=${workspaceId}&opt_fields=name,email`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json() as AsanaUserResponse;
        if (data.errors) {
            warning(`Asana API error: ${JSON.stringify(data.errors)}`);
            return null;
        }

        const user = data.data.find(user => user.email === email);
        if (user) {
            info(`Found user: ${user.name} (${user.email})`);
            return user;
        } else {
            info(`No user found with email: ${email}`);
            return null;
        }

    } catch (error) {
        warning(`Failed to search for user with email ${email}: ${(error as Error).message}`);
        return null;
    }
}

export const getWorkspaceGid = async (token: string): Promise<string> => {
    const getCurrentWorkspace = await fetch('https://app.asana.com/api/1.0/users/me', {
        headers: {Authorization: `Bearer ${token}`}
    });

    if (!getCurrentWorkspace.ok) {
        throw new Error(`Failed to fetch user info: ${getCurrentWorkspace.statusText}`);
    }
    const meData = await getCurrentWorkspace.json() as AsanaWorkspaceResponse;
    return meData.data.workspaces[0].gid;
}

export const createAsanaTaskFromData = async (taskData: TaskData, asanaAuthToken: string): Promise<AsanaTaskResponse> => {
    const taskResp = await fetch('https://app.asana.com/api/1.0/tasks', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${asanaAuthToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({data: taskData})
    });

    if (!taskResp.ok) {
        const errorData = await taskResp.json();
        throw new Error(`Failed to create task: ${JSON.stringify(errorData)}`);
    }

    const taskResponse = await taskResp.json() as AsanaTaskResponse;
    if (!taskResponse) {
        throw new Error(`Failed to create task. Invalid data returned on task creation`);
    }

    return taskResponse;
}