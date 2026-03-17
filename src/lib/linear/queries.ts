export const CREATE_ISSUE = `
  mutation CreateIssue($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue { id identifier url title }
    }
  }
`;

export const ADD_COMMENT = `
  mutation AddComment($issueId: String!, $body: String!) {
    commentCreate(input: { issueId: $issueId, body: $body }) {
      success
      comment { id body }
    }
  }
`;

export const CREATE_ISSUE_RELATION = `
  mutation CreateIssueRelation($issueId: String!, $relatedIssueId: String!, $type: IssueRelationType!) {
    issueRelationCreate(input: { issueId: $issueId, relatedIssueId: $relatedIssueId, type: $type }) {
      success
      issueRelation { id type }
    }
  }
`;

// Create a sub-issue (child of parent) — uses parentId in IssueCreateInput
export const CREATE_SUB_ISSUE = `
  mutation CreateSubIssue($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue { id identifier url }
    }
  }
`;

export const UPDATE_ISSUE_LABELS = `
  mutation UpdateIssueLabels($issueId: String!, $labelIds: [String!]!) {
    issueUpdate(id: $issueId, input: { labelIds: $labelIds }) {
      success
    }
  }
`;
