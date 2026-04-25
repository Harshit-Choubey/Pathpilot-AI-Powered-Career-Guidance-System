# PathPilot - AI Career Execution OS 🚀

Welcome to **PathPilot** — a complete Career Execution Operating System that leverages psychometric analysis pipelines, ensemble ML models, and Generative AI (Gemini) to assess capabilities, generate execution roadmaps, and provide a comprehensive learning dashboard.

> [!TIP]
> **To read the detailed technical documentation, please see [DETAILED_README.md](./DETAILED_README.md).**

## ⚡ Plug & Play Local Setup (For Team Members)

We've bundled everything you need to run the entire cluster (Frontend, Backend, ML Service, Celery Queue, Redis, Postgres) locally with one click.

### Requirements
* **Docker Desktop** installed and running.
* **Node.js** (v18+) installed.

### Start the Application
**For Windows Users:**
1. Double click `start.bat` OR run `start.bat` in your terminal.

**For Mac/Linux Users:**
1. Make the script executable: `chmod +x start.sh`
2. Run it: `./start.sh`

> [!NOTE]
> The start scripts automatically initialize your `.env` variables, start all backend Docker containers, install frontend dependencies, and boot the web application. 

### What to expect:
* The web app will pop open automatically at: **http://localhost:5173**
* To use Generative AI features (like "Generate 12-Week Roadmap"), make sure to add your Google Gemini API key to `backend/.env` under `GEMINI_API_KEY=your_key`.

## 🛠️ Important Links & Health Checks

Once the system is running, you can monitor the health and interact with documentation directly through these links:

* **Web Application:** [http://localhost:5173](http://localhost:5173)
* **Backend API Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs) *(Monitor all endpoints, test JWT auth directly)*
* **ML Service API Docs:** [http://localhost:8001/docs](http://localhost:8001/docs) *(Interact directly with the XGBoost/Ensemble predictor)*
* **ML Service Health Status:** [http://localhost:8001/health](http://localhost:8001/health)

## 🐛 Troubleshooting

* **Blank page or API errors?** Make sure you wait ~30 seconds on the first run for the Postgres database to finish initializing before logging in.
* **Celery errors?** Ensure you don't have local Redis running on port `6379` that might conflict with the Docker Redis.
* **"Failed to load roadmap"**: You need a `GEMINI_API_KEY` in `backend/.env`!
