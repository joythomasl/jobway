import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Compass,
  Layers3,
  SlidersHorizontal,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { API_BASE, Role, selectWorkflow } from "../placementApi";

interface Option {
  id: string;
  label: string;
  weights: Record<string, number>;
}
interface QuizItem {
  id: string;
  dimension: string;
  scenario: string;
  options: Option[];
}
interface FitDimension {
  name: string;
  score: number;
}
interface Recommendation {
  role_id: string;
  title: string;
  match_percentage: number;
  fit_band?: string;
  fit_dimensions?: FitDimension[];
  rationale: string;
  key_topics: string[];
  top_hiring_companies: string[];
}

const assessmentDimensions = [
  { icon: Compass, label: "Interests", copy: "Problems that hold your attention" },
  { icon: Layers3, label: "Daily work", copy: "Tasks you would enjoy repeating" },
  { icon: BrainCircuit, label: "Work style", copy: "How you handle uncertainty" },
  { icon: Target, label: "Work values", copy: "Outcomes that motivate you" },
  {
    icon: SlidersHorizontal,
    label: "Environment",
    copy: "Conditions where you do your best work",
  },
];

function scoreLocally(quiz: QuizItem[], answers: Record<string, string>, roles: Role[]) {
  const scores: Record<string, number> = {};
  const possible: Record<string, number> = {};
  const support: Record<string, number> = {};
  const relevant: Record<string, number> = {};
  const dimensionScores: Record<string, Record<string, number>> = {};
  const dimensionPossible: Record<string, Record<string, number>> = {};
  let answered = 0;

  quiz.forEach((question) => {
    const selected = question.options.find(
      (option) => option.id === answers[question.id],
    );
    const questionMax: Record<string, number> = {};
    question.options.forEach((option) =>
      Object.entries(option.weights).forEach(([roleId, weight]) => {
        questionMax[roleId] = Math.max(questionMax[roleId] || 0, weight);
      }),
    );
    Object.entries(questionMax).forEach(([roleId, weight]) => {
      possible[roleId] = (possible[roleId] || 0) + weight;
      if (weight > 0) relevant[roleId] = (relevant[roleId] || 0) + 1;
      dimensionPossible[roleId] ||= {};
      dimensionPossible[roleId][question.dimension] =
        (dimensionPossible[roleId][question.dimension] || 0) + weight;
    });
    if (!selected) return;
    answered += 1;
    Object.entries(selected.weights).forEach(([roleId, weight]) => {
      scores[roleId] = (scores[roleId] || 0) + weight;
      support[roleId] = (support[roleId] || 0) + (weight > 0 ? 1 : 0);
      dimensionScores[roleId] ||= {};
      dimensionScores[roleId][question.dimension] =
        (dimensionScores[roleId][question.dimension] || 0) + weight;
    });
  });

  return roles
    .map((role): Recommendation => {
      const preferenceAlignment =
        (scores[role.id] || 0) / Math.max(1, possible[role.id] || 0);
      const evidenceBreadth =
        (support[role.id] || 0) /
        Math.max(1, Math.min(answered, relevant[role.id] || 0));
      const percentage = Math.min(
        96,
        Math.round(100 * (0.82 * preferenceAlignment + 0.18 * evidenceBreadth)),
      );
      const fitDimensions = Object.entries(
        dimensionPossible[role.id] || {},
      )
        .filter(
          ([dimension, available]) =>
            available > 0 && (dimensionScores[role.id]?.[dimension] || 0) > 0,
        )
        .map(([name, available]) => ({
          name,
          score: Math.round(
            (100 * (dimensionScores[role.id]?.[name] || 0)) / available,
          ),
        }))
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        .slice(0, 3);
      return {
        role_id: role.id,
        title: role.title,
        match_percentage: percentage,
        fit_band:
          percentage >= 70
            ? "Strong signal"
            : percentage >= 52
              ? "Promising signal"
              : "Worth exploring",
        fit_dimensions: fitDimensions,
        rationale: role.rationale,
        key_topics: role.key_topics,
        top_hiring_companies: role.top_hiring_companies,
      };
    })
    .sort(
      (a, b) =>
        b.match_percentage - a.match_percentage ||
        a.title.localeCompare(b.title),
    )
    .slice(0, 3);
}

export default function CareerQuizModal({
  roles,
  onClose,
  onStarted,
}: {
  roles: Role[];
  onClose: () => void;
  onStarted: () => void;
}) {
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Recommendation[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/career/quiz`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .catch(() => fetch("/career_quiz.json").then((response) => response.json()))
      .then(setQuiz);
  }, []);

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  const assess = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/career/assess`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!response.ok) throw new Error("Assessment service unavailable");
      setResults((await response.json()).recommendations);
    } catch {
      setResults(scoreLocally(quiz, answers, roles));
    }
  };

  const current = quiz[index];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="career-assessment-title">
      <div className="quiz-modal glass-panel">
        <button className="modal-close" onClick={onClose} aria-label="Close career assessment">
          <X />
        </button>

        {!started && !results.length ? (
          <div className="assessment-intro">
            <div className="eyebrow">
              <Sparkles size={16} /> Evidence-informed career compass
            </div>
            <h2 id="career-assessment-title">Find the software work that fits how you think.</h2>
            <p className="assessment-lead">
              Choose between realistic work situations. We compare patterns
              across five dimensions instead of deciding from one favorite
              technology or school subject.
            </p>
            <div className="assessment-dimensions">
              {assessmentDimensions.map((dimension) => {
                const Icon = dimension.icon;
                return (
                  <article key={dimension.label}>
                    <Icon />
                    <div>
                      <strong>{dimension.label}</strong>
                      <span>{dimension.copy}</span>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="assessment-expectation">
              <CheckCircle2 />
              <div>
                <strong>{quiz.length || 18} scenarios · about 4 minutes</strong>
                <span>
                  There are no “better” answers. Choose what would still suit
                  you after the novelty wears off.
                </span>
              </div>
            </div>
            <button
              className="btn-primary assessment-start"
              disabled={!quiz.length}
              onClick={() => setStarted(true)}
            >
              Start the assessment <ArrowRight size={16} />
            </button>
            <small className="assessment-disclaimer">
              This is a career exploration aid, not a psychological diagnosis
              or hiring test.
            </small>
            <small className="assessment-method-note">
              Framework informed by the{" "}
              <a
                href="https://www.onetcenter.org/reports/IP_Manual.html"
                target="_blank"
                rel="noreferrer"
              >
                O*NET Interest Profiler
              </a>{" "}
              and{" "}
              <a
                href="https://www.onetcenter.org/content.html"
                target="_blank"
                rel="noreferrer"
              >
                O*NET Content Model
              </a>
              . Job Way’s questions and software-role mapping are original.
            </small>
          </div>
        ) : !results.length ? (
          <>
            <div className="quiz-heading-row">
              <div className="eyebrow">
                <Sparkles size={16} /> {current?.dimension || "Career compass"}
              </div>
              <span>
                {index + 1} / {quiz.length || 18}
              </span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Assessment progress"
              aria-valuemin={1}
              aria-valuemax={quiz.length || 18}
              aria-valuenow={index + 1}
            >
              <span style={{ width: `${((index + 1) / (quiz.length || 18)) * 100}%` }} />
            </div>
            <p className="quiz-instruction">Choose the option most like your natural preference.</p>
            <h2 id="career-assessment-title">{current?.scenario || "Loading your career compass…"}</h2>
            <div className="quiz-options">
              {current?.options.map((option) => (
                <button
                  key={option.id}
                  className={
                    answers[current.id] === option.id
                      ? "quiz-option selected"
                      : "quiz-option"
                  }
                  aria-pressed={answers[current.id] === option.id}
                  onClick={() => setAnswers({ ...answers, [current.id]: option.id })}
                >
                  <span>{option.id.toUpperCase()}</span>
                  {option.label}
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => (index ? setIndex(index - 1) : setStarted(false))}
              >
                <ArrowLeft size={16} /> {index ? "Back" : "Overview"}
              </button>
              {index < quiz.length - 1 ? (
                <button
                  className="btn-primary"
                  disabled={!answers[current?.id]}
                  onClick={() => setIndex(index + 1)}
                >
                  Next <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  className="btn-primary"
                  disabled={Object.keys(answers).length < quiz.length}
                  onClick={assess}
                >
                  See my fit signals
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="eyebrow">
              <Sparkles size={16} /> Your strongest role signals
            </div>
            <h2 id="career-assessment-title">Three paths worth testing in practice</h2>
            <p className="result-explainer">
              Treat these as hypotheses. Open a roadmap, try its first learning
              checkpoint, and notice whether the actual work keeps your interest.
            </p>
            <div className="recommendations">
              {results.map((item, rank) => (
                <article
                  className={rank === 0 ? "recommendation top-result" : "recommendation"}
                  key={item.role_id}
                >
                  <div className="match-ring">
                    <strong>{item.match_percentage}</strong>
                    <small>fit signal</small>
                  </div>
                  <div>
                    <span className="rank">
                      #{rank + 1} · {item.fit_band || "Career signal"}
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.rationale}</p>
                    {!!item.fit_dimensions?.length && (
                      <div className="fit-dimensions" aria-label="Strongest matching dimensions">
                        {item.fit_dimensions.map((dimension) => (
                          <span key={dimension.name}>
                            {dimension.name} <b>{dimension.score}</b>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="chip-row">
                      {item.key_topics.slice(0, 4).map((topic) => (
                        <span className="chip" key={topic}>{topic}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={async () => {
                      await selectWorkflow("role", item.role_id);
                      onStarted();
                    }}
                  >
                    Try this roadmap
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
