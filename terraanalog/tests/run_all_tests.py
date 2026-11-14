"""
TerraAnalog - Automated Test Runner
Executes all unit and integration test suites.
"""
import unittest
import sys
import os

if __name__ == "__main__":
    test_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(test_dir)
    sys.path.insert(0, project_dir)
    
    loader = unittest.TestLoader()
    suite = loader.discover(start_dir=test_dir, pattern="test_*.py")
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("=" * 60)
    print(f"Tests run: {result.testsRun}")
    print(f"Errors: {len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print("=" * 60)
    
    sys.exit(0 if result.wasSuccessful() else 1)
