import json
import logging
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger("placement_prep")

# Initialize LLM API configurations if available
has_gemini = False
has_openai = False

if settings.GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        has_gemini = True
        logger.info("Gemini API initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini API: {e}")

if settings.OPENAI_API_KEY:
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        has_openai = True
        logger.info("OpenAI API client initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI API client: {e}")

class LLMService:
    @staticmethod
    def _call_llm(prompt: str, system_instruction: str = "") -> str:
        """Helper to invoke LLM based on available providers, prioritizing Gemini."""
        if has_gemini:
            try:
                import google.generativeai as genai
                model = genai.GenerativeModel(
                    model_name="gemini-1.5-flash",
                    system_instruction=system_instruction
                )
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                return response.text.strip()
            except Exception as e:
                logger.error(f"Gemini API invocation failed: {e}. Falling back if possible.")
        
        if has_openai:
            try:
                from openai import OpenAI
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})
                
                response = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    response_format={"type": "json_object"},
                    messages=messages
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"OpenAI API invocation failed: {e}")
                
        # Raise error if API keys are set but failed
        if settings.GEMINI_API_KEY or settings.OPENAI_API_KEY:
            raise RuntimeError("Configured LLM APIs failed. Running mock fallback.")
            
        raise ValueError("No LLM API keys provided. Please set GEMINI_API_KEY or OPENAI_API_KEY in your .env.")

    @classmethod
    def parse_resume(cls, raw_text: str) -> Dict[str, Any]:
        """Extract structured information from raw resume text."""
        system_instruction = (
            "You are an expert resume parsing AI. Your job is to read raw text from a resume and extract structured profile data "
            "strictly formatted in JSON. Return only the JSON object."
        )
        prompt = f"""
        Extract details from the following resume text.
        Make sure the returned JSON strictly has these keys:
        - name: string (or null if not found)
        - email: string (or null if not found)
        - education: list of objects containing 'degree', 'institution', 'year', 'gpa'
        - skills: list of strings (tech skills, programming languages, databases, cloud, etc.)
        - projects: list of objects containing 'title', 'description', 'technologies' (list of strings)
        - experience: list of objects containing 'role', 'company', 'duration', 'description'
        - certifications: list of strings

        Resume Text:
        {raw_text}
        """
        
        try:
            result_str = cls._call_llm(prompt, system_instruction)
            return json.loads(result_str)
        except Exception as e:
            logger.warning(f"Using mock resume parsing due to error/missing key: {e}")
            return cls._get_mock_resume_data(raw_text)

    @classmethod
    def extract_skills_from_jd(cls, jd_text: str) -> List[str]:
        """Extract required skills from a job description."""
        system_instruction = (
            "You are an expert technical recruiter AI. Extract a list of required technical and soft skills from the job description. "
            "Return only a JSON array of strings representing the skills."
        )
        prompt = f"""
        Extract required skills from the following Job Description text:
        
        {jd_text}
        """
        try:
            result_str = cls._call_llm(prompt, system_instruction)
            # Ensure it is a valid list
            skills = json.loads(result_str)
            if isinstance(skills, list):
                return skills
            elif isinstance(skills, dict) and "skills" in skills:
                return skills["skills"]
            return []
        except Exception as e:
            logger.warning(f"Using mock JD skills extraction: {e}")
            return cls._get_mock_jd_skills(jd_text)

    @classmethod
    def analyze_skill_gap(cls, resume_skills: List[str], target_skills: List[str]) -> Dict[str, Any]:
        """Analyze matching/missing skills and compute ATS/match score."""
        system_instruction = (
            "You are an ATS analyzer. Compare resume skills with target required skills. "
            "Calculate matching skills, missing skills, match percentage, and ATS compatibility score. "
            "Return a JSON object containing: matching_skills (list of str), missing_skills (list of str), "
            "match_percentage (float, 0-100), ats_score (float, 0-100)."
        )
        prompt = f"""
        Compare the following resume skills with required target skills.
        
        Resume Skills: {json.dumps(resume_skills)}
        Required Target Skills: {json.dumps(target_skills)}
        """
        try:
            result_str = cls._call_llm(prompt, system_instruction)
            return json.loads(result_str)
        except Exception as e:
            logger.warning(f"Using mock skill gap analysis: {e}")
            return cls._get_mock_skill_gap(resume_skills, target_skills)

    @classmethod
    def generate_roadmap(cls, missing_skills: List[str]) -> Dict[str, Any]:
        """Generate a 30/60/90-day learning roadmap based on missing skills."""
        system_instruction = (
            "You are a tech education mentor. Based on missing skills, generate a progressive 30-day, 60-day, and 90-day learning roadmap. "
            "Return a JSON object with 'thirty_day', 'sixty_day', and 'ninety_day' keys. Each containing a list of task objects: "
            "{'id': string, 'topic': string, 'description': string, 'category': string, 'resources': list of strings}. "
            "Categories MUST be one of: 'DSA Topics', 'DBMS Topics', 'OS Topics', 'OOP Topics', 'System Design', 'Development Skills', 'Aptitude Topics'."
        )
        prompt = f"""
        Create a 30/60/90 day study guide to learn these missing skills: {json.dumps(missing_skills)}.
        Make sure the roadmap includes standard computer science fundamental areas (DSA, OS, System Design, OOP) alongside these skills.
        """
        try:
            result_str = cls._call_llm(prompt, system_instruction)
            return json.loads(result_str)
        except Exception as e:
            logger.warning(f"Using mock roadmap generation: {e}")
            return cls._get_mock_roadmap(missing_skills)

    @classmethod
    def generate_questions(cls, resume_data: Dict[str, Any], company_name: str, round_type: str, missing_skills: List[str]) -> List[Dict[str, Any]]:
        """Generate a list of 5 interactive mock interview questions."""
        system_instruction = (
            "You are an elite interviewer. Based on the candidate's resume profile, target company, and interview round type, "
            "generate 5 relevant, high-quality interview questions. "
            "Return a JSON array of objects, each containing: 'question_id' (e.g. q1, q2), 'question_text' (string), and 'category' (string)."
        )
        prompt = f"""
        Generate 5 interview questions for a '{round_type}' interview round at '{company_name}'.
        Candidate Resume Data: {json.dumps(resume_data.get('parsed_data', resume_data))}
        Candidate Missing Skills to challenge on: {json.dumps(missing_skills)}
        """
        try:
            result_str = cls._call_llm(prompt, system_instruction)
            questions = json.loads(result_str)
            if isinstance(questions, list):
                return questions
            elif isinstance(questions, dict) and "questions" in questions:
                return questions["questions"]
            return []
        except Exception as e:
            logger.warning(f"Using mock interview question generation: {e}")
            return cls._get_mock_questions(company_name, round_type)

    @classmethod
    def evaluate_answer(cls, question_text: str, user_answer: str) -> Dict[str, Any]:
        """Evaluate a candidate's answer for accuracy, communication, confidence, completeness."""
        system_instruction = (
            "You are an expert technical and behavior interviewer. Evaluate the user's answer to the given question. "
            "Provide quantitative ratings (0-100) and constructive qualitative feedback. "
            "Return a JSON object containing: 'score' (int 0-100), 'technical_accuracy' (int 0-100), "
            "'communication' (int 0-100), 'confidence' (int 0-100), 'completeness' (int 0-100), "
            "'feedback' (string), and 'suggestions' (list of strings)."
        )
        prompt = f"""
        Evaluate the answer to the following question.
        Question: {question_text}
        Candidate's Answer: {user_answer}
        """
        try:
            result_str = cls._call_llm(prompt, system_instruction)
            return json.loads(result_str)
        except Exception as e:
            logger.warning(f"Using mock answer evaluation: {e}")
            return cls._get_mock_evaluation(question_text, user_answer)

    # --- MOCK DATA FALLBACKS ---
    
    @staticmethod
    def _get_mock_resume_data(text: str) -> Dict[str, Any]:
        """Returns mock extracted resume profile."""
        return {
            "name": "Jane Doe",
            "email": "jane.doe@example.com",
            "education": [
                {"degree": "Bachelor of Technology in Computer Science", "institution": "State Technical University", "year": "2025", "gpa": "8.8/10"}
            ],
            "skills": ["Python", "JavaScript", "React", "HTML", "CSS", "SQL", "Git", "Data Structures"],
            "projects": [
                {"title": "E-Commerce Web Application", "description": "Built a responsive online store using React and Firebase.", "technologies": ["React", "Firebase", "CSS"]}
            ],
            "experience": [
                {"role": "Software Engineering Intern", "company": "Tech Innovators Lab", "duration": "3 Months", "description": "Worked on refactoring React frontend pages and integrating REST APIs."}
            ],
            "certifications": ["AWS Certified Cloud Practitioner"]
        }

    @staticmethod
    def _get_mock_jd_skills(text: str) -> List[str]:
        """Returns mock JD extracted skills."""
        # Simple string-match parser fallback
        text_lower = text.lower()
        skills = []
        possible_skills = ["Node.js", "Python", "React", "MongoDB", "Express", "Docker", "AWS", "SQL", "Tailwind CSS", "TypeScript", "FastAPI", "Kubernetes", "Redis", "C++", "Java"]
        for s in possible_skills:
            if s.lower() in text_lower:
                skills.append(s)
        if not skills:
            skills = ["React", "Node.js", "MongoDB", "FastAPI", "Docker", "AWS"]
        return skills

    @staticmethod
    def _get_mock_skill_gap(resume_skills: List[str], target_skills: List[str]) -> Dict[str, Any]:
        """Returns mock comparison results."""
        r_set = set(s.lower() for s in resume_skills)
        t_set = set(s.lower() for s in target_skills)
        
        matching = []
        missing = []
        
        for original_skill in target_skills:
            if original_skill.lower() in r_set:
                matching.append(original_skill)
            else:
                missing.append(original_skill)
                
        # Default safety
        if not matching and not missing:
            matching = ["React", "Python"]
            missing = ["Node.js", "MongoDB", "FastAPI"]
            
        match_pct = round((len(matching) / max(len(target_skills), 1)) * 100, 1)
        ats_score = round(match_pct * 0.9 + 10, 1)  # simple linear formula
        ats_score = min(max(ats_score, 30.0), 99.0)
        
        return {
            "matching_skills": matching,
            "missing_skills": missing,
            "match_percentage": match_pct,
            "ats_score": ats_score
        }

    @staticmethod
    def _get_mock_roadmap(missing_skills: List[str]) -> Dict[str, Any]:
        """Returns mock 30/60/90 roadmap."""
        missing = missing_skills if missing_skills else ["Node.js", "MongoDB", "FastAPI"]
        
        # Build customizable roadmap tasks
        thirty = [
            {"id": "t1", "topic": f"CS Fundamentals & OOPs", "description": "Review Object Oriented Programming concepts in Python/C++.", "category": "OOP Topics", "resources": ["GeeksforGeeks OOPs", "W3Schools"]},
            {"id": "t2", "topic": f"Basic Backend with {missing[0] if len(missing) > 0 else 'Node.js'}", "description": "Set up server structures, handle routing, and understand requests/responses.", "category": "Development Skills", "resources": ["Official Documentation", "MDN Web Docs"]}
        ]
        sixty = [
            {"id": "t3", "topic": "Data Structures & Algorithms - Arrays & Trees", "description": "Solve LeetCode Top 50 problems on Arrays, String, and Binary Trees.", "category": "DSA Topics", "resources": ["LeetCode", "NeetCode.io"]},
            {"id": "t4", "topic": f"Database Integration with {missing[1] if len(missing) > 1 else 'MongoDB'}", "description": "Implement schemas, CRUD operations, database queries, and indexing.", "category": "DBMS Topics", "resources": ["MongoDB University", "SQL Tutorial"]}
        ]
        ninety = [
            {"id": "t5", "topic": "System Design Basics", "description": "Understand horizontal vs vertical scaling, load balancers, caching, and CDNs.", "category": "System Design", "resources": ["ByteByteGo", "Grokking the System Design"]},
            {"id": "t6", "topic": "Operating Systems & Networking Basics", "description": "Review thread vs process, virtual memory, TCP/IP stack, and HTTP protocol.", "category": "OS Topics", "resources": ["OS Fundamentals Course"]}
        ]
        
        return {
            "thirty_day": thirty,
            "sixty_day": sixty,
            "ninety_day": ninety
        }

    @staticmethod
    def _get_mock_questions(company: str, round_type: str) -> List[Dict[str, Any]]:
        """Returns mock questions based on round type."""
        if round_type == "Technical":
            return [
                {"question_id": "q1", "question_text": f"How do you implement a robust caching mechanism in a high-traffic app like one at {company}?", "category": "System Design"},
                {"question_id": "q2", "question_text": "What is the difference between a process and a thread, and how does your favorite language handle concurrency?", "category": "Operating Systems"},
                {"question_id": "q3", "question_text": "Describe the difference between SQL and NoSQL databases. When would you prefer NoSQL?", "category": "Database Management"},
                {"question_id": "q4", "question_text": "Can you explain how a Hash Map handles collisions under the hood?", "category": "Data Structures"},
                {"question_id": "q5", "question_text": "What is REST API idempotency? Which HTTP methods are idempotent and why?", "category": "Web Development"}
            ]
        elif round_type == "HR":
            return [
                {"question_id": "q1", "question_text": f"Why do you want to join {company}?", "category": "HR"},
                {"question_id": "q2", "question_text": "Where do you see yourself in the next 5 years?", "category": "HR"},
                {"question_id": "q3", "question_text": "What are your greatest strengths and weaknesses?", "category": "HR"},
                {"question_id": "q4", "question_text": "Describe your ideal work environment.", "category": "HR"},
                {"question_id": "q5", "question_text": "How do you handle work pressure and tight deadlines?", "category": "HR"}
            ]
        elif round_type == "Behavioral":
            return [
                {"question_id": "q1", "question_text": "Tell me about a time you had a conflict with a team member and how you resolved it.", "category": "Behavioral"},
                {"question_id": "q2", "question_text": "Describe a challenging situation where you failed. What did you learn?", "category": "Behavioral"},
                {"question_id": "q3", "question_text": "Give an example of a time you went above and beyond to complete a task.", "category": "Behavioral"},
                {"question_id": "q4", "question_text": "How do you handle a situation where you don't know the answer to a task?", "category": "Behavioral"},
                {"question_id": "q5", "question_text": "Tell me about a project you led. How did you coordinate the responsibilities?", "category": "Behavioral"}
            ]
        else: # Project Discussion
            return [
                {"question_id": "q1", "question_text": "Explain the architecture of the most challenging project on your resume.", "category": "System Architecture"},
                {"question_id": "q2", "question_text": "What major trade-offs did you make when deciding on the tech stack for your project?", "category": "Trade-offs"},
                {"question_id": "q3", "question_text": "How did you verify or test the performance/reliability of your application?", "category": "Quality Assurance"},
                {"question_id": "q4", "question_text": "If you had to scale your project to support 1 million daily active users, what components would fail first, and how would you redesign them?", "category": "Scalability"},
                {"question_id": "q5", "question_text": "Explain a difficult technical bug you encountered in your project and how you solved it.", "category": "Debugging"}
            ]

    @staticmethod
    def _get_mock_evaluation(question: str, answer: str) -> Dict[str, Any]:
        """Evaluates mock answers with high quality content."""
        words_count = len(answer.split())
        
        if words_count < 10:
            score = 30
            accuracy = 25
            communication = 40
            confidence = 30
            completeness = 20
            feedback = "The response is extremely brief and lacks technical depth, substance, or structure."
            suggestions = [
                "Elaborate your thoughts with structured points.",
                "Include technical terms, examples, and explain 'how' and 'why'.",
                "Ensure your response is at least 3-4 sentences long."
            ]
        elif words_count < 30:
            score = 65
            accuracy = 60
            communication = 70
            confidence = 65
            completeness = 60
            feedback = "Good start, but the answer is somewhat superficial. It covers the core concept but misses advanced details and real-world application."
            suggestions = [
                "Provide a clear example to back up your claim.",
                "Add more domain-specific terminology.",
                "Briefly describe the trade-offs of the approach you explained."
            ]
        else:
            score = 88
            accuracy = 85
            communication = 90
            confidence = 88
            completeness = 90
            feedback = "Excellent response! The answer is well-structured, clear, technically correct, and exhibits good communication skills."
            suggestions = [
                "Keep using this structured STAR (Situation, Task, Action, Result) format.",
                "Mention alternative solutions or modern frameworks to show advanced knowledge."
            ]
            
        return {
            "score": score,
            "technical_accuracy": accuracy,
            "communication": communication,
            "confidence": confidence,
            "completeness": completeness,
            "feedback": feedback,
            "suggestions": suggestions
        }
