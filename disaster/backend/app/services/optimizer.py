from ortools.linear_solver import pywraplp
from typing import List, Dict, Any

class DisasterLogisticsOptimizer:
    @staticmethod
    def solve_allocation(depots: List[Dict[str, Any]], zones: List[Dict[str, Any]], priority_overrides: Dict[str, float] = None) -> Dict[str, Any]:
        solver = pywraplp.Solver.CreateSolver("SCIP")
        if not solver:
            return {"status": "FAILED", "total_fulfillment_rate": 0.0, "allocations": []}

        if priority_overrides is None:
            priority_overrides = {}

        food_vars = {}
        water_vars = {}
        med_vars = {}

        for d_idx, d in enumerate(depots):
            for z_idx, z in enumerate(zones):
                food_vars[(d_idx, z_idx)] = solver.IntVar(0, int(d["food_packets"]), f"f_{d_idx}_{z_idx}")
                water_vars[(d_idx, z_idx)] = solver.IntVar(0, int(d["water_liters"]), f"w_{d_idx}_{z_idx}")
                med_vars[(d_idx, z_idx)] = solver.IntVar(0, int(d["medical_kits"]), f"m_{d_idx}_{z_idx}")

        for d_idx, d in enumerate(depots):
            solver.Add(sum(food_vars[(d_idx, z_idx)] for z_idx in range(len(zones))) <= int(d["food_packets"]))
            solver.Add(sum(water_vars[(d_idx, z_idx)] for z_idx in range(len(zones))) <= int(d["water_liters"]))
            solver.Add(sum(med_vars[(d_idx, z_idx)] for z_idx in range(len(zones))) <= int(d["medical_kits"]))

        for z_idx, z in enumerate(zones):
            solver.Add(sum(food_vars[(d_idx, z_idx)] for d_idx in range(len(depots))) <= int(z["demands"]["food_packets"]))
            solver.Add(sum(water_vars[(d_idx, z_idx)] for d_idx in range(len(depots))) <= int(z["demands"]["water_liters"]))
            solver.Add(sum(med_vars[(d_idx, z_idx)] for d_idx in range(len(depots))) <= int(z["demands"]["medical_kits"]))

        objective = solver.Objective()
        for z_idx, z in enumerate(zones):
            z_id = z["id"]
            priority = priority_overrides.get(z_id, 1.0) * float(z.get("severity_score", 5.0))
            for d_idx, d in enumerate(depots):
                objective.SetCoefficient(food_vars[(d_idx, z_idx)], priority * 1.0)
                objective.SetCoefficient(water_vars[(d_idx, z_idx)], priority * 0.33)
                objective.SetCoefficient(med_vars[(d_idx, z_idx)], priority * 4.0)

        objective.SetMaximization()
        status = solver.Solve()

        allocations = []
        total_demanded_food = sum(z["demands"]["food_packets"] for z in zones) + 1e-6
        total_delivered_food = 0

        if status in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
            for z_idx, z in enumerate(zones):
                for d_idx, d in enumerate(depots):
                    f_val = int(food_vars[(d_idx, z_idx)].solution_value())
                    w_val = int(water_vars[(d_idx, z_idx)].solution_value())
                    m_val = int(med_vars[(d_idx, z_idx)].solution_value())

                    if f_val > 0 or w_val > 0 or m_val > 0:
                        total_delivered_food += f_val
                        coverage = round((f_val / max(1, z["demands"]["food_packets"])) * 100, 1)
                        allocations.append({
                            "zone_id": z["id"],
                            "depot_id": d["id"],
                            "allocated_food": f_val,
                            "allocated_water": w_val,
                            "allocated_medical": m_val,
                            "coverage_percentage": min(100.0, coverage),
                            "route": {
                                "type": "LineString",
                                "coordinates": [
                                    [d["longitude"], d["latitude"]],
                                    [z["longitude"], z["latitude"]]
                                ]
                            }
                        })

            return {
                "status": "OPTIMAL" if status == pywraplp.Solver.OPTIMAL else "FEASIBLE",
                "total_fulfillment_rate": round((total_delivered_food / total_demanded_food) * 100, 2),
                "allocations": allocations
            }

        return {"status": "INFEASIBLE", "total_fulfillment_rate": 0.0, "allocations": []}
