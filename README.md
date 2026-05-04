# PathPilot - AI Career Execution OS 🚀

Welcome to **PathPilot** — a complete Career Execution Operating System that leverages psychometric analysis pipelines, ensemble ML models, and Generative AI (Groq) to assess capabilities, generate execution roadmaps, and provide a comprehensive learning dashboard.

> [!TIP]
> **To read the detailed technical documentation, please see [DETAILED_README.md](./DETAILED_README.md).**

## ⚡ Plug & Play Local Setup (For Sharing)

We've bundled everything you need to run the entire cluster (Frontend, Backend, ML Service, Celery Queue, Redis, Postgres) locally with **one click**. You do NOT need Node.js or Python installed on your machine.

### Requirements
* **Docker Desktop** installed and running.

### Start the Application
**For Windows Users:**
1. Double click `start.bat` OR run `start.bat` in your terminal.

**For Mac/Linux Users:**
1. Make the script executable: `chmod +x start.sh`
2. Run it: `./start.sh`

> [!NOTE]
> The start scripts automatically initialize your `.env` variables, execute database migrations, build the React frontend, and boot the entire web application inside Docker.

### What to expect:
* The web app will be available at: **http://localhost:5173**
* To use Generative AI features (like "Chat with Mentor" or "Generate Roadmap"), make sure to add your **Groq API Key** to `backend/.env` under `GROQ_API_KEY=your_key` (if it isn't already there).

## 🛠️ Important Links & Health Checks

Once the system is running, you can monitor the health and interact with documentation directly through these links:

* **Web Application:** [http://localhost:5173](http://localhost:5173)
* **Backend API Swagger Docs:** [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs) *(Monitor all endpoints, test JWT auth directly)*
* **Backend Health Status:** [http://localhost:8000/health](http://localhost:8000/health)
* **ML Service API Docs:** [http://localhost:8001/docs](http://localhost:8001/docs) *(Interact directly with the XGBoost/Ensemble predictor)*
* **ML Service Health Status:** [http://localhost:8001/health](http://localhost:8001/health)

## 🐛 Troubleshooting

* **API errors on boot?** Make sure you wait ~10 seconds on the first run for the Postgres database migrations to finish executing before logging in.
* **Celery errors?** Ensure you don't have local Redis running on port `6379` that might conflict with the Docker Redis.
* **AI Mentor fails to respond?** You need a valid `GROQ_API_KEY` in `backend/.env`.
