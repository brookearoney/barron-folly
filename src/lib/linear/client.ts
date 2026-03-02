const LINEAR_API_URL = "https://api.linear.app/graphql";

export async function linearRequest<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.LINEAR_API_KEY!,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Linear API error: ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || "Linear GraphQL error");
  }

  return json.data as T;
}

/* ------------------------------------------------------------------ */
/*  Linear Team + Project creation helpers                            */
/* ------------------------------------------------------------------ */

/**
 * Create a Linear team for a client organization.
 * Returns the team id and key.
 */
export async function createLinearTeam(
  name: string,
  key?: string
): Promise<{ id: string; key: string }> {
  // Linear team keys: 1-5 uppercase chars, must be unique.
  // Auto-generate from name if not provided.
  const teamKey =
    key ||
    name
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 5)
      .toUpperCase() ||
    "TEAM";

  const data = await linearRequest<{
    teamCreate: {
      success: boolean;
      team: { id: string; key: string };
    };
  }>(
    `mutation CreateTeam($input: TeamCreateInput!) {
      teamCreate(input: $input) {
        success
        team { id key }
      }
    }`,
    {
      input: {
        name,
        key: teamKey,
      },
    }
  );

  if (!data.teamCreate.success) {
    throw new Error("Failed to create Linear team");
  }

  return data.teamCreate.team;
}

/**
 * Create a Linear project and associate it with a team.
 * Returns the project id.
 */
export async function createLinearProject(
  name: string,
  teamIds: string[]
): Promise<{ id: string }> {
  const data = await linearRequest<{
    projectCreate: {
      success: boolean;
      project: { id: string; name: string };
    };
  }>(
    `mutation CreateProject($input: ProjectCreateInput!) {
      projectCreate(input: $input) {
        success
        project { id name }
      }
    }`,
    {
      input: {
        name,
        teamIds,
      },
    }
  );

  if (!data.projectCreate.success) {
    throw new Error("Failed to create Linear project");
  }

  return data.projectCreate.project;
}

/**
 * Create both a Linear team and project for a new client organization.
 * Returns the team and project IDs to store in the organizations table.
 */
export async function createLinearTeamAndProject(orgName: string): Promise<{
  teamId: string;
  projectId: string;
}> {
  const team = await createLinearTeam(orgName);
  const project = await createLinearProject(orgName, [team.id]);

  return {
    teamId: team.id,
    projectId: project.id,
  };
}
