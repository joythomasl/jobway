import json
import unittest
from pathlib import Path

from backend.career_compass import _roles, assess_career_interest, load_quiz
from backend.workflow_engine import get_role_workflow
from backend.company_predictor import calculate_company_chances

ROOT = Path(__file__).resolve().parents[1]


class RecommendationTests(unittest.TestCase):
    def test_quiz_returns_top_three(self):
        answers = {item["id"]: item["options"][0]["id"] for item in load_quiz()}
        result = assess_career_interest(answers)
        self.assertEqual(len(result), 3)
        self.assertTrue(all(0 <= item["match_percentage"] <= 100 for item in result))

    def test_expanded_catalogue_and_multidimensional_assessment(self):
        quiz = load_quiz()
        self.assertEqual(len(_roles()), 12)
        self.assertEqual(len(quiz), 18)
        self.assertGreaterEqual(len({item["dimension"] for item in quiz}), 5)
        self.assertTrue(all(len(item["options"]) == 4 for item in quiz))
        role_coverage = {role_id: 0 for role_id in _roles()}
        for item in quiz:
            for role_id in {
                role_id
                for option in item["options"]
                for role_id in option["weights"]
            }:
                role_coverage[role_id] += 1
        self.assertTrue(all(count >= 5 for count in role_coverage.values()))

    def test_new_job_has_a_populated_roadmap(self):
        questions = json.loads((ROOT / "frontend/public/questions.json").read_text(encoding="utf-8"))
        workflow = get_role_workflow("mobile_swe", questions)
        self.assertEqual(len(workflow["phases"]), 4)
        self.assertGreater(sum(phase["total"] for phase in workflow["phases"]), 0)

    def test_predictor_groups_every_company(self):
        questions = json.loads((ROOT / "frontend/public/questions.json").read_text(encoding="utf-8"))
        profiles = json.loads((ROOT / "frontend/public/company_profiles.json").read_text(encoding="utf-8"))["companies"]
        result = calculate_company_chances(questions, profiles, {"solved_questions": ["two-sum"]})
        self.assertEqual(set(result), {"high_chance", "within_reach", "stretch_targets"})
        self.assertEqual(sum(map(len, result.values())), len(profiles))


if __name__ == "__main__":
    unittest.main()
