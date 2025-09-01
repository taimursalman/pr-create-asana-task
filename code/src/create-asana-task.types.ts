// CodeReviewTaimurSDone: formatting issues
export interface AsanaUser {
    gid: string;
    name: string;
    email: string;
}

export interface AsanaUserResponse {
    data: AsanaUser[];
    errors?: any[];
}

export interface AsanaWorkspace {
    gid: string;
    name: string;
}

export interface AsanaTaskProject {
    gid: string;
    name: string;
}

export interface AsanaWorkspaceResponse {
    data: {
        gid: string;
        // CodeReviewTaimurSDone: old array notation. make an interface for {gid, name} then do obj[]
        workspaces: AsanaWorkspace[];
    };
}

export interface AsanaTaskResponse {
    data: {
        gid: string;
        name: string;
        assignee?: AsanaUser;
        // CodeReviewTaimurSDone: old array notation. make an interface for {gid, name} then do obj[]
        projects: AsanaTaskProject[];
    };
}

export interface TaskData {
    name: string;
    notes: string;
    projects: string[];
    workspace: string;
    assignee?: string;
    tags?: string[];
}