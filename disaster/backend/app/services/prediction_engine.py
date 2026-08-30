import numpy as np
from sklearn.ensemble import RandomForestRegressor
from typing import Dict, Any

class ResourceDemandPredictor:
    def __init__(self):
        self.model_food = RandomForestRegressor(n_estimators=80, random_state=42)
        self.model_water = RandomForestRegressor(n_estimators=80, random_state=42)
        self.model_med = RandomForestRegressor(n_estimators=80, random_state=42)
        self.model_shelter = RandomForestRegressor(n_estimators=80, random_state=42)
        self._train_baseline_models()

    def _train_baseline_models(self):
        np.random.seed(42)
        N = 1200
        X = np.random.uniform([500, 1.0, 0.0, 0.05, 1.0], [50000, 10.0, 4.0, 0.95, 10.0], size=(N, 5))
        
        y_food = X[:, 0] * (X[:, 1] / 10.0) * (0.8 + 0.3 * X[:, 3]) * np.random.uniform(0.95, 1.05, N)
        y_water = y_food * 3.0 * np.random.uniform(0.95, 1.05, N)
        y_med = (X[:, 0] * 0.03) * (X[:, 1] / 10.0) * (1.0 + X[:, 2]) * np.random.uniform(0.9, 1.1, N)
        y_shelter = X[:, 0] * X[:, 3] * 0.6 * np.random.uniform(0.9, 1.1, N)

        self.model_food.fit(X, y_food)
        self.model_water.fit(X, y_water)
        self.model_med.fit(X, y_med)
        self.model_shelter.fit(X, y_shelter)

    def predict(self, population: int, severity: float, flood_depth: float, damage_pct: float, isolation_days: float, vulnerability_index: float = 1.0) -> Dict[str, Dict[str, int]]:
        features = np.array([[population, severity, flood_depth, damage_pct, isolation_days]])
        
        food_pred = self.model_food.predict(features)[0] * vulnerability_index
        water_pred = self.model_water.predict(features)[0] * vulnerability_index
        med_pred = self.model_med.predict(features)[0] * (vulnerability_index * 1.25)
        shelter_pred = self.model_shelter.predict(features)[0] * vulnerability_index

        def ci(val, variance=0.08):
            return {
                "point_estimate": int(max(0, round(val))),
                "ci_lower": int(max(0, round(val * (1.0 - variance)))),
                "ci_upper": int(max(0, round(val * (1.0 + variance))))
            }

        return {
            "food_packets": ci(food_pred),
            "water_liters": ci(water_pred),
            "medical_kits": ci(med_pred, variance=0.12),
            "shelter_capacity": ci(shelter_pred, variance=0.10)
        }

demand_predictor = ResourceDemandPredictor()
