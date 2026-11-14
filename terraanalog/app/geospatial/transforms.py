"""
TerraAnalog - Geospatial Processing & Coordinate Transformations
Implements Geodetic (WGS84) to local ENU (East-North-Up) projection for AR,
plus bounding box intersection and zonal terrain operators.
"""
import math
from typing import Tuple, List, Dict, Any

# WGS84 Ellipsoid constants
WGS84_A = 6378137.0         # Semi-major axis (meters)
WGS84_F = 1.0 / 298.257223563 # Flattening
WGS84_B = WGS84_A * (1.0 - WGS84_F)
WGS84_E2 = 1.0 - (WGS84_B * WGS84_B) / (WGS84_A * WGS84_A) # First eccentricity squared

def geodetic_to_ecef(lat_deg: float, lon_deg: float, alt_m: float) -> Tuple[float, float, float]:
    """Convert WGS84 (lat, lon, alt) to Earth-Centered Earth-Fixed (ECEF) X, Y, Z in meters"""
    lat_rad = math.radians(lat_deg)
    lon_rad = math.radians(lon_deg)
    
    sin_lat = math.sin(lat_rad)
    cos_lat = math.cos(lat_rad)
    sin_lon = math.sin(lon_rad)
    cos_lon = math.cos(lon_rad)
    
    # Prime vertical radius of curvature
    n = WGS84_A / math.sqrt(1.0 - WGS84_E2 * sin_lat * sin_lat)
    
    x = (n + alt_m) * cos_lat * cos_lon
    y = (n + alt_m) * cos_lat * sin_lon
    z = (n * (1.0 - WGS84_E2) + alt_m) * sin_lat
    
    return x, y, z

def ecef_to_enu(
    x: float, y: float, z: float,
    ref_lat_deg: float, ref_lon_deg: float, ref_alt_m: float
) -> Tuple[float, float, float]:
    """Convert ECEF coordinates to local East-North-Up (ENU) coordinates relative to a reference origin"""
    ref_x, ref_y, ref_z = geodetic_to_ecef(ref_lat_deg, ref_lon_deg, ref_alt_m)
    
    dx = x - ref_x
    dy = y - ref_y
    dz = z - ref_z
    
    ref_lat_rad = math.radians(ref_lat_deg)
    ref_lon_rad = math.radians(ref_lon_deg)
    
    sin_lat = math.sin(ref_lat_rad)
    cos_lat = math.cos(ref_lat_rad)
    sin_lon = math.sin(ref_lon_rad)
    cos_lon = math.cos(ref_lon_rad)
    
    # Rotation matrix to ENU
    east = -sin_lon * dx + cos_lon * dy
    north = -sin_lat * cos_lon * dx - sin_lat * sin_lon * dy + cos_lat * dz
    up = cos_lat * cos_lon * dx + cos_lat * sin_lon * dy + sin_lat * dz
    
    return east, north, up

def geodetic_to_enu(
    lat_deg: float, lon_deg: float, alt_m: float,
    ref_lat_deg: float, ref_lon_deg: float, ref_alt_m: float
) -> Tuple[float, float, float]:
    """Direct conversion from target WGS84 to local ENU (East, North, Up) coordinates in meters"""
    x, y, z = geodetic_to_ecef(lat_deg, lon_deg, alt_m)
    return ecef_to_enu(x, y, z, ref_lat_deg, ref_lon_deg, ref_alt_m)

def bbox_intersects(bbox_a: List[float], bbox_b: List[float]) -> bool:
    """
    Check if two bounding boxes [min_lon, min_lat, max_lon, max_lat] intersect.
    """
    return not (
        bbox_a[2] < bbox_b[0] or # a_max_x < b_min_x
        bbox_a[0] > bbox_b[2] or # a_min_x > b_max_x
        bbox_a[3] < bbox_b[1] or # a_max_y < b_min_y
        bbox_a[1] > bbox_b[3]    # a_min_y > b_max_y
    )
