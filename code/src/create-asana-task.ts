import * as core from '@actions/core';
import {TaskData} from "@/create-asana-task.types";
import {createAsanaTaskFromData, findAsanaUserByEmail, getWorkspaceGid} from "@/create-asana-task-library";
// CodeReviewTaimurSDone: missing import for fetch
// CodeReviewTaimurSDone: file isn't following TS formatting standards

export const createAsanaTask = async () => {
    try {
        const asanaAuthToken = core.getInput('token');
        const prTitle = core.getInput('title');
        const asanaProjectId = core.getInput('projectId');
        const assigneeEmail = core.getInput('assignee-email');
        const githubUser = core.getInput('github-user');
        const prUrl = core.getInput('pr-url') || '';
        const prDescription = core.getInput('pr-description') || '';
        const prAuthor = core.getInput('pr-author') || githubUser || '';
        const branchName = core.getInput('branch-name') || '';
        const sprintTagId = core.getInput('sprint-tag') || '';

        core.info(`Title: ${prTitle}`);
        core.info(`ProjectId: ${asanaProjectId}`);
        core.info(`Assignee Email: ${assigneeEmail}`);
        core.info(`GitHub User: ${githubUser}`);
        core.info(`PR URL: ${prUrl}`);
        core.info(`PR Author: ${prAuthor}`);
        core.info(`Branch Name: ${branchName}`);
        core.info(`PR Description Length: ${prDescription.length} characters`);
        core.info(`Sprint tag is ${sprintTagId}`);

        const workspaceGid = await getWorkspaceGid(asanaAuthToken);
        let authorName: string = prAuthor, authorGid: string | undefined = undefined;

        if (assigneeEmail) {
            const authorAsanaUser = await findAsanaUserByEmail(assigneeEmail, asanaAuthToken, workspaceGid);
            if (authorAsanaUser) {
                core.info(`Found Asana user: ${authorAsanaUser.name} (${authorAsanaUser.email})`);
                authorGid = authorAsanaUser.gid;
                authorName = `${authorAsanaUser.name}`;
            } else if (!prAuthor) {
                core.info(`Could not find Asana user for author. The task will not be assigned to anyone`);
            } else {
                core.info(`Could not find Asana user for author, using plain text: ${prAuthor}`);
            }
        }

        const taskTitle = `Code Review: [${getBranchName(branchName, prUrl, prTitle)}]`;
        let taskDescription = getAsanaTaskDescription(taskTitle, authorName, prDescription, prUrl);
        const taskData: TaskData = {
            name: taskTitle,
            notes: taskDescription,
            projects: [asanaProjectId],
            workspace: workspaceGid,
            assignee: authorGid ?? undefined,
            tags: sprintTagId ? [sprintTagId] : undefined,
        };

        const createdTaskData = await createAsanaTaskFromData(taskData, asanaAuthToken)
        core.info(`✅ Created task: ${createdTaskData.data.gid}`);

        core.setOutput("taskId", createdTaskData.data.gid);
        core.setOutput("taskUrl", `https://app.asana.com/0/${asanaProjectId}/${createdTaskData.data.gid}`);
    } catch (error) {
        const message = (error as Error)?.message || String(error);
        core.setFailed(`❌ Failed to create Asana task: ${message}`);
    }
}

function getBranchName(branchName: string, prUrl: string, title: string) {
    let finalBranchName = branchName;
    if (!finalBranchName && prUrl) {
        const urlMatch = prUrl.match(/\/pull\/(\d+)$/);
        if (urlMatch) {
            finalBranchName = `PR-${urlMatch[1]}`;
        }
    }

    if (!finalBranchName) {
        finalBranchName = title;
    }
    return finalBranchName;
}

function getAsanaTaskDescription(taskTitle: string, authorName: string, prDescription: string, prUrl: string) {
    let taskNotes = '';
    taskNotes += `*Task Name:*\n ${taskTitle}\n\n`;
    if (authorName) {
        taskNotes += `*Branch Author:*\n ${authorName}\n\n`;
    }
    taskNotes += '*Changes:*\n\n';

    if (prDescription && prDescription.trim()) {
        taskNotes += prDescription.trim();
    }

    if (prUrl && prUrl.trim()) {
        taskNotes += `\n\nPR URL: ${prUrl}`;
    }

    taskNotes += '\n\nThis task was created via GitHub Actions';
    return taskNotes;
}