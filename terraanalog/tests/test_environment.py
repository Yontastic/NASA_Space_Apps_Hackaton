"""
TerraAnalog - Unit Tests: Environmental & SDG Module
Validates ethical evaluations, Protected Planet WDPA alerts, and event logging.
"""
import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.environment.engine import EnvironmentEngine

class TestEnvironmentEngine(unittest.TestCase):
    
    def setUp(self):
        self.engine = EnvironmentEngine()

    def test_cuatro_cienegas_critical_exclusion(self):
        """Cuatro Cienegas has fragile living stromatolites and must return RESTRICTED_REVIEW"""
        region = {"id": "reg_cuatro_cienegas", "name": "Cuatro Ciénegas"}
        assessment = self.engine.assess_region(region)
        self.assertEqual(assessment.risk_level, "RESTRICTED_REVIEW")
        self.assertTrue(assessment.protected_area_intersection)
        self.assertIn("EXCLUSION", assessment.recommendation)

    def test_pinacate_biosphere_reserve_alert(self):
        """El Pinacate must detect UNESCO Biosphere reserve intersection"""
        region = {"id": "reg_pinacate", "name": "El Pinacate"}
        assessment = self.engine.assess_region(region)
        self.assertEqual(assessment.risk_level, "RESTRICTED_REVIEW")
        self.assertTrue(assessment.protected_area_intersection)
        self.assertIn("CONANP", assessment.recommendation)

    def test_haughton_arctic_wilderness_low_alert(self):
        """Haughton Crater on remote Devon Island returns LOW_ALERT"""
        region = {"id": "reg_haughton", "name": "Haughton Crater"}
        assessment = self.engine.assess_region(region)
        self.assertEqual(assessment.risk_level, "LOW_ALERT")
        self.assertFalse(assessment.protected_area_intersection)

if __name__ == "__main__":
    unittest.main()
