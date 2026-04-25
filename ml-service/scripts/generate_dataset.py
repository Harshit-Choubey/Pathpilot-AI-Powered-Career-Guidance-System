"""
Synthetic Dataset Generator for PathPilot
Creates ~5000 samples of psychometric trait features → career label
Traits: analytical, creative, social, leadership, technical,
        riskTolerance, detail_oriented, entrepreneurial, empathy, communication
18 Career classes
"""

import numpy as np
import pandas as pd
import os

np.random.seed(42)

TRAITS = [
    "analytical", "creative", "social", "leadership", "technical",
    "riskTolerance", "detail_oriented", "entrepreneurial", "empathy", "communication"
]

# Each career defined by its ideal mean trait profile (0–1 scale) and std deviation
CAREER_PROFILES = {
    "Software Engineer":          [0.80, 0.60, 0.40, 0.40, 0.90, 0.50, 0.75, 0.45, 0.35, 0.55],
    "Data Scientist":             [0.95, 0.55, 0.40, 0.45, 0.80, 0.55, 0.85, 0.40, 0.35, 0.60],
    "Machine Learning Engineer":  [0.90, 0.60, 0.35, 0.45, 0.92, 0.60, 0.85, 0.50, 0.30, 0.50],
    "UX/UI Designer":             [0.55, 0.92, 0.70, 0.45, 0.50, 0.50, 0.80, 0.55, 0.85, 0.75],
    "Product Manager":            [0.70, 0.65, 0.80, 0.90, 0.55, 0.65, 0.60, 0.78, 0.75, 0.90],
    "Cybersecurity Analyst":      [0.88, 0.55, 0.40, 0.50, 0.85, 0.60, 0.90, 0.40, 0.35, 0.55],
    "DevOps Engineer":            [0.80, 0.45, 0.45, 0.55, 0.90, 0.65, 0.82, 0.50, 0.35, 0.55],
    "Business Analyst":           [0.82, 0.55, 0.70, 0.60, 0.55, 0.45, 0.78, 0.50, 0.60, 0.82],
    "Digital Marketing Specialist":[0.65, 0.80, 0.82, 0.55, 0.45, 0.60, 0.60, 0.70, 0.65, 0.88],
    "Doctor":                     [0.80, 0.45, 0.78, 0.65, 0.65, 0.50, 0.88, 0.35, 0.92, 0.80],
    "Nurse":                      [0.60, 0.40, 0.85, 0.55, 0.55, 0.45, 0.80, 0.30, 0.95, 0.80],
    "Teacher":                    [0.60, 0.70, 0.88, 0.65, 0.40, 0.40, 0.65, 0.35, 0.88, 0.92],
    "Civil Engineer":             [0.80, 0.50, 0.55, 0.65, 0.82, 0.55, 0.88, 0.45, 0.40, 0.60],
    "Lawyer":                     [0.88, 0.65, 0.70, 0.72, 0.45, 0.60, 0.85, 0.55, 0.60, 0.90],
    "Content Creator":            [0.50, 0.95, 0.80, 0.55, 0.50, 0.78, 0.55, 0.80, 0.68, 0.90],
    "Financial Analyst":          [0.90, 0.45, 0.50, 0.55, 0.65, 0.58, 0.90, 0.50, 0.35, 0.65],
    "Architect":                  [0.70, 0.90, 0.60, 0.60, 0.72, 0.55, 0.85, 0.55, 0.60, 0.65],
    "Research Scientist":         [0.95, 0.70, 0.40, 0.45, 0.80, 0.55, 0.92, 0.35, 0.40, 0.62],
}

SAMPLES_PER_CLASS = 278  # ~5004 total samples across 18 classes

def generate_dataset():
    rows = []
    for career, means in CAREER_PROFILES.items():
        means = np.array(means)
        std   = 0.12  # controlled noise

        for _ in range(SAMPLES_PER_CLASS):
            sample = np.random.normal(loc=means, scale=std)
            sample = np.clip(sample, 0.0, 1.0)  # keep in [0, 1]
            rows.append(list(sample) + [career])

    df = pd.DataFrame(rows, columns=TRAITS + ["career"])
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)  # shuffle
    return df


if __name__ == "__main__":
    os.makedirs("../datasets", exist_ok=True)
    df = generate_dataset()
    output_path = "../datasets/career_dataset.csv"
    df.to_csv(output_path, index=False)
    print(f"✅ Dataset saved: {output_path}")
    print(f"   Shape: {df.shape}")
    print(f"   Class distribution:\n{df['career'].value_counts()}")
