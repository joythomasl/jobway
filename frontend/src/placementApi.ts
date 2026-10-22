export const API_BASE =
  import.meta.env.VITE_PLACEMENT_API ||
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "");

export type Difficulty = "Easy" | "Medium" | "Hard";
export interface Question {
  id: string;
  title: string;
  title_slug: string;
  source: string;
  type: string;
  difficulty: Difficulty;
  category: string;
  topics: string[];
  workflow_phase: number;
  software_roles: string[];
  companies: string[];
  description: string;
  starter_code: Record<string, string>;
  reference_solution?: Record<string, string>;
  test_cases: Array<{ input: string; expected: string }>;
  related_videos?: { topic_video?: Video; problem_videos?: Video[] };
  solved?: boolean;
  opted_out?: boolean;
}
export interface Video {
  video_id: string;
  title: string;
  channel: string;
}
export interface Role {
  id: string;
  title: string;
  icon?: string;
  summary: string;
  rationale: string;
  key_topics: string[];
  top_hiring_companies: string[];
  phases: Array<{
    number: number;
    title: string;
    description: string;
    topics: string[];
  }>;
  question_count?: number;
}
export interface Company {
  name: string;
  problem_count: number;
  easy_pct: number;
  medium_pct: number;
  hard_pct: number;
  top_topics: string[];
}
export interface Phase {
  number: number;
  title: string;
  description: string;
  questions_by_difficulty: Record<Difficulty, Question[]>;
  opted_out_questions: Question[];
  total: number;
  solved: number;
  opted_out: number;
  progress_percentage: number;
}
export interface Workflow {
  mode: "role" | "company";
  target_id: string;
  title: string;
  overall_progress: number;
  phases: Phase[];
}

const LOCAL_SOLVED_KEY = "jobway-solved-questions";
const CHECKPOINT_COUNT = 16;

export interface ActiveWorkflowSelection {
  mode: "role" | "company";
  target_id: string;
}

export function getLocalSolvedQuestionIds(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_SOLVED_KEY) || "[]");
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function markQuestionSolvedLocally(questionId: string) {
  const solved = new Set(getLocalSolvedQuestionIds());
  solved.add(questionId);
  localStorage.setItem(LOCAL_SOLVED_KEY, JSON.stringify([...solved]));
}

export function getActiveWorkflowSelection(): ActiveWorkflowSelection {
  try {
    const value = JSON.parse(
      localStorage.getItem("jobway-active-workflow") || "null",
    ) as Partial<ActiveWorkflowSelection> | null;
    if (
      value &&
      (value.mode === "role" || value.mode === "company") &&
      typeof value.target_id === "string"
    ) {
      return { mode: value.mode, target_id: value.target_id };
    }
  } catch {
    /* Fall through to the default path. */
  }
  return { mode: "role", target_id: "backend_swe" };
}

export function getLocalCheckpointChecks(
  mode: "role" | "company",
  targetId: string,
): Record<string, boolean> {
  try {
    const value = JSON.parse(
      localStorage.getItem(`jobway-checks:${mode}:${targetId}`) || "{}",
    );
    return value && typeof value === "object"
      ? (value as Record<string, boolean>)
      : {};
  } catch {
    return {};
  }
}

export function getCompletedCheckpointCount(
  mode: "role" | "company",
  targetId: string,
): number {
  return Math.min(
    CHECKPOINT_COUNT,
    Object.values(getLocalCheckpointChecks(mode, targetId)).filter(Boolean)
      .length,
  );
}

export function calculateWorkflowTaskProgress(
  workflow: Workflow,
  completedCheckpoints: number,
): number {
  const requiredProblems = workflow.phases.reduce(
    (sum, phase) => sum + Math.max(0, phase.total - phase.opted_out),
    0,
  );
  const solvedProblems = workflow.phases.reduce(
    (sum, phase) =>
      sum + Math.min(phase.solved, Math.max(0, phase.total - phase.opted_out)),
    0,
  );
  const totalTasks = requiredProblems + CHECKPOINT_COUNT;
  const completedTasks =
    solvedProblems + Math.min(CHECKPOINT_COUNT, completedCheckpoints);
  return totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

function applyLocalProgress(workflow: Workflow): Workflow {
  const solvedIds = new Set(getLocalSolvedQuestionIds());
  const phases = workflow.phases.map((phase) => {
    const questionsByDifficulty = Object.fromEntries(
      Object.entries(phase.questions_by_difficulty).map(
        ([difficulty, items]) => [
          difficulty,
          items.map((question) => ({
            ...question,
            solved: question.solved || solvedIds.has(question.id),
          })),
        ],
      ),
    ) as Record<Difficulty, Question[]>;
    const available = Object.values(questionsByDifficulty).flat();
    const solved = available.filter((question) => question.solved).length;
    const optedOut = phase.opted_out_questions.length;
    const total = available.length + optedOut;
    const required = Math.max(0, total - optedOut);
    return {
      ...phase,
      questions_by_difficulty: questionsByDifficulty,
      total,
      solved,
      opted_out: optedOut,
      progress_percentage: required ? Math.round((solved / required) * 100) : 0,
    };
  });
  const total = phases.reduce(
    (sum, phase) => sum + Math.max(0, phase.total - phase.opted_out),
    0,
  );
  const solved = phases.reduce((sum, phase) => sum + phase.solved, 0);
  return {
    ...workflow,
    phases,
    overall_progress: total ? Math.round((solved / total) * 100) : 0,
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok)
    throw new Error(
      (await response.text()) || `Request failed: ${response.status}`,
    );
  return response.json();
}

export async function getRoles(): Promise<Role[]> {
  try {
    return await request<Role[]>("/api/workflows/roles");
  } catch {
    const response = await fetch("/workflows.json");
    return (await response.json()).roles;
  }
}
export async function getCompanies(): Promise<Company[]> {
  try {
    return await request<Company[]>("/api/companies?limit=500");
  } catch {
    const response = await fetch("/company_profiles.json");
    return Object.values((await response.json()).companies);
  }
}
export async function getQuestions(): Promise<Question[]> {
  const solved = new Set(getLocalSolvedQuestionIds());
  try {
    return (await request<Question[]>("/api/questions")).map((question) => ({
      ...question,
      solved: question.solved || solved.has(question.id),
    }));
  } catch {
    const questions = (await fetch("/questions.json").then((response) =>
      response.json(),
    )) as Question[];
    return questions.map((question) => ({
      ...question,
      solved: question.solved || solved.has(question.id),
    }));
  }
}
export async function selectWorkflow(
  mode: "role" | "company",
  target_id: string,
) {
  localStorage.setItem(
    "jobway-active-workflow",
    JSON.stringify({ mode, target_id }),
  );
  try {
    await request("/api/workflow/select", {
      method: "POST",
      body: JSON.stringify({ mode, target_id }),
    });
  } catch {
    /* local fallback is intentional */
  }
}
export async function getActiveWorkflow(): Promise<Workflow> {
  try {
    const active = await request<Workflow & { active_workflow?: null }>(
      "/api/workflow/active",
    );
    if (active.active_workflow === null) throw new Error("No active workflow");
    return applyLocalProgress(active);
  } catch {
    const selected = getActiveWorkflowSelection();
    const [roles, questions] = await Promise.all([getRoles(), getQuestions()]);
    const role =
      roles.find((item) => item.id === selected.target_id) || roles[0];
    const phases: Phase[] = role.phases.map((definition) => {
      const pool = questions.filter(
        (question) =>
          question.workflow_phase === definition.number &&
          (selected.mode === "company"
            ? question.companies?.some(
                (value) =>
                  value.toLowerCase() === selected.target_id.toLowerCase(),
              )
            : question.software_roles?.includes(role.id)),
      );
      const source = pool.length
        ? pool
        : questions.filter(
            (question) => question.workflow_phase === definition.number,
          );
      return {
        number: definition.number,
        title:
          selected.mode === "company"
            ? `${selected.target_id} — ${definition.title}`
            : definition.title,
        description: definition.description,
        questions_by_difficulty: {
          Easy: source.filter((q) => q.difficulty === "Easy"),
          Medium: source.filter((q) => q.difficulty === "Medium"),
          Hard: source.filter((q) => q.difficulty === "Hard"),
        },
        opted_out_questions: [],
        total: source.length,
        solved: 0,
        opted_out: 0,
        progress_percentage: 0,
      };
    });
    return applyLocalProgress({
      mode: selected.mode,
      target_id: selected.target_id,
      title:
        selected.mode === "company"
          ? `${selected.target_id} Custom Preparation Path`
          : `${role.title} Workflow`,
      overall_progress: 0,
      phases,
    });
  }
}
export const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });
