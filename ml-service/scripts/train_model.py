"""
PathPilot Model Training Script
Trains XGBoost, SVM, and Gradient Boosting classifiers
Saves: individual models + ensemble metadata via Joblib
"""

import numpy as np
import pandas as pd
import joblib
import json
import os
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.svm import SVC
from sklearn.ensemble import GradientBoostingClassifier, VotingClassifier
from sklearn.metrics import classification_report, accuracy_score
from xgboost import XGBClassifier

# ── Config ────────────────────────────────────────────────────────────────────
DATASET_PATH  = "../datasets/career_dataset.csv"
MODEL_DIR     = "./models"
RANDOM_STATE  = 42
TEST_SIZE     = 0.2

FEATURES = [
    "analytical", "creative", "social", "leadership", "technical",
    "riskTolerance", "detail_oriented", "entrepreneurial", "empathy", "communication"
]

os.makedirs(MODEL_DIR, exist_ok=True)


def load_data():
    df = pd.read_csv(DATASET_PATH)
    X  = df[FEATURES].values
    y  = df["career"].values
    print(f"✅ Loaded dataset: {df.shape[0]} rows, {len(set(y))} classes")
    return X, y


def train(X, y):
    # Encode labels
    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y_enc, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y_enc
    )

    # ── Model 1: XGBoost ───────────────────────────────────────────────────
    print("\n🚀 Training XGBoost...")
    xgb = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric="mlogloss",
        random_state=RANDOM_STATE,
    )
    xgb.fit(X_train, y_train)
    xgb_acc = accuracy_score(y_test, xgb.predict(X_test))
    print(f"   XGBoost Accuracy: {xgb_acc:.4f}")

    # ── Model 2: SVM ────────────────────────────────────────────────────────
    print("\n🚀 Training SVM...")
    svm = SVC(
        kernel="rbf",
        C=10,
        gamma="scale",
        probability=True,
        random_state=RANDOM_STATE,
    )
    svm.fit(X_train, y_train)
    svm_acc = accuracy_score(y_test, svm.predict(X_test))
    print(f"   SVM Accuracy: {svm_acc:.4f}")

    # ── Model 3: Gradient Boosting ─────────────────────────────────────────
    print("\n🚀 Training Gradient Boosting...")
    gb = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.1,
        subsample=0.8,
        random_state=RANDOM_STATE,
    )
    gb.fit(X_train, y_train)
    gb_acc = accuracy_score(y_test, gb.predict(X_test))
    print(f"   Gradient Boosting Accuracy: {gb_acc:.4f}")

    # ── Ensemble: Soft Voting ──────────────────────────────────────────────
    print("\n🚀 Building Ensemble (soft voting)...")
    ensemble = VotingClassifier(
        estimators=[("xgb", xgb), ("svm", svm), ("gb", gb)],
        voting="soft",
    )
    ensemble.fit(X_train, y_train)
    ens_acc = accuracy_score(y_test, ensemble.predict(X_test))
    print(f"   Ensemble Accuracy: {ens_acc:.4f}")

    # ── Cross-Validation ───────────────────────────────────────────────────
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    cv_scores = cross_val_score(ensemble, X_scaled, y_enc, cv=cv, scoring="accuracy")
    print(f"\n📊 5-Fold CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # ── Classification Report ──────────────────────────────────────────────
    y_pred = ensemble.predict(X_test)
    print("\n📋 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    return xgb, svm, gb, ensemble, scaler, le


def save_models(xgb, svm, gb, ensemble, scaler, le):
    joblib.dump(xgb,      f"{MODEL_DIR}/xgb_model.joblib")
    joblib.dump(svm,      f"{MODEL_DIR}/svm_model.joblib")
    joblib.dump(gb,       f"{MODEL_DIR}/gb_model.joblib")
    joblib.dump(ensemble, f"{MODEL_DIR}/ensemble_model.joblib")
    joblib.dump(scaler,   f"{MODEL_DIR}/scaler.joblib")
    joblib.dump(le,       f"{MODEL_DIR}/label_encoder.joblib")

    # Save metadata
    meta = {
        "features": FEATURES,
        "classes": list(le.classes_),
        "n_classes": len(le.classes_),
        "model_files": {
            "xgboost":           "xgb_model.joblib",
            "svm":               "svm_model.joblib",
            "gradient_boosting": "gb_model.joblib",
            "ensemble":          "ensemble_model.joblib",
            "scaler":            "scaler.joblib",
            "label_encoder":     "label_encoder.joblib",
        },
    }
    with open(f"{MODEL_DIR}/metadata.json", "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\n✅ All models saved to {MODEL_DIR}/")


if __name__ == "__main__":
    X, y = load_data()
    xgb, svm, gb, ensemble, scaler, le = train(X, y)
    save_models(xgb, svm, gb, ensemble, scaler, le)
