import * as core from '@actions/core';
import {Octokit} from "@octokit/rest";
import {
    assignAsanaTask,
    findAsanaUserByEmail, getPRDataWithFallback,
    getReviewerEmail,
    getTaskFromProject,
    getWorkspaceGid
} from "@/actions.library";

export const assignAsanaTaskAction = async () => {
    try {
        const octokit = new Octokit({auth: process.env.GITHUB_TOKEN});

        const asanaAuthToken = core.getInput('token');
        const asanaProjectId = core.getInput('project-id');
        const reviewerLogin = core.getInput('reviewer-login');
        let assigneeEmail = core.getInput('assignee-email');
        let taskId: string | null = core.getInput('task-id');

        // Get PR data automatically from GitHub context with fallback to manual inputs
        const prData = getPRDataWithFallback();
        const { prUrl, branchName } = prData;

        core.info(`PR URL: ${prUrl}`);
        core.info(`Project ID: ${asanaProjectId}`);
        core.info(`Assignee Email: ${assigneeEmail}`);
        core.info(`Task ID: ${taskId}`);

        if (!assigneeEmail) {
            if (!branchName || !reviewerLogin) {
                core.info('Insufficient information provided to determine reviewer username');
            }

            const result = await getReviewerEmail(octokit, reviewerLogin, branchName);
            if (result.skipAssignment || (result.reviewerEmail === '')) {
                core.info('No assignee email provided, skipping task assignment');
                return;
            }

            assigneeEmail = result.reviewerEmail;
        }

        core.info(`Assignee Email: ${assigneeEmail}`);

        if (!taskId && !prUrl) {
            core.info('Neither Task ID nor PR Url provided, skipping task assignment');
        }

        if (!taskId) {
            taskId = await getTaskFromProject(prUrl, asanaAuthToken, asanaProjectId);
            if (!taskId) {
                core.warning(`Could not find Asana task for PR: ${prUrl}`);
                return;
            } else {
                core.info(`Task ID retrieved from asana tasks' descriptions! ${taskId}`);
            }
        }

        const workspaceGid = await getWorkspaceGid(asanaAuthToken);
        const assignee = await findAsanaUserByEmail(assigneeEmail, asanaAuthToken, workspaceGid);
        if (!assignee) {
            core.warning(`Could not find Asana user with email: ${assigneeEmail}`);
            return;
        }

        const success = await assignAsanaTask(taskId, assignee.gid, asanaAuthToken);
        if (success) {
            core.info(`✅ Successfully assigned task to ${assignee.name}`);
            core.setOutput("assigned", "true");
            core.setOutput("assignee", assignee.name);
        } else {
            core.setFailed(`❌ Failed to assign task to ${assignee.name}`);
        }
    } catch (error) {
        const message = (error as Error)?.message || String(error);
        core.setFailed(`❌ Failed to assign Asana task: ${message}`);
    }
};