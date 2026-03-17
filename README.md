#  PathPilot – AI-Powered Career Guidance Platform

> An intelligent full-stack platform that leverages psychometric analysis and machine learning to provide personalized career recommendations and skill development guidance.

---

## ❗ Problem Statement

Choosing the right career path is one of the most challenging decisions for students and professionals. Traditional career guidance methods are often generic, static, and fail to consider an individual's personality, interests, and skills.

As a result, many individuals end up in careers that do not align with their strengths, leading to dissatisfaction and underperformance.

**PathPilot aims to solve this problem by using AI-driven psychometric analysis to deliver personalized, data-driven career recommendations.**

---

##  Why PathPilot?

PathPilot was built to explore the intersection of **Artificial Intelligence and real-world career decision-making**.

The goal is to move beyond generic career advice and create a system that:

* Understands individual personality traits
* Analyzes user interests and behavioral patterns
* Recommends careers based on data, not assumptions
* Provides actionable skill development paths

This project reflects a vision of building **intelligent systems that guide people toward better life decisions using AI**.

---

## Overview

PathPilot is an AI-powered career prediction and counseling platform that integrates:

* Psychometric assessment (RIASEC + personality traits)
* Ensemble machine learning models
* Skill gap analysis
* Career comparison analytics
* AI chatbot guidance
* Structured learning pathways

---

## Key Features

*    **AI-Based Career Prediction**

  * Ensemble model (XGBoost, SVM, Gradient Boosting)
  * Top 3 career recommendations with confidence scores

*    **Psychometric Assessment**

  * Converts user responses into structured personality vectors
  * Based on industry-recognized frameworks

*    **Skill Gap Analysis**

  * Identifies missing skills for selected careers
  * Provides improvement roadmap

*    **Career Comparison**

  * Compare multiple careers based on:

    * Salary
    * Growth rate
    * Skill requirements
    * Learning curve

*    **AI Chatbot Assistant**

  * Career guidance and roadmap suggestions
  * Context-aware responses *(planned enhancement)*

*    **Multilingual Support** *(Planned)*

  * Improved accessibility across regions

*    **Career Resources**

  * Learning paths, courses, and interview preparation

---

##  Highlights

* Microservice-based architecture (Node.js + FastAPI)
* Ensemble ML model with explainability (SHAP)
* Real-time skill gap analysis engine
* Scalable full-stack design
* Clean modular architecture for extensibility

---

## System Architecture

```
Frontend (React / Next.js)
        ↓
Node.js Backend (API Layer)
        ↓
Python FastAPI (ML Service)
        ↓
MongoDB Database
```

---

## Tech Stack

###  Frontend

* React / Next.js
* Tailwind CSS
* Recharts (Data Visualization)
* Axios (API communication)

###  Backend

* Node.js
* Express.js
* JWT Authentication
* Mongoose (MongoDB ODM)

###  Machine Learning

* Python (FastAPI)
* Scikit-learn
* XGBoost
* Support Vector Machine (SVM)
* Gradient Boosting
* SHAP (Explainable AI)
* Joblib (Model serialization)

### 🗄 Database

* MongoDB Atlas

---

##  Machine Learning Pipeline

1. Psychometric data collection
2. Feature engineering (trait vector generation)
3. Model training (offline)
4. Ensemble learning (majority voting)
5. Model serialization using Joblib
6. Deployment via FastAPI
7. Real-time inference

---

##  Model Details

| Model             | Purpose                         |
| ----------------- | ------------------------------- |
| XGBoost           | High accuracy predictions       |
| SVM               | High-dimensional classification |
| Gradient Boosting | Ensemble refinement             |
| Random Forest     | Baseline comparison             |

**Ensemble Strategy:** Majority Voting
**Output:** Top 3 career recommendations

---

## 📂 Project Structure

```
pathpilot-ai-career-platform
│
├── frontend/          # React frontend
├── backend/           # Node.js backend
├── ml-service/        # Python ML service
├── dataset/           # Training datasets
├── docs/              # Documentation
├── scripts/           # Utility scripts
└── docker/            # Docker configs (future)
```

---

##  Getting Started

### 1️⃣ Clone the Repository

```
git clone https://github.com/Harshit-Choubey/Pathpilot-AI-Powered-Career-Guidance-System.git
cd pathpilot-ai-career-platform
```

---

### 2️⃣ Setup Frontend

```
cd frontend
npm install
npm run dev
```

---

### 3️⃣ Setup Backend

```
cd backend
npm install
npm run dev
```

---

### 4️⃣ Setup ML Service

```
cd ml-service
pip install -r requirements.txt
uvicorn api.main:app --reload
```

---

##  Environment Variables

Create `.env` file in backend:

```
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
```

---

##  Development Workflow

* Git-based version control
* Feature-based commits
* Modular architecture
* REST API communication
* Microservice design

---

##  Learning Outcomes

* Designed an end-to-end ML pipeline
* Built a scalable full-stack architecture
* Integrated ML models into production APIs
* Applied explainable AI techniques (SHAP)
* Implemented microservice-based system design

---

## Current Status

*  Project structure initialized
*  GitHub repository setup
*  Frontend development in progress
*  Backend APIs under development
*  ML model training pending

---

##  Future Enhancements

* Resume parsing using NLP
* Real-time job API integration (LinkedIn, Naukri)
* Live mentor-based career counseling
* Gamified assessments
* Model retraining pipeline
* Advanced chatbot (LLM integration)

---

##  Author

**Harshit Choubey**

---

##  License

This project is for educational and portfolio purposes.
