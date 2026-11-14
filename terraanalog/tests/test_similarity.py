"""
TerraAnalog - Unit Tests: Mathematical Similarity Engine
Validates Gaussian kernel calculation, quality-weighting, missing variables handling,
and data coverage thresholding.
"""
import unittest
import math
import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.similarity.engine import SimilarityEngine
from app.features.definitions import get_lithology_similarity

class TestSimilarityEngine(unittest.TestCase):
    
    def setUp(self):
        self.engine = SimilarityEngine()

    def test_gaussian_similarity_exact_match(self):
        """When delta is 0, Gaussian similarity must be exactly 1.0 (100%)"""
        s_i, delta, _ = self.engine.compute_variable_similarity("slope_mean", 10.0, 10.0, custom_tau=4.0)
        self.assertEqual(delta, 0.0)
        self.assertAlmostEqual(s_i, 1.0, places=5)

    def test_gaussian_similarity_at_one_tau(self):
        """When delta == tau, s_i = exp(-0.5 * 1^2) = exp(-0.5) ~= 0.60653"""
        s_i, delta, _ = self.engine.compute_variable_similarity("slope_mean", 14.0, 10.0, custom_tau=4.0)
        self.assertEqual(delta, 4.0)
        expected = math.exp(-0.5)
        self.assertAlmostEqual(s_i, expected, places=4)

    def test_gaussian_similarity_at_two_tau(self):
        """When delta == 2*tau, s_i = exp(-0.5 * 4) = exp(-2.0) ~= 0.13533"""
        s_i, delta, _ = self.engine.compute_variable_similarity("slope_mean", 18.0, 10.0, custom_tau=4.0)
        self.assertEqual(delta, 8.0)
        expected = math.exp(-2.0)
        self.assertAlmostEqual(s_i, expected, places=4)

    def test_categorical_lithology_compatibility(self):
        """Test categorical lithology matrix lookup"""
        # Exact match
        self.assertEqual(get_lithology_similarity("basalt", "basalt"), 1.0)
        # Moderate compatibility
        self.assertEqual(get_lithology_similarity("basalt", "anorthosite"), 0.65)
        # Low compatibility
        self.assertEqual(get_lithology_similarity("basalt", "evaporite_salar"), 0.20)

    def test_missing_variable_does_not_impute_zero_or_one(self):
        """Missing variable must not count as 0.0 or 1.0 in physical similarity, but must lower coverage"""
        mock_region = {"id": "reg_test", "name": "Test Region"}
        mock_target = {"id": "tgt_test", "name": "Test Target", "body": "Mars"}
        
        # Only 1 variable measured
        earth_meas = [{"feature_key": "slope_mean", "value_numeric": 5.0, "quality": 1.0}]
        target_meas = [{"feature_key": "slope_mean", "value_numeric": 5.0, "quality": 1.0}]
        
        res = self.engine.evaluate_candidate(mock_region, mock_target, earth_meas, target_meas)
        
        # Physical similarity for the measured variable is 100%
        self.assertEqual(res.physical_similarity, 100.0)
        # But data coverage must be very low because other variables are missing
        self.assertLess(res.data_coverage, 30.0)
        # Must be marked provisional because coverage < 60%
        self.assertTrue(res.is_provisional)
        self.assertEqual(res.classification, "Provisional (Low Data)")
        self.assertGreater(len(res.missing_variables), 5)

if __name__ == "__main__":
    unittest.main()
