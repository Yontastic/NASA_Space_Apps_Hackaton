"""
TerraAnalog - Unit Tests: AI Reverse Search Engine
Validates natural language intent parsing and structured criteria extraction.
"""
import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.reverse_search.engine import ReverseSearchEngine

class TestReverseSearchEngine(unittest.TestCase):
    
    def setUp(self):
        self.engine = ReverseSearchEngine()

    def test_extract_lithology_and_body_spanish(self):
        query = "busco terreno basáltico en Marte con baja pendiente"
        parsed = self.engine.parse_natural_query(query)
        self.assertEqual(parsed["detected_lithology"], "basalt")
        self.assertEqual(parsed["target_body"], "Mars")
        self.assertEqual(parsed["slope_max"], 10.0)

    def test_extract_crater_and_iron_english(self):
        query = "find an impact crater on Moon with high iron oxide > 12%"
        parsed = self.engine.parse_natural_query(query)
        self.assertEqual(parsed["detected_lithology"], "impact_melt")
        self.assertEqual(parsed["target_body"], "Moon")
        self.assertEqual(parsed["iron_oxide_min"], 12.0)

    def test_extract_permafrost_polar(self):
        query = "polar permafrost analog with low roughness"
        parsed = self.engine.parse_natural_query(query)
        self.assertEqual(parsed["detected_lithology"], "permafrost")
        self.assertEqual(parsed["detected_terrain_type"], "Polar")
        self.assertEqual(parsed["roughness_max"], 0.25)

if __name__ == "__main__":
    unittest.main()
