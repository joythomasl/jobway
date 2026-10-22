import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  BrainCircuit,
  BookOpenCheck,
  Briefcase,
  Bug,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CloudCog,
  Code2,
  Compass,
  Cpu,
  Database,
  Gamepad2,
  Layers3,
  Layout,
  Palette,
  Search,
  ServerCog,
  ShieldCheck,
  Smartphone,
  Target,
} from "lucide-react";
import CareerQuizModal from "./CareerQuizModal";
import {
  calculateWorkflowTaskProgress,
  Company,
  getActiveWorkflow,
  getCompletedCheckpointCount,
  getCompanies,
  getRoles,
  Role,
  selectWorkflow,
} from "../placementApi";
import "./PlacementPortal.css";

export default function OnboardingHub() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Company | null>(null);
  const [homeProgress, setHomeProgress] = useState(0);
  const [quiz, setQuiz] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getRoles().then(setRoles);
    getCompanies().then((values) => {
      setCompanies(values);
      setSelected(
        values.find((company) => company.name === "Amazon") ||
          values[0] ||
          null,
      );
    });
    getActiveWorkflow()
      .then((workflow) => {
        const completedChecks = getCompletedCheckpointCount(
          workflow.mode,
          workflow.target_id,
        );
        setHomeProgress(
          calculateWorkflowTaskProgress(workflow, completedChecks),
        );
      })
      .catch(() => setHomeProgress(0));
  }, []);

  const matches = useMemo(
    () =>
      companies
        .filter((company) =>
          company.name.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 8),
    [companies, query],
  );
  const scrollTo = (id: string) =>
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  const start = async (mode: "role" | "company", id: string) => {
    await selectWorkflow(mode, id);
    navigate("/workflow");
  };
  const practiceCompany = (name: string) =>
    navigate(`/practice?mode=company&company=${encodeURIComponent(name)}`);
  const roleIcons: Record<string, typeof ServerCog> = {
    server: ServerCog,
    layers: Layers3,
    layout: Layout,
    brain: BrainCircuit,
    database: Database,
    cloud: CloudCog,
    cpu: Cpu,
    smartphone: Smartphone,
    shield: ShieldCheck,
    bug: Bug,
    gamepad: Gamepad2,
    palette: Palette,
  };
  const savedPath = useMemo(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("jobway-active-workflow") || "null",
      ) as { mode: "role" | "company"; target_id: string } | null;
      if (!saved) return null;
      const label =
        saved.mode === "company"
          ? saved.target_id
          : roles.find((role) => role.id === saved.target_id)?.title ||
            saved.target_id
              .split("_")
              .map((part) => part[0]?.toUpperCase() + part.slice(1))
              .join(" ");
      return { ...saved, label };
    } catch {
      return null;
    }
  }, [roles]);

  return (
    <div className="portal-page landing-page">
      <div className="opening-split">
        <section className="portal-hero hero-stage career-compass-hero">
          <div className="hero-copy">
            <div className="eyebrow compass-kicker">
              <BrainCircuit size={17} /> Career Compass · Start here
            </div>
            <h1>
              Not sure which software career fits?
              <span> Start with clarity.</span>
            </h1>
            <p>
              Work through 18 realistic scenarios to compare the roles that fit
              your interests, preferred tasks, work style, values, and
              environment.
            </p>
            <div className="hero-actions">
              <button
                className="hero-cta compass-primary"
                onClick={() => setQuiz(true)}
              >
                Find my best-fit career <ChevronRight size={17} />
              </button>
              <button
                className="hero-resume compass-secondary"
                onClick={() =>
                  savedPath ? navigate("/workflow") : scrollTo("start-options")
                }
              >
                <span>
                  {savedPath
                    ? "Continue my saved plan"
                    : "I already know my direction"}
                </span>
                {savedPath?.label || "Choose a role or company"}{" "}
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="hero-reassurance" aria-label="Assessment details">
              <span>
                <Clock3 /> About 4 minutes
              </span>
              <span>
                <CheckCircle2 /> No account required
              </span>
              <span>
                <ShieldCheck /> Recommendations, not labels
              </span>
            </div>
          </div>
          <aside
            className="career-compass-method"
            aria-label="What Career Compass considers"
          >
            <header>
              <span>HOW YOUR FIT IS EXPLORED</span>
              <h2>Five signals, considered together.</h2>
              <p>No single answer decides your result.</p>
            </header>
            <div className="compass-signal-list">
              <span>
                <Compass />
                <b>Interests</b>
                <small>What naturally holds your attention</small>
              </span>
              <span>
                <Code2 />
                <b>Daily work</b>
                <small>The tasks you want more of</small>
              </span>
              <span>
                <Layers3 />
                <b>Work style</b>
                <small>How you prefer to solve problems</small>
              </span>
              <span>
                <ShieldCheck />
                <b>Values</b>
                <small>What makes work meaningful to you</small>
              </span>
              <span>
                <Building2 />
                <b>Environment</b>
                <small>Where you are most likely to thrive</small>
              </span>
            </div>
          </aside>
        </section>

        <section id="start-options" className="start-section">
          <div className="center-heading">
            <span className="eyebrow">
              <Compass size={15} /> START YOUR WAY
            </span>
            <h2>Which sounds most like you?</h2>
            <p>No wrong door. You can switch paths at any time.</p>
          </div>
          <div className="start-grid">
            <button
              className="start-card role-start"
              onClick={() => scrollTo("roles")}
            >
              <span className="start-icon">
                <Briefcase />
              </span>
              <small>I already know</small>
              <h3>I know what I want to become</h3>
              <p>Choose a job and get its complete skill roadmap.</p>
              <b>
                Explore {roles.length || 12} career paths <ChevronRight />
              </b>
            </button>
            <button
              className="start-card quiz-start"
              onClick={() => setQuiz(true)}
            >
              <span className="start-icon">
                <BrainCircuit />
              </span>
              <small>Help me discover</small>
              <h3>I’m not sure—guide me</h3>
              <p>
                Compare your interests, work style, values, and preferred tasks.
              </p>
              <b>
                Take the career assessment <ChevronRight />
              </b>
            </button>
            <button
              className="start-card company-start"
              onClick={() => scrollTo("companies")}
            >
              <span className="start-icon">
                <Target />
              </span>
              <small>I have a target</small>
              <h3>I want to crack a company</h3>
              <p>
                Build a plan from recent company patterns and frequency data.
              </p>
              <b>
                Choose a company <ChevronRight />
              </b>
            </button>
            <button
              className="start-card dsa-start"
              onClick={() => navigate("/practice?mode=dsa")}
            >
              <span className="start-icon">
                <Code2 />
              </span>
              <small>I want to practice</small>
              <h3>Just give me DSA</h3>
              <p>
                Browse topics and difficulty levels without choosing a career
                path.
              </p>
              <b>
                Open DSA practice <ChevronRight />
              </b>
            </button>
          </div>
        </section>
      </div>

      <section
        className="home-feature-panel home-feature-ribbon"
        aria-label="Everything in Job Way"
      >
        <header>
          <div>
            <span>JOB WAY TOOLKIT</span>
            <h2>Everything you need, one step away.</h2>
          </div>
          <strong>{savedPath ? "PLAN READY" : "START FREE"}</strong>
        </header>
        <div
          className="home-status-strip"
          aria-label="Your preparation overview"
        >
          <button onClick={() => scrollTo("companies")}>
            <Building2 />
            <span>
              <strong>{companies.length || 471}</strong>
              <small>company profiles</small>
            </span>
            <ChevronRight />
          </button>
          <button onClick={() => navigate("/workflow")}>
            <CheckCircle2 />
            <span>
              <strong>{homeProgress}%</strong>
              <small>path progress</small>
            </span>
            <ChevronRight />
          </button>
          <button onClick={() => navigate("/companies/chances")}>
            <BarChart3 />
            <span>
              <strong>Live</strong>
              <small>readiness map</small>
            </span>
            <ChevronRight />
          </button>
        </div>
        <div className="home-feature-grid">
          <button onClick={() => setQuiz(true)}>
            <BrainCircuit />
            <span>
              <b>Career assessment</b>
              <small>18 evidence-informed scenarios</small>
            </span>
            <ChevronRight />
          </button>
          <button onClick={() => scrollTo("roles")}>
            <Compass />
            <span>
              <b>Role roadmaps</b>
              <small>12 guided career paths</small>
            </span>
            <ChevronRight />
          </button>
          <button onClick={() => navigate("/dashboard")}>
            <BookOpenCheck />
            <span>
              <b>Learning library</b>
              <small>Core CS and study guides</small>
            </span>
            <ChevronRight />
          </button>
          <button onClick={() => navigate("/practice?mode=dsa")}>
            <Code2 />
            <span>
              <b>Practice studio</b>
              <small>DSA, tests, and walkthroughs</small>
            </span>
            <ChevronRight />
          </button>
          <button onClick={() => scrollTo("companies")}>
            <Building2 />
            <span>
              <b>Company prep</b>
              <small>{companies.length || 471} searchable profiles</small>
            </span>
            <ChevronRight />
          </button>
          <button onClick={() => navigate("/companies/chances")}>
            <BarChart3 />
            <span>
              <b>Readiness signals</b>
              <small>See where you can apply</small>
            </span>
            <ChevronRight />
          </button>
        </div>
      </section>

      <section id="roles" className="door-section anchored-section">
        <div className="section-heading">
          <span className="door-number">01</span>
          <div>
            <h2>Choose from {roles.length || 12} career paths</h2>
            <p>
              Each job includes a sequenced curriculum, skill checkpoints, study
              material, and targeted interview practice.
            </p>
          </div>
        </div>
        <div className="role-grid">
          {roles.map((role, index) => {
            const RoleIcon = roleIcons[role.icon || "server"] || ServerCog;
            return (
              <button
                className="role-card"
                key={role.id}
                onClick={() => start("role", role.id)}
                aria-label={`Open the ${role.title} roadmap`}
              >
                <div className="role-card-accent" />
                <div className="role-icon">
                  <RoleIcon />
                </div>
                <span className="role-count">
                  PATH {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{role.title}</h3>
                <p>{role.summary}</p>
                <div className="chip-row">
                  {role.key_topics.slice(0, 4).map((topic) => (
                    <span className="chip" key={topic}>
                      {topic}
                    </span>
                  ))}
                </div>
                <span className="card-link">
                  View detailed roadmap <ChevronRight size={16} />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section
        id="companies"
        className="door-section company-door anchored-section"
      >
        <div className="section-heading">
          <span className="door-number">02</span>
          <div>
            <h2>Prepare company-wise</h2>
            <p>
              Choose between a complete company roadmap or jump directly into
              its tagged questions.
            </p>
          </div>
        </div>
        <div className="company-builder">
          <div className="company-search">
            <Search size={18} />
            <label className="sr-only" htmlFor="company-search">
              Search companies
            </label>
            <input
              id="company-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Amazon, Google, Zoho…"
            />
            <div className="company-results">
              {matches.map((company) => (
                <button
                  className={selected?.name === company.name ? "selected" : ""}
                  key={company.name}
                  onClick={() => setSelected(company)}
                  aria-pressed={selected?.name === company.name}
                >
                  <Building2 size={17} />
                  <span>
                    {company.name}
                    <small>
                      {company.problem_count || "Dataset"} tracked problems
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </div>
          {selected && (
            <div className="company-profile">
              <span className="company-monogram">
                {selected.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <span className="rank">TARGET COMPANY PROFILE</span>
                <h3>{selected.name}</h3>
                <p className="company-profile-copy">
                  Practice its recurring patterns or follow a phased plan from
                  foundations to the 30-day interview sprint.
                </p>
                <div className="difficulty-split">
                  <span
                    className="easy"
                    style={{ flex: selected.easy_pct || 1 }}
                  >
                    Easy {selected.easy_pct || 0}%
                  </span>
                  <span
                    className="medium"
                    style={{ flex: selected.medium_pct || 1 }}
                  >
                    Medium {selected.medium_pct || 0}%
                  </span>
                  <span
                    className="hard"
                    style={{ flex: selected.hard_pct || 1 }}
                  >
                    Hard {selected.hard_pct || 0}%
                  </span>
                </div>
                <div className="chip-row">
                  {selected.top_topics?.slice(0, 5).map((topic) => (
                    <span className="chip" key={topic}>
                      {topic}
                    </span>
                  ))}
                </div>
                <div className="company-cta-row">
                  <button
                    className="btn-primary"
                    onClick={() => start("company", selected.name)}
                  >
                    Build full roadmap <ChevronRight size={16} />
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => practiceCompany(selected.name)}
                  >
                    Practice questions
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="dsa-banner">
        <div className="dsa-code">
          <span>while</span> (not_interview_ready) {"{"}
          <br />
          {"  "}learn_pattern();
          <br />
          {"  "}solve_problem();
          <br />
          {"}"}
        </div>
        <div>
          <div className="eyebrow">
            <Code2 size={15} /> PURE DSA MODE
          </div>
          <h2>Want practice without a prescribed path?</h2>
          <p>
            Filter by arrays, strings, graphs, dynamic programming, difficulty,
            or company. Every coding question opens in the verified workspace.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate("/practice?mode=dsa")}
        >
          Browse DSA questions <ChevronRight size={16} />
        </button>
      </section>
      {quiz && (
        <CareerQuizModal
          roles={roles}
          onClose={() => setQuiz(false)}
          onStarted={() => navigate("/workflow")}
        />
      )}
    </div>
  );
}
