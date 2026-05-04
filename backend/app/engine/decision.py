import json
import logging
from typing import List, Dict, Any, Tuple
from app.core.career_meta import CAREER_META
from app.engine.user_state import UserDecisionState

logger = logging.getLogger("pathpilot")

class DecisionEngine:
    """
    Hybrid logic engine that handles Intent Routing, deterministic Career Ranking,
    and structured context injection for the LLM.
    """
    
    INTENTS = [
        "greeting",
        "decision",
        "comparison",
        "preference_expression",
        "rejection",
        "confusion",
        "validation",
        "exploration"
    ]

    def __init__(self, user_state: UserDecisionState, visible_options: List[str]):
        self.state = user_state
        self.visible_options = visible_options

    def rank_careers(self) -> List[Tuple[str, float, str]]:
        """
        Ranks visible careers mathematically based on user preferences and rejections.
        Returns List of (Career, MatchScore, PrimaryReason)
        """
        ranked = []
        for career in self.visible_options:
            if career in self.state.rejected_careers:
                continue # Filter out rejected
                
            meta = CAREER_META.get(career)
            if not meta:
                ranked.append((career, 0.5, "general_match"))
                continue
                
            score = 0.5 # Base score
            reason = "general_match"
            
            # Very basic deterministic logic for example purposes
            if self.state.preferences.get("work_style") == "remote" and meta.get("remote_friendly"):
                score += 0.2
                reason = "remote_friendly"
                
            if "low" in self.state.preferences.get("effort_tolerance", "") and meta.get("effort") in ["Low", "Low-Medium"]:
                score += 0.2
                reason = "low_effort_match"
                
            ranked.append((career, score, reason))
            
        # Sort descending by score
        ranked.sort(key=lambda x: x[1], reverse=True)
        return ranked

    def determine_intent(self, message: str) -> str:
        """
        Basic NLP or keyword-based intent router. In production, a small fast classification model.
        """
        import re
        msg_lower = message.lower()
        # Strip punctuation
        msg_clean = re.sub(r'[^\w\s]', '', msg_lower).strip()
        
        # Simple greeting check (resilient to typos and extra words)
        if msg_clean in ["hi", "hello", "hey", "sup"] or msg_clean.startswith("hello ") or msg_clean.startswith("hi "):
            return "greeting"
            
        if "vs" in msg_lower or "compare" in msg_lower or "difference" in msg_lower:
            return "comparison"
        if "reject" in msg_lower or "don't like" in msg_lower or "hate" in msg_lower or "no " in msg_lower:
            return "rejection"
        if "confused" in msg_lower or "don't know" in msg_lower or "unsure" in msg_lower:
            return "confusion"
        if "prefer" in msg_lower or "like" in msg_lower or "want" in msg_lower:
            return "preference_expression"
        if "what should i choose" in msg_lower or "which one" in msg_lower or "decision" in msg_lower:
            return "decision"
            
        return "exploration"

    def build_system_prompt_addition(self, message: str, ml_top_choice: str = None) -> str:
        """
        Constructs the strict contextual rules and compressed data to append to the LLM system prompt.
        """
        intent = self.determine_intent(message)
        prompt_lines = [
            "\n--- DECISION ENGINE CONTEXT ---",
            f"DETECTED INTENT: {intent.upper()}"
        ]
        
        # 1. Comparison Mode
        if intent == "comparison" or len(self.visible_options) == 2:
            prompt_lines.append("MODE: COMPARISON. The user is comparing options. Provide a structured, highly objective comparison focusing on Time, Effort, Salary, and Barrier to Entry.")
        
        # 2. Ranking & Confidence
        ranked_options = self.rank_careers()
        if ranked_options:
            top_career, top_score, top_reason = ranked_options[0]
            confidence = "HIGH" if top_score > 0.6 else "MEDIUM"
            prompt_lines.append(f"ENGINE TOP CHOICE: {top_career} (Confidence: {confidence}, Reason: {top_reason})")
            
            # Conflict Resolution
            if ml_top_choice and ml_top_choice != top_career and ml_top_choice not in self.state.rejected_careers:
                prompt_lines.append(f"CONFLICT RESOLUTION: The ML suggested '{ml_top_choice}', but Engine prefers '{top_career}'. Acknowledge this nuance to the user logically if discussing careers.")
                
            if intent in ["decision", "exploration"]:
                prompt_lines.append("RULE: Suggest the Engine Top Choice naturally, but do not aggressively push it. Lean slightly toward it using logic, but ask if they want to explore it.")
                
        if intent == "confusion":
            prompt_lines.append("MODE: CONFUSION. Validate their uncertainty. explicitly tell them they don't need to decide immediately. DO NOT push the ML baseline choice. Instead, ask a targeted A/B question based on their interests to narrow down the path (e.g., 'Do you prefer working with people or solving problems alone?').")
        elif intent == "greeting":
            prompt_lines.append("MODE: GREETING. Simply say hello warmly. Acknowledge them. DO NOT push a career or a next step immediately. Just ask how you can help.")
        else:
            # 3. Next Step Engine (Non-UI Driven)
            prompt_lines.append("NEXT STEP RULE: Always conclude your response by guiding the user logically. Instead of telling them to click UI buttons, explain what the logical next step is (e.g., 'If this sounds good, we can look at a curriculum' or 'Tell me your preference').")

        # Reasoning Mandatory Rule
        prompt_lines.append("REASONING MANDATORY RULE: Every time you suggest or validate a career, you MUST explain WHY it fits the user based on their specific preferences or the career data below.")

        # 4. Inject Compressed Metadata
        prompt_lines.append("\n--- COMPRESSED CAREER DATA ---")
        for career in self.visible_options:
            if career in CAREER_META:
                meta = CAREER_META[career]
                compressed = f"{career}: Sal:{meta['salary']}, Eff:{meta['effort']}, Time:{meta['time_to_entry']}, Remote:{meta['remote_friendly']}"
                prompt_lines.append(compressed)
                
        # 5. Inject State Info
        if self.state.rejected_careers:
            prompt_lines.append(f"\nCRITICAL RULE: The user has permanently REJECTED these careers: {', '.join(self.state.rejected_careers)}. You must NEVER suggest them, mention them, or base any historical assumptions on them. Drop them completely and start fresh.")

        return "\n".join(prompt_lines)
