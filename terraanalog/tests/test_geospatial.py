"""
TerraAnalog - Unit Tests: Geospatial Transformations
Validates Geodetic to ENU projections and bounding box intersections.
"""
import unittest
import math
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.geospatial.transforms import geodetic_to_ecef, geodetic_to_enu, bbox_intersects

class TestGeospatialTransforms(unittest.TestCase):

    def test_enu_origin_is_zero(self):
        """Converting the reference point itself to ENU must yield (0, 0, 0)"""
        lat, lon, alt = 31.77, -113.50, 1190.0
        east, north, up = geodetic_to_enu(lat, lon, alt, lat, lon, alt)
        self.assertAlmostEqual(east, 0.0, places=2)
        self.assertAlmostEqual(north, 0.0, places=2)
        self.assertAlmostEqual(up, 0.0, places=2)

    def test_enu_north_displacement(self):
        """Moving 0.01 degrees north (~1110 meters) should yield positive North in ENU"""
        lat0, lon0, alt0 = 0.0, 0.0, 0.0
        lat1, lon1, alt1 = 0.01, 0.0, 0.0
        east, north, up = geodetic_to_enu(lat1, lon1, alt1, lat0, lon0, alt0)
        self.assertAlmostEqual(east, 0.0, places=1)
        self.assertGreater(north, 1100.0)
        self.assertLess(north, 1120.0)

    def test_bbox_intersection(self):
        box1 = [-114.0, 31.0, -113.0, 32.0]
        box2 = [-113.5, 31.5, -112.5, 32.5] # Overlaps
        box3 = [-110.0, 30.0, -109.0, 31.0] # Disjoint
        
        self.assertTrue(bbox_intersects(box1, box2))
        self.assertFalse(bbox_intersects(box1, box3))

if __name__ == "__main__":
    unittest.main()
