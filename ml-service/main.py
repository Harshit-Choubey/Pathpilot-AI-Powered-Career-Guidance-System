from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import joblib
import numpy as np
import shap
import warnings
import os
import json
from contextlib import asynccontextmanager

warnings.filterwarnings('ignore')

# Global variables to hold loaded models
models = {}
meta = {}

class PredictionRequest(BaseModel):
    features: list[float] = Field(..., min_length=10, max_length=10)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load models at startup
    model_dir = "models"
    try:
        models["ensemble"] = joblib.load(os.path.join(model_dir, "ensemble_model.joblib"))
        models["scaler"] = joblib.load(os.path.join(model_dir, "scaler.joblib"))
        models["le"] = joblib.load(os.path.join(model_dir, "label_encoder.joblib"))
        
        # Load XGBoost specifically for SHAP explanations (TreeExplainer)
        models["xgb"] = joblib.load(os.path.join(model_dir, "xgb_model.joblib"))
        
        with open(os.path.join(model_dir, "metadata.json"), "r") as f:
            global meta
            meta = json.load(f)
            
        print("Models loaded successfully.")
    except Exception as e:
        print(f"Warning: Could not load models. Did you run the training script? Error: {e}")
    yield
    # Cleanup on shutdown (if any)
    models.clear()

app = FastAPI(title="PathPilot ML Service", lifespan=lifespan)

@app.get("/health")
def health_check():
    if "ensemble" not in models:
        return {"status": "degraded", "message": "Models not loaded"}
    return {"status": "ok"}

@app.post("/predict")
def predict_career(request: PredictionRequest):
    if "ensemble" not in models:
        raise HTTPException(status_code=503, detail="Models not loaded")
        
    try:
        # Convert to numpy array and reshape
        X_raw = np.array(request.features).reshape(1, -1)
        
        # Scale features
        X_scaled = models["scaler"].transform(X_raw)
        
        # Get probabilities from the ensemble
        probas = models["ensemble"].predict_proba(X_scaled)[0]
        
        # Get top 3 predictions
        top_3_idx = np.argsort(probas)[-3:][::-1]
        
        classes = models["le"].inverse_transform(top_3_idx)
        top_probas = probas[top_3_idx]
        
        predictions = []
        for career, prob in zip(classes, top_probas):
            predictions.append({
                "career": career,
                "matchPercentage": float(round(prob * 100, 2))
            })
            
        return {"predictions": predictions}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain")
def explain_prediction(request: PredictionRequest):
    """
    Returns SHAP values to explain WHY the model made its prediction
    Using the XGBoost model as proxy for the ensemble for tree-based explanations
    """
    if "xgb" not in models:
        raise HTTPException(status_code=503, detail="XGBoost model not loaded for SHAP")
        
    try:
        X_raw = np.array(request.features).reshape(1, -1)
        X_scaled = models["scaler"].transform(X_raw)
        
        # TreeExplainer is fast for XGBoost
        explainer = shap.TreeExplainer(models["xgb"])
        shap_values = explainer.shap_values(X_scaled)
        
        # Format the output matching features to their importance
        # For multi-class, shap_values is a list of arrays (one per class)
        # Simplify by providing top global feature importances for this specific user
        
        feature_names = meta.get("features", [])
        
        # Get predicted class from XGB
        pred_class_idx = models["xgb"].predict(X_scaled)[0]
        pred_class_name = models["le"].inverse_transform([pred_class_idx])[0]
        
        # Get SHAP values for the predicted class
        # (Handling different SHAP output formats based on version/multiclass)
        if isinstance(shap_values, list):
            class_shap = shap_values[pred_class_idx][0]
        else:
            # If 3D array (samples, features, classes)
            if len(shap_values.shape) == 3:
                class_shap = shap_values[0, :, pred_class_idx]
            else:
                class_shap = shap_values[0]
                
        # Combine feature names with their importance values
        importance = []
        for name, val in zip(feature_names, class_shap):
            importance.append({
                "feature": name,
                "importance": float(round(val, 4)),
                "impact": "positive" if val > 0 else "negative"
            })
            
        # Sort by absolute importance
        importance.sort(key=lambda x: abs(x["importance"]), reverse=True)
        
        return {
            "predicted_career_for_explanation": pred_class_name,
            "feature_importance": importance
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
