import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from app.models.career import CareerProfile
from sqlalchemy.future import select

CAREERS = [
    {
        "slug": "software-developer",
        "name": "Software Developer",
        "category": "Technology",
        "description": "Create and maintain software applications. Your analytical and problem-solving skills make this an excellent match.",
        "salary_range": "₹6-15 LPA",
        "job_growth_percentage": "22% by 2030",
        "time_to_start": "6-12 months",
        "experience_level": "Entry Level",
        "advantages": ["High earning potential", "Remote work opportunities", "Continuous learning", "High job demand"],
        "challenges": ["Requires constant upskilling", "Can be stressful with deadlines", "Sedentary work"],
        "required_skills": ["Python", "JavaScript", "System Design"],
        "tags": ["Technology", "High Growth", "Remote Work"]
    },
    {
        "slug": "data-scientist",
        "name": "Data Scientist",
        "category": "Technology",
        "description": "Analyze complex data to help organizations make better decisions.",
        "salary_range": "₹8-18 LPA",
        "job_growth_percentage": "36% by 2030",
        "time_to_start": "12-18 months",
        "experience_level": "Entry Level",
        "advantages": ["Very High demand", "Excellent salary growth", "Diverse applications", "Analytical challenges"],
        "challenges": ["Requires strong math skills", "Competitive field", "Complex problem-solving"],
        "required_skills": ["Python", "Stats", "ML"],
        "tags": ["Analytics", "Python", "Statistics"]
    },
    {
        "slug": "ux-designer",
        "name": "UX Designer",
        "category": "Design",
        "description": "Design user-friendly interfaces and improve user experiences.",
        "salary_range": "₹5-12 LPA",
        "job_growth_percentage": "18% by 2030",
        "time_to_start": "3-6 months",
        "experience_level": "Entry Level",
        "advantages": ["Creative work", "User impact visible", "Growing field", "Flexible work"],
        "challenges": ["Subjective feedback", "Requires portfolio", "Design trends change"],
        "required_skills": ["Design", "Research", "Prototyping"],
        "tags": ["Design", "Research", "Prototyping"]
    },
    {
        "slug": "product-manager",
        "name": "Product Manager",
        "category": "Product",
        "description": "Lead product development and strategy from concept to launch.",
        "salary_range": "₹10-20 LPA",
        "job_growth_percentage": "High Growth",
        "time_to_start": "12-18 months",
        "experience_level": "Mid Level",
        "advantages": ["Leadership overlap", "Cross-functional", "High impact", "Lucrative bonuses"],
        "challenges": ["High pressure", "Context switching", "Lots of meetings"],
        "required_skills": ["Strategy", "Leadership", "Analysis"],
        "tags": ["Strategy", "Leadership", "Analysis"]
    },
    {
        "slug": "digital-marketing-specialist",
        "name": "Digital Marketing Specialist",
        "category": "Marketing",
        "description": "Create and manage online marketing campaigns across platforms.",
        "salary_range": "₹4-10 LPA",
        "job_growth_percentage": "Moderate",
        "time_to_start": "3-6 months",
        "experience_level": "Entry Level",
        "advantages": ["Creative freedom", "Fast paced", "Direct ROI metrics", "Many niches"],
        "challenges": ["Algorithm dependence", "Constant testing required", "High competition"],
        "required_skills": ["Marketing", "Social Media", "SEO"],
        "tags": ["Marketing", "Social Media", "SEO"]
    }
]

async def seed_careers():
    async with AsyncSessionLocal() as db:
        print("Seeding Career metadata...")
        try:
            count = 0
            for data in CAREERS:
                # Check if exists
                stmt = select(CareerProfile).where(CareerProfile.slug == data["slug"])
                result = await db.execute(stmt)
                exists = result.scalar_one_or_none()
                if not exists:
                    new_career = CareerProfile(**data)
                    db.add(new_career)
                    count += 1
            await db.commit()
            print(f"✅ Seeding complete. Inserted {count} new careers.")
        except Exception as e:
            print(f"Error seeding careers: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(seed_careers())
