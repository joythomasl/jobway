import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Building2, Radar, Target } from "lucide-react";
import {
  API_BASE,
  calculateWorkflowTaskProgress,
  Company,
  getActiveWorkflow,
  getCompanies,
  getCompletedCheckpointCount,
  getLocalSolvedQuestionIds,
  getQuestions,
  Question,
  selectWorkflow,
} from "../placementApi";
import "./PlacementPortal.css";

interface Card extends Company {
  readiness_score: number;
  missing_topics: string[];
  gap_problems: Array<{ title: string; difficulty: string }>;
}
interface Groups {
  high_chance: Card[];
  within_reach: Card[];
  stretch_targets: Card[];
}
const sections: [keyof Groups, string, string][] = [
  ["high_chance", "High chance", "Ready to interview now"],
  ["within_reach", "Within reach", "A focused gap sprint can unlock these"],
  [
    "stretch_targets",
    "Stretch targets",
    "Build the missing patterns deliberately",
  ],
];

function buildLocalReadiness(
  companies: Company[],
  questions: Question[],
  roadmapProgress: number,
): Groups {
  const solvedIds = new Set(getLocalSolvedQuestionIds());
  const solvedQuestions = questions.filter(
    (question) => question.solved || solvedIds.has(question.id),
  );
  const solvedTopics = new Set(
    solvedQuestions.flatMap((question) => question.topics || []),
  );
  const cards = companies
    .filter(
      (company) =>
        company.problem_count > 0 || (company.top_topics?.length || 0) > 0,
    )
    .map((company) => {
      const companyQuestions = questions.filter((question) =>
        question.companies?.some(
          (name) => name.toLowerCase() === company.name.toLowerCase(),
        ),
      );
      const solvedCompany = companyQuestions.filter(
        (question) => question.solved || solvedIds.has(question.id),
      ).length;
      const companyCoverage = Math.min(
        100,
        (solvedCompany / Math.max(8, Math.min(24, companyQuestions.length))) *
          100,
      );
      const masteredTopics = (company.top_topics || []).filter((topic) =>
        solvedTopics.has(topic),
      ).length;
      const topicCoverage = company.top_topics?.length
        ? (masteredTopics / company.top_topics.length) * 100
        : 0;
      const readinessScore = Math.round(
        companyCoverage * 0.5 + topicCoverage * 0.25 + roadmapProgress * 0.25,
      );
      const missingTopics = (company.top_topics || []).filter(
        (topic) => !solvedTopics.has(topic),
      );
      const gapProblems = companyQuestions
        .filter((question) => !question.solved && !solvedIds.has(question.id))
        .slice(0, 3)
        .map((question) => ({
          title: question.title,
          difficulty: question.difficulty,
        }));
      return {
        ...company,
        readiness_score: readinessScore,
        missing_topics: missingTopics,
        gap_problems: gapProblems,
      };
    });
  return normalizeGroups({
    high_chance: cards.filter((card) => card.readiness_score >= 70),
    within_reach: cards.filter(
      (card) => card.readiness_score >= 35 && card.readiness_score < 70,
    ),
    stretch_targets: cards.filter((card) => card.readiness_score < 35),
  });
}

function normalizeGroups(groups: Groups): Groups {
  const prepareCards = (cards: Card[]) =>
    cards
      .filter(
        (company) =>
          company.problem_count > 0 ||
          (company.top_topics?.length || 0) > 0 ||
          (company.gap_problems?.length || 0) > 0,
      )
      .sort(
        (left, right) =>
          right.readiness_score - left.readiness_score ||
          right.problem_count - left.problem_count,
      );
  return {
    high_chance: prepareCards(groups.high_chance),
    within_reach: prepareCards(groups.within_reach),
    stretch_targets: prepareCards(groups.stretch_targets),
  };
}
export default function CompanyChancesView() {
  const [groups, setGroups] = useState<Groups>({
    high_chance: [],
    within_reach: [],
    stretch_targets: [],
  });
  const navigate = useNavigate();
  useEffect(() => {
    const load = async () => {
      const [companies, questions, workflow] = await Promise.all([
        getCompanies(),
        getQuestions(),
        getActiveWorkflow(),
      ]);
      const completedCheckpoints = getCompletedCheckpointCount(
        workflow.mode,
        workflow.target_id,
      );
      const roadmapProgress = calculateWorkflowTaskProgress(
        workflow,
        completedCheckpoints,
      );
      const hasLocalProgress =
        getLocalSolvedQuestionIds().length > 0 || completedCheckpoints > 0;
      try {
        const response = await fetch(`${API_BASE}/api/companies/chances`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Readiness service unavailable");
        const serverGroups = (await response.json()) as Groups;
        const hasServerProgress = Object.values(serverGroups)
          .flat()
          .some((company) => company.readiness_score > 0);
        setGroups(
          hasLocalProgress
            ? buildLocalReadiness(companies, questions, roadmapProgress)
            : hasServerProgress
              ? normalizeGroups(serverGroups)
              : buildLocalReadiness(companies, questions, roadmapProgress),
        );
      } catch {
        setGroups(buildLocalReadiness(companies, questions, roadmapProgress));
      }
    };
    load();
  }, []);
  const prepare = async (name: string) => {
    await selectWorkflow("company", name);
    navigate("/workflow");
  };
  return (
    <div className="portal-page chances-page">
      <header className="chances-hero">
        <div>
          <div className="eyebrow">
            <Radar size={16} /> LIVE READINESS MAP
          </div>
          <h1>Companies you can crack</h1>
          <p>
            Your score blends company-specific coverage, transferable topic
            mastery, and your active roadmap completion. It updates after every
            accepted submission or completed learning checkpoint.
          </p>
        </div>
        <div className="score-formula">
          <span>50% company problems</span>
          <span>25% topic transfer</span>
          <span>25% roadmap completion</span>
        </div>
      </header>
      {sections
        .filter(([key]) => groups[key].length)
        .map(([key, title, subtitle]) => (
          <section className={`chance-section ${key}`} key={key}>
            <div className="chance-heading">
              <span className="chance-light" />
              <div>
                <h2>{title}</h2>
                <p>{subtitle}</p>
              </div>
              <strong>{groups[key].length}</strong>
            </div>
            <div className="chance-grid">
              {groups[key]
                .slice(0, key === "stretch_targets" ? 12 : 8)
                .map((company) => (
                  <article className="chance-card" key={company.name}>
                    <header>
                      <span className="company-monogram small">
                        {company.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <h3>{company.name}</h3>
                        <p>{company.problem_count} tracked questions</p>
                      </div>
                      <div className="score">
                        <strong>{company.readiness_score}%</strong>
                        <span>ready</span>
                      </div>
                    </header>
                    <div className="score-bar">
                      <span style={{ width: `${company.readiness_score}%` }} />
                    </div>
                    <div className="card-section">
                      <span>Priority topics</span>
                      <div className="chip-row">
                        {(company.missing_topics?.length
                          ? company.missing_topics
                          : company.top_topics
                        )
                          .slice(0, 4)
                          .map((t) => (
                            <span className="chip" key={t}>
                              {t}
                            </span>
                          ))}
                      </div>
                    </div>
                    {company.gap_problems?.length > 0 && (
                      <div className="gap-preview">
                        <Target size={15} />
                        <span>Next: {company.gap_problems[0].title}</span>
                      </div>
                    )}
                    <button
                      className="card-link"
                      onClick={() => prepare(company.name)}
                    >
                      Prepare for {company.name} <ArrowUpRight size={15} />
                    </button>
                  </article>
                ))}
            </div>
            {!groups[key].length && (
              <div className="empty-chance">
                <Building2 />
                <span>
                  Keep solving—companies will move into this tier as your
                  coverage grows.
                </span>
              </div>
            )}
          </section>
        ))}
      <section
        className="readiness-next-milestones"
        aria-label="Readiness milestones"
      >
        <Building2 />
        <div>
          <strong>Your company map is active</strong>
          <span>
            Companies move between tiers automatically as you complete verified
            problems and roadmap checkpoints.
          </span>
        </div>
        <button className="btn-secondary" onClick={() => navigate("/workflow")}>
          Build progress
        </button>
      </section>
    </div>
  );
}
