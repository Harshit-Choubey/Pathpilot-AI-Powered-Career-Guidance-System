import time
import json
import httpx
import os
from asyncio import get_event_loop
from sqlalchemy.orm import Session
from celery.utils.log import get_task_logger
from app.worker.celery_app import celery_app
from google import genai
from google.genai import types

logger = get_task_logger(__name__)

@celery_app.task(name="ml_inference_task", bind=True, max_retries=3)
def ml_inference_task(self, user_id: str, assessment_data: dict, assessment_id: str = None):
    """
    Offloads ML psychometric processing to background worker.
    Pulls AssessmentResult from DB, maps answers to features, 
    calls ML-service, and updates the db object.
    """
    logger.info(f"Starting ML Inference for user {user_id}")
    try:
        from app.db.session import SessionLocal
        from app.models.assessment import AssessmentResult
        
        # 1. Map 36 questions to 10 traits (Dummy logic for now: random mapping or basic averages)
        # Assuming Q1-Q36 format, map them down to 10 traits (scaled 0-1)
        # "analytical", "creative", "social", "leadership", "technical", 
        # "riskTolerance", "detail_oriented", "entrepreneurial", "empathy", "communication"
        
        # Simple logical mapping block
        traits = {
            "analytical": [1, 2, 3, 4],
            "creative": [5, 6, 7, 8],
            "social": [9, 10, 11, 12],
            "leadership": [13, 14, 15, 16],
            "technical": [17, 18, 19, 20],
            "riskTolerance": [21, 22, 23, 24],
            "detail_oriented": [25, 26, 27, 28],
            "entrepreneurial": [29, 30, 31, 32],
            "empathy": [33, 34],
            "communication": [35, 36]
        }
        
        inc_traits = {
            "analytical": "inc4",
            "creative": "inc5",
            "social": "inc3",
            "leadership": "inc3",
            "technical": "inc4",
            "riskTolerance": "inc2",
            "detail_oriented": "inc1",
            "entrepreneurial": "inc2",
            "empathy": "inc3",
            "communication": "inc3"
        }

        features = []
        for trait, q_list in traits.items():
            total = 0
            count = 0
            for num in q_list:
                key = f"q{num}"
                val = assessment_data.get(key)
                if val is not None:
                    try:
                        total += float(val)
                        count += 1
                    except ValueError:
                        pass
            
            # If they didn't answer the long section, fall back to the 5 inclination questions
            if count == 0:
                inc_key = inc_traits.get(trait)
                val = assessment_data.get(inc_key)
                if val is not None:
                    try:
                        total += float(val)
                        count += 1
                    except ValueError:
                        pass

            # Scale output to 0.0 - 1.0 (Assume 1-5 likert)
            avg = (total / count) if count > 0 else 3.0
            scaled_val = (avg - 1) / 4.0
            features.append(scaled_val)
            
        if len(features) < 10:
            features = features + [0.5] * (10 - len(features))
            
        logger.info(f"Mapped features: {features}")
        
        # 2. Call ML Service
        ml_url = os.getenv("EXT_ML_SERVICE_URL", "http://ml_service:8001")
        try:
            r = httpx.get(f"{ml_url}/health", timeout=2.0)
        except httpx.RequestError:
            ml_url = "http://ml_service:8001"

        try:
            resp_predict = httpx.post(f"{ml_url}/predict", json={"features": features}, timeout=10.0)
            predictions = resp_predict.json().get("predictions", [])
            
            resp_explain = httpx.post(f"{ml_url}/explain", json={"features": features}, timeout=10.0)
            explanations = resp_explain.json()
            
            result_data = {
                "predictions": predictions,
                "feature_importance": explanations.get("feature_importance", []),
                "predicted_career": explanations.get("predicted_career_for_explanation")
            }
        except httpx.RequestError as e:
            logger.error(f"Failed calling ML Service: {e}")
            result_data = {"error": "ML Service unavailable"}
            
        # 3. Update DB
        if assessment_id:
            with SessionLocal() as db:
                db_obj = db.query(AssessmentResult).filter(AssessmentResult.id == assessment_id).first()
                if db_obj:
                    db_obj.ml_features = features
                    db_obj.ml_results = result_data
                    db_obj.status = "completed"
                    db.commit()
                    
        logger.info(f"Successfully finalized ML Inference for user {user_id}")
        return {"status": "SUCCESS", "data": result_data}
    except Exception as exc:
        logger.error(f"Error during ML inference dispatch: {exc}")
        self.retry(exc=exc, countdown=10)


@celery_app.task(name="roadmap_generation_task", bind=True)
def roadmap_generation_task(self, user_id: str, career_goal: str, language: str = "en"):
    """
    Triggers parsing of the required skills mapping and outputs an Acyclic Graph
    (DAG) of Database Task objects using Groq LLM (llama-3.3-70b-versatile).
    """
    logger.info(f"Generating dynamic roadmap for user {user_id} targeting {career_goal}")

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.error("GROQ_API_KEY missing. Roadmap generation failed.")
        return {"status": "FAILED", "reason": "Missing API Key"}

    LANGUAGE_NAMES = {"en": "English", "hi": "Hindi", "mr": "Marathi"}
    language_name = LANGUAGE_NAMES.get(language, "English")

    lang_instruction = (
        f" ALL text values in the JSON (titles, descriptions, action_steps, expected_outcome, "
        f"validation_criteria, skill_tags, resource titles) MUST be written in {language_name}. "
        f"Only JSON keys and enum values like 'Beginner', 'Intermediate', 'Advanced', 'video', 'reading', "
        f"'practice', 'project', 'quiz', 'assignment', 'self-check' must remain in English as-is."
    ) if language != "en" else ""

    system_prompt = f"You are an expert career planner. Output ONLY raw JSON arrays with no markdown, no explanation, no extra text.{lang_instruction}"

    lang_note = f" Write all descriptive text in {language_name}." if language != "en" else ""

    user_prompt = (
        f"User Details:\n"
        f"- Goal: {career_goal}\n"
        f"- Level: Beginner\n"
        f"- Duration: 12 weeks\n\n"
        f"Build a structured 12-week career roadmap covering:\n"
        f"1. Phases\n"
        f"2. Topics per phase\n"
        f"3. Weekly breakdown\n"
        f"4. Projects\n"
        f"5. Resources\n\n"
        f'Output EXACTLY as a JSON array of phases. Each phase object should have "title", "description", and a "tasks" array.\n'
        f'Each task object MUST strictly contain the following fields:\n'
        f'- "title": (string) Task Name{lang_note}\n'
        f'- "difficulty": (string) "Beginner" | "Intermediate" | "Advanced"\n'
        f'- "estimated_minutes": (integer) e.g., 30\n'
        f'- "task_type": (string) "video" | "reading" | "practice" | "project" | "quiz"\n'
        f'- "action_steps": (array of strings) Exact steps to perform{lang_note}\n'
        f'- "expected_outcome": (string) What user achieves{lang_note}\n'
        f'- "validation_type": (string) "quiz" | "assignment" | "project" | "self-check"\n'
        f'- "validation_criteria": (string) How success is measured{lang_note}\n'
        f'- "project_linked": (boolean)\n'
        f'- "skill_tags": (array of strings) e.g. ["SQL", "Data Analysis"]\n'
        f'- "xp_reward": (integer) 10 for normal, 50 for project\n'
        f'- "resources": (array of objects) [{{"title": "Resource Name", "url": "url", "type": "article"}}]\n\n'
        f"No markdown, no code fences, no explanation. Just the raw JSON array starting with [ and ending with ]."
    )

    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": 4096,
                "temperature": 0.4,
            },
            timeout=60.0,
        )
        response.raise_for_status()
        raw_text = response.json()["choices"][0]["message"]["content"].strip()

        # Strip any accidental markdown fences
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        if raw_text.endswith("```"):
            raw_text = raw_text.rsplit("```", 1)[0]
        raw_text = raw_text.strip()

        roadmap_data = json.loads(raw_text)

        from app.db.session import SessionLocal
        from app.models.roadmap import RoadmapNode, Task
        import datetime

        nodes_created = 0
        tasks_created = 0

        with SessionLocal() as db:
            # Clear existing roadmap for this user
            db.query(RoadmapNode).filter(RoadmapNode.user_id == user_id).delete()
            db.commit()

            for m_idx, milestone in enumerate(roadmap_data):
                node = RoadmapNode(
                    user_id=user_id,
                    title=milestone.get("title", f"Phase {m_idx+1}"),
                    description=milestone.get("description", "")
                )
                db.add(node)
                db.commit()
                db.refresh(node)
                nodes_created += 1

                tasks = milestone.get("tasks", [])
                for t_idx, task_dict in enumerate(tasks):
                    db_task = Task(
                        node_id=node.id,
                        title=task_dict.get("title", f"Task {t_idx+1}"),
                        difficulty=task_dict.get("difficulty", "Beginner"),
                        estimated_minutes=task_dict.get("estimated_minutes", 30),
                        task_type=task_dict.get("task_type", "reading"),
                        order_index=t_idx,
                        action_steps=json.dumps(task_dict.get("action_steps", [])),
                        expected_outcome=task_dict.get("expected_outcome"),
                        validation_type=task_dict.get("validation_type"),
                        validation_criteria=task_dict.get("validation_criteria"),
                        project_linked=task_dict.get("project_linked", False),
                        skill_tags=json.dumps(task_dict.get("skill_tags", [])),
                        xp_reward=task_dict.get("xp_reward", 10),
                        resources=json.dumps(task_dict.get("resources", []))
                    )
                    db.add(db_task)
                    tasks_created += 1

            db.commit()

        logger.info(f"Roadmap Generated: {nodes_created} nodes, {tasks_created} tasks.")
        return {"status": "SUCCESS", "nodes_created": nodes_created, "tasks_created": tasks_created}

    except httpx.HTTPStatusError as e:
        logger.error(f"Groq API HTTP error: {e.response.status_code} - {e.response.text}")
        return {"status": "FAILED", "reason": f"Groq API error: {e.response.status_code}"}
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Groq JSON response: {e}\nRaw: {raw_text[:500]}")
        return {"status": "FAILED", "reason": "Invalid JSON from LLM"}
    except Exception as e:
        logger.error(f"Failed to generate roadmap: {str(e)}")
        return {"status": "FAILED"}


@celery_app.task(name="notification_dispatcher_task")
def notification_dispatcher_task(user_id: str, notification_type: str, subject: str, message: str):
    """
    Sends generic non-blocking emails or push notification pings using external CRM providers.
    """
    logger.info(f"Dispatching {notification_type} Notification to user {user_id}")
    # E.g. SendGrid, Twilio Logic Here
    time.sleep(1)
    return {"status": "DELIVERED"}

@celery_app.task(name="monitor_user_velocity")
def monitor_user_velocity(user_id: str):
    """
    Adaptive Intelligence System:
    Checks if the user has 0 execution time over the past 4 days.
    If so, proactively rewrites their upcoming tasks to 'Beginner' difficulty,
    breaking them down into smaller chunks to prevent churn.
    """
    logger.info(f"Running Adaptive Intelligence Scan for user {user_id}")
    
    try:
        from app.db.session import SessionLocal
        from app.models.event import EventLog
        from app.models.roadmap import RoadmapNode, Task
        from sqlalchemy import func
        import datetime
        
        four_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=4)
        
        with SessionLocal() as db:
            from sqlalchemy import text
            # 1. Total execution time over last 4 days
            result = db.execute(
                text("SELECT sum(cast(metadata_blob->>'duration_minutes' as integer)) as total_minutes FROM event_logs WHERE user_id = :uid AND event_type = 'task_completed' AND created_at >= :date"),
                {"uid": user_id, "date": four_days_ago}
            )
            row = result.fetchone()
            total_time = row[0] if row and row[0] is not None else 0
            
            if total_time > 0:
                logger.info(f"User {user_id} is active ({total_time} mins). No adaptation needed.")
                return {"status": "ACTIVE"}
                
            # 2. They are churning. Adapt the curriculum.
            logger.warning(f"User {user_id} velocity is 0. Triggering Adaptive Curriculum adjustment.")
            
            # Find the active uncompleted node
            active_node = db.query(RoadmapNode).filter(
                RoadmapNode.user_id == user_id,
                RoadmapNode.is_completed == False
            ).order_by(RoadmapNode.created_at).first()
            
            if not active_node:
                return {"status": "COMPLETED_ROADMAP"}
                
            # Grab their pending tasks
            pending_tasks = db.query(Task).filter(
                Task.node_id == active_node.id,
                Task.is_completed == False
            ).all()
            
            adapted_count = 0
            for task in pending_tasks:
                if task.difficulty != "Beginner":
                    task.difficulty = "Beginner"
                    # Cut time in half theoretically
                    task.estimated_minutes = max(10, task.estimated_minutes // 2)
                    adapted_count += 1
            
            db.commit()
            
            return {"status": "ADAPTED", "tasks_simplified": adapted_count}
            
    except Exception as e:
        logger.error(f"Adaptive Intelligence failed: {str(e)}")
        return {"status": "FAILED"}
@celery_app.task(name="adaptive_engine_task")
def adaptive_engine_task(user_id: str):
    """
    Adaptive engine runs after every 3 feedbacks.
    Logic:
    - Analyzes recent hard feedbacks.
    - Identifies weak skill areas.
    - Adjusts difficulty of future tasks with those tags.
    - Can inject foundational tasks (placeholder for now).
    """
    logger.info(f"Running Adaptive Engine for user {user_id}")
    try:
        from app.db.session import SessionLocal
        from app.models.roadmap import Task, TaskFeedback, RoadmapNode
        from sqlalchemy import select
        
        with SessionLocal() as db:
            # 1. Get recent hard feedbacks
            hard_feedbacks = db.execute(
                select(TaskFeedback.task_id)
                .where(TaskFeedback.user_id == user_id, TaskFeedback.feedback == "hard")
                .order_by(TaskFeedback.created_at.desc())
                .limit(5)
            ).scalars().all()
            
            if not hard_feedbacks:
                logger.info("No recent hard feedbacks. No adaptation needed.")
                return {"status": "SUCCESS", "message": "No adaptation needed."}
                
            # 2. Extract weak skill tags
            weak_tags = set()
            hard_tasks = db.execute(
                select(Task.skill_tags).where(Task.id.in_(hard_feedbacks))
            ).scalars().all()
            
            for tags_str in hard_tasks:
                if tags_str:
                    try:
                        tags = json.loads(tags_str)
                        weak_tags.update(tags)
                    except:
                        pass
                        
            if not weak_tags:
                return {"status": "SUCCESS"}
                
            # 3. Find future pending tasks that match weak tags
            nodes = db.execute(select(RoadmapNode.id).where(RoadmapNode.user_id == user_id)).scalars().all()
            if not nodes:
                return {"status": "SUCCESS"}
                
            pending_tasks = db.execute(
                select(Task).where(Task.node_id.in_(nodes), Task.is_completed == False)
            ).scalars().all()
            
            adapted_count = 0
            for task in pending_tasks:
                if task.skill_tags:
                    try:
                        t_tags = set(json.loads(task.skill_tags))
                        if t_tags & weak_tags:
                            # Adapt this task: lower difficulty if it's advanced, lower time
                            if task.difficulty == "Advanced":
                                task.difficulty = "Intermediate"
                                adapted_count += 1
                            elif task.difficulty == "Intermediate":
                                task.difficulty = "Beginner"
                                adapted_count += 1
                    except:
                        pass
            
            db.commit()
            logger.info(f"Adaptive Engine adapted {adapted_count} tasks based on weak tags: {weak_tags}")
            return {"status": "SUCCESS", "adapted_count": adapted_count}
            
    except Exception as e:
        logger.error(f"Adaptive Engine failed: {str(e)}")
        return {"status": "FAILED"}
