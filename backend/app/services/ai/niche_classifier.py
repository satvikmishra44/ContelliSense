import re
import time
from collections import Counter, defaultdict
from typing import Dict, List, Tuple

from app.core.logging_config import get_logger

logger = get_logger("app.services.ai.niche_classifier")


STOPWORDS = {
    "the", "a", "an", "of", "and", "is", "in", "on", "to", "for", "with", "by",
    "part", "story", "episode", "ep", "full", "latest", "new", "best", "real",
    "this", "that", "these", "those", "from", "into", "over", "under", "after",
    "before", "your", "my", "our", "their", "his", "her",
    "chandrkatha", "official", "video", "shorts", "short", "clip", "facts",
    "fact", "explained", "explanation", "review", "vs", "top", "no", "1", "2",
    "3", "4", "5", "10", "2024", "2025", "2026",

    # Hinglish / Hindi romanized common fillers
    "hai", "ka", "ki", "ke", "ko", "se", "me", "mein", "par", "tak", "aur",
    "ya", "kya", "kyun", "kaise", "kaunsa", "kaunsi", "aisa", "aisi", "aise",
    "kuch", "sab", "sirf", "ek", "do", "teen", "wala", "wali", "wale",
    "dekho", "janiye", "jaaniye", "suniye", "samjho", "samjhiye", "rahasya",
    "kahani", "kahaani", "baat", "poori", "sach", "jhoot", "raaz",

    # Hindi unicode common fillers
    "है", "का", "की", "के", "को", "से", "में", "पर", "तक", "और", "या",
    "क्या", "क्यों", "कैसे", "एक", "दो", "तीन", "देखो", "जानिए", "सुनिए",
    "कहानी", "राज", "रहस्य", "भाग", "पूरा", "सच", "झूठ", "वीडियो",
}


CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "mythology": [
        "ramayan", "ram", "sita", "hanuman", "krishna", "mahabharat", "arjun",
        "karna", "shiv", "mahadev", "devi", "durga", "kali", "vishnu", "brahma",
        "puran", "ved", "veda", "sanatan", "dharma", "mandir", "bhagwan",
        "जगदम्बा", "रामायण", "महाभारत", "हनुमान", "कृष्ण", "शिव", "महादेव",
        "देवी", "दुर्गा", "काली", "विष्णु", "ब्रह्मा", "पुराण", "वेद", "धर्म",
        "भगवान", "मंदिर"
    ],
    "spirituality": [
        "bhakti", "adhyatm", "adhyatma", "mantra", "tantra", "tantrik", "sadhna",
        "meditation", "moksha", "karma", "puja", "darshan", "upasana",
        "भक्ति", "अध्यात्म", "मंत्र", "तंत्र", "साधना", "मोक्ष", "कर्म", "पूजा",
        "दर्शन", "उपासना"
    ],
    "history": [
        "history", "historical", "empire", "dynasty", "civilization", "ancient",
        "medieval", "war", "king", "queen", "battle", "archaeology",
        "itihas", "prachin", "samrajya", "rajvansh",
        "इतिहास", "प्राचीन", "सभ्यता", "मध्यकाल", "युद्ध", "राजा", "रानी",
        "सम्राज्य", "राजवंश", "पुरातत्व"
    ],
    "science": [
        "science", "scientist", "experiment", "discovery", "research", "theory",
        "lab", "scientific", "invention", "biology", "chemistry", "physics",
        "विज्ञान", "वैज्ञानिक", "प्रयोग", "खोज", "शोध", "सिद्धांत", "आविष्कार"
    ],
    "astronomy": [
        "astronomy", "telescope", "constellation", "nebula", "galaxy", "planet",
        "star", "moon", "sun", "solar system", "asteroid", "comet",
        "खगोल", "तारा", "ग्रह", "चंद्र", "चांद", "सूरज", "आकाशगंगा", "नक्षत्र"
    ],
    "space": [
        "space", "nasa", "isro", "spacex", "rocket", "mars", "moon mission",
        "satellite", "black hole", "cosmos", "universe", "orbiter",
        "अंतरिक्ष", "रॉकेट", "मंगल", "चंद्रयान", "उपग्रह", "ब्लैक होल", "ब्रह्मांड"
    ],
    "physics": [
        "physics", "quantum", "relativity", "gravity", "energy", "force", "atom",
        "particle", "newton", "einstein",
        "भौतिकी", "क्वांटम", "गुरुत्वाकर्षण", "ऊर्जा", "बल", "परमाणु"
    ],
    "chemistry": [
        "chemistry", "chemical", "reaction", "molecule", "compound", "acid",
        "base", "organic chemistry", "periodic table",
        "रसायन", "रासायनिक", "अभिक्रिया", "अणु", "यौगिक", "अम्ल", "क्षार"
    ],
    "biology": [
        "biology", "cell", "dna", "gene", "genetics", "evolution", "microbe",
        "virus", "bacteria", "human body", "animal", "plant",
        "जीवविज्ञान", "कोशिका", "डीएनए", "जीन", "विकासवाद", "वायरस", "बैक्टीरिया"
    ],
    "technology": [
        "technology", "tech", "gadget", "smartphone", "laptop", "app", "software",
        "android", "iphone", "windows", "macbook", "device",
        "टेक", "तकनीक", "गैजेट", "मोबाइल", "फोन", "लैपटॉप", "सॉफ्टवेयर", "ऐप"
    ],
    "ai_ml": [
        "ai", "artificial intelligence", "machine learning", "ml", "llm", "gpt",
        "chatgpt", "automation", "agentic", "neural network",
        "एआई", "कृत्रिम बुद्धिमत्ता", "मशीन लर्निंग", "ऑटोमेशन"
    ],
    "programming": [
        "python", "javascript", "java", "coding", "programming", "developer",
        "web development", "api", "backend", "frontend", "react", "django",
        "flask", "fastapi", "code",
        "कोडिंग", "प्रोग्रामिंग", "डेवलपर", "वेब डेवलपमेंट", "एपीआई"
    ],
    "business": [
        "business", "startup", "entrepreneur", "company", "marketing", "sales",
        "brand", "case study", "strategy", "growth", "founder",
        "बिजनेस", "स्टार्टअप", "उद्यमी", "कंपनी", "मार्केटिंग", "ब्रांड", "रणनीति"
    ],
    "finance": [
        "finance", "stock", "stocks", "share market", "investing", "investment",
        "mutual fund", "sip", "crypto", "bitcoin", "trading", "money", "tax",
        "loan", "personal finance",
        "फाइनेंस", "शेयर", "शेयर मार्केट", "निवेश", "म्यूचुअल फंड", "सिप",
        "क्रिप्टो", "ट्रेडिंग", "पैसा", "टैक्स", "लोन"
    ],
    "economics": [
        "economy", "inflation", "gdp", "recession", "economic", "market crash",
        "fiscal", "budget",
        "अर्थव्यवस्था", "मुद्रास्फीति", "जीडीपी", "मंदी", "बजट"
    ],
    "geopolitics": [
        "geopolitics", "war", "global politics", "india china", "india pakistan",
        "russia", "usa", "election", "military", "defense", "foreign policy",
        "भूराजनीति", "चुनाव", "सैन्य", "रक्षा", "विदेश नीति", "युद्ध"
    ],
    "education": [
        "tutorial", "course", "lesson", "chapter", "class", "exam", "upsc", "neet",
        "jee", "ssc", "study", "notes", "syllabus", "question", "how to",
        "ट्यूटोरियल", "कोर्स", "पाठ", "कक्षा", "एग्जाम", "अध्ययन", "नोट्स", "सवाल"
    ],
    "psychology": [
        "psychology", "mind", "brain", "behavior", "habit", "trauma", "personality",
        "mental model", "bias", "emotion",
        "मनोविज्ञान", "दिमाग", "मस्तिष्क", "व्यवहार", "आदत", "भावना"
    ],
    "motivation": [
        "motivation", "motivational", "success", "discipline", "mindset", "focus",
        "self improvement", "productivity", "inspiration",
        "प्रेरणा", "मोटिवेशन", "सफलता", "अनुशासन", "माइंडसेट", "फोकस"
    ],
    "health": [
        "health", "disease", "doctor", "medical", "medicine", "symptoms",
        "treatment", "hospital", "wellness", "nutrition",
        "स्वास्थ्य", "बीमारी", "डॉक्टर", "चिकित्सा", "दवा", "लक्षण", "इलाज", "पोषण"
    ],
    "fitness": [
        "fitness", "workout", "gym", "muscle", "fat loss", "weight loss", "cardio",
        "exercise", "protein", "bodybuilding", "running", "yoga",
        "फिटनेस", "वर्कआउट", "जिम", "मसल", "वजन", "व्यायाम", "योग"
    ],
    "food": [
        "recipe", "cooking", "kitchen", "food", "dish", "meal", "breakfast",
        "lunch", "dinner", "street food", "biryani", "paneer", "cake",
        "रेसिपी", "खाना", "पकवान", "नाश्ता", "दोपहर", "रात", "स्ट्रीट फूड"
    ],
    "travel": [
        "travel", "trip", "vlog", "journey", "tour", "tourism", "visa", "hotel",
        "backpacking", "destination", "itinerary",
        "यात्रा", "सफर", "घूमना", "ट्रिप", "टूर", "वीजा", "होटल", "डेस्टिनेशन"
    ],
    "automobile": [
        "car", "bike", "suv", "motorcycle", "ev", "electric vehicle", "auto",
        "automobile", "mileage", "launch", "test drive", "review",
        "कार", "बाइक", "ऑटो", "माइलेज", "लॉन्च", "टेस्ट ड्राइव"
    ],
    "gaming": [
        "gaming", "gamer", "gameplay", "walkthrough", "stream", "minecraft", "gta",
        "bgmi", "pubg", "free fire", "valorant", "elden ring", "boss fight",
        "गेम", "गेमिंग", "गेमप्ले", "स्ट्रीम", "मिशन"
    ],
    "movies_entertainment": [
        "movie", "film", "cinema", "trailer", "review", "ending explained",
        "bollywood", "hollywood", "web series", "ott", "actor", "celebrity",
        "फिल्म", "मूवी", "सिनेमा", "ट्रेलर", "बॉलीवुड", "वेब सीरीज", "ओटीटी"
    ],
    "anime_comics": [
        "anime", "manga", "manhwa", "naruto", "one piece", "dragon ball",
        "marvel", "dc", "superhero", "comic",
        "एनीमे", "मांगा", "मार्वल", "सुपरहीरो", "कॉमिक"
    ],
    "true_crime": [
        "crime", "murder", "case", "investigation", "serial killer", "forensic",
        "mystery case", "court", "police",
        "अपराध", "हत्या", "केस", "जांच", "फॉरेंसिक", "पुलिस", "अदालत"
    ],
    "diy_home": [
        "diy", "home", "decor", "interior", "renovation", "repair", "furniture",
        "woodworking", "paint", "design",
        "डीआईवाई", "घर", "सजावट", "इंटीरियर", "मरम्मत", "फर्नीचर", "डिजाइन"
    ],
    "beauty_fashion": [
        "beauty", "makeup", "skincare", "fashion", "outfit", "style", "haircare",
        "glam", "routine",
        "ब्यूटी", "मेकअप", "स्किनकेयर", "फैशन", "स्टाइल", "हेयर"
    ],
    "kids": [
        "kids", "children", "cartoon", "rhymes", "learning", "alphabet", "nursery",
        "toys", "baby",
        "बच्चे", "कार्टून", "राइम्स", "अल्फाबेट", "नर्सरी", "खिलौने"
    ],
}


CATEGORY_QUERY_BASES: Dict[str, List[str]] = {
    "mythology": ["hindu mythology", "indian mythology stories", "ramayan katha"],
    "spirituality": ["spirituality hindi", "bhakti katha", "adhyatm"],
    "history": ["indian history", "ancient india history", "historical stories hindi"],
    "science": ["science explained", "science facts", "science hindi"],
    "astronomy": ["astronomy explained", "space facts", "खगोल विज्ञान"],
    "space": ["space news", "isro mission", "space explained"],
    "physics": ["physics explained", "quantum physics", "भौतिकी"],
    "chemistry": ["chemistry explained", "chemical reactions", "रसायन विज्ञान"],
    "biology": ["biology explained", "human body facts", "जीव विज्ञान"],
    "technology": ["tech news", "smartphone review", "technology explained"],
    "ai_ml": ["artificial intelligence", "ai tools", "chatgpt updates"],
    "programming": ["python tutorial", "coding projects", "web development"],
    "business": ["business case study", "startup strategy", "business ideas"],
    "finance": ["stock market", "personal finance", "mutual funds india"],
    "economics": ["economy explained", "inflation india", "budget analysis"],
    "geopolitics": ["geopolitics", "india global politics", "defense analysis"],
    "education": ["education tutorial", "exam preparation", "how to study"],
    "psychology": ["psychology explained", "human behavior", "mindset"],
    "motivation": ["motivation hindi", "self improvement", "discipline"],
    "health": ["health tips", "medical explained", "nutrition"],
    "fitness": ["workout plan", "fat loss", "fitness motivation"],
    "food": ["easy recipes", "street food", "cooking"],
    "travel": ["travel guide", "budget travel", "destination vlog"],
    "automobile": ["car review", "bike review", "ev news"],
    "gaming": ["gaming highlights", "game walkthrough", "bgmi gameplay"],
    "movies_entertainment": ["movie explained", "bollywood news", "web series review"],
    "anime_comics": ["anime explained", "manga theory", "marvel breakdown"],
    "true_crime": ["true crime", "mystery case", "crime investigation"],
    "diy_home": ["home diy", "interior design", "repair tutorial"],
    "beauty_fashion": ["makeup tutorial", "skincare routine", "fashion tips"],
    "kids": ["kids learning", "nursery rhymes", "cartoon stories"],
}


TITLE_PATTERNS = {
    "question": [r"\?", r"^why\b", r"^how\b", r"^what\b", r"^is\b", r"^can\b", r"^should\b", r"^क्यों", r"^कैसे", r"^क्या"],
    "listicle": [r"\b\d+\b", r"\btop\b", r"\bbest\b", r"\bways\b", r"\btips\b"],
    "freshness": [r"\b2026\b", r"\b2025\b", r"\blatest\b", r"\bnew\b", r"\bupdate\b"],
    "credibility": [r"\bexplained\b", r"\bfull course\b", r"\bguide\b", r"\banalysis\b", r"\breview\b"],
    "curiosity": [r"\bsecret\b", r"\bhidden\b", r"\breal reason\b", r"\btruth\b", r"\brahasya\b", r"\braaz\b", r"\bसच\b", r"\bरहस्य\b"],
}


class NicheClassifier:
    """
    Expanded multilingual niche classifier for YouTube channels.

    Goals:
    1. Detect broad niche/category from 10-20 recent video titles.
    2. Support English, Hinglish, and Hindi tokens.
    3. Produce low-noise trend-search queries based on detected categories and repeated subtopics.
    4. Keep rule-based behavior fast, deterministic, and cheap.
    """

    def _normalize(self, text: str) -> str:
        text = re.sub(r"#\w+", " ", text)
        text = re.sub(r"\b(part|episode|ep)\s*\d+\b", " ", text, flags=re.IGNORECASE)
        text = re.sub(r"[|_:/\-]+", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def _tokenize(self, title: str) -> List[str]:
        cleaned = self._normalize(title)
        cleaned = re.sub(r"[^\w\s\u0900-\u097F]", " ", cleaned, flags=re.UNICODE)
        tokens = [t.lower().strip() for t in cleaned.split() if len(t.strip()) >= 2]
        return [t for t in tokens if t not in STOPWORDS]

    def _extract_phrases(self, titles: List[str]) -> List[str]:
        phrase_counts = Counter()

        for title in titles:
            tokens = self._tokenize(title)
            for n in (2, 3):
                for i in range(len(tokens) - n + 1):
                    phrase = " ".join(tokens[i:i+n]).strip()
                    if len(phrase) < 5:
                        continue
                    if any(tok in STOPWORDS for tok in phrase.split()):
                        continue
                    phrase_counts[phrase] += 1

        phrases = [p for p, c in phrase_counts.most_common(20) if c >= 2]
        return phrases[:10]

    def _score_categories(self, titles: List[str]) -> Tuple[Dict[str, int], Counter]:
        token_counts = Counter()
        category_scores = defaultdict(int)

        for title in titles:
            tokens = self._tokenize(title)
            token_counts.update(tokens)

            lowered = self._normalize(title).lower()
            for category, keywords in CATEGORY_KEYWORDS.items():
                for kw in keywords:
                    if " " in kw:
                        if kw.lower() in lowered:
                            category_scores[category] += 3
                    else:
                        category_scores[category] += token_counts.get(kw.lower(), 0)

        return dict(category_scores), token_counts

    def _detect_title_patterns(self, titles: List[str]) -> Dict[str, int]:
        pattern_scores = {}
        joined = "\n".join(titles).lower()

        for pattern_name, rules in TITLE_PATTERNS.items():
            score = 0
            for rule in rules:
                score += len(re.findall(rule, joined, flags=re.IGNORECASE | re.MULTILINE))
            pattern_scores[pattern_name] = score

        return pattern_scores

    def _pick_top_categories(self, scores: Dict[str, int], top_n: int = 3) -> List[Tuple[str, int]]:
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        ranked = [item for item in ranked if item[1] > 0]
        return ranked[:top_n]

    def _build_queries(
        self,
        top_categories: List[Tuple[str, int]],
        top_tokens: List[str],
        top_phrases: List[str],
    ) -> List[str]:
        queries: List[str] = []

        for category, _score in top_categories[:2]:
            queries.extend(CATEGORY_QUERY_BASES.get(category, []))

        for phrase in top_phrases[:3]:
            if len(phrase.split()) <= 3:
                queries.append(phrase)

        for token in top_tokens[:5]:
            if len(token) >= 3 and not token.isdigit():
                queries.append(token)

        deduped = []
        seen = set()

        for q in queries:
            q_clean = re.sub(r"\s+", " ", q).strip().lower()
            if not q_clean:
                continue
            if len(q_clean) < 3 or len(q_clean) > 40:
                continue
            if q_clean in seen:
                continue
            seen.add(q_clean)
            deduped.append(q_clean)

        return deduped[:8]

    def classify(self, video_titles: List[str], sample_size: int = 20) -> dict:
        start = time.perf_counter()
        sample = [t for t in video_titles[:sample_size] if t and t.strip()]

        logger.info("Niche classification started | sample_size=%s", len(sample))

        if not sample:
            return {
                "primary_topic": "general",
                "secondary_topics": [],
                "topic_scores": {},
                "top_tokens": [],
                "top_phrases": [],
                "title_patterns": {},
                "search_queries": ["youtube trends"],
            }

        category_scores, token_counts = self._score_categories(sample)
        ranked_categories = self._pick_top_categories(category_scores, top_n=3)
        top_tokens = [tok for tok, count in token_counts.most_common(20) if count >= 2][:10]
        top_phrases = self._extract_phrases(sample)
        title_patterns = self._detect_title_patterns(sample)

        primary_topic = ranked_categories[0][0] if ranked_categories else "general"
        secondary_topics = [cat for cat, _ in ranked_categories[1:]]
        search_queries = self._build_queries(ranked_categories, top_tokens, top_phrases)

        result = {
            "primary_topic": primary_topic,
            "secondary_topics": secondary_topics,
            "topic_scores": dict(ranked_categories),
            "top_tokens": top_tokens,
            "top_phrases": top_phrases,
            "title_patterns": title_patterns,
            "search_queries": search_queries,
        }

        logger.info(
            "Niche classification completed | primary_topic=%s secondary_topics=%s queries=%s duration_ms=%s",
            primary_topic,
            secondary_topics,
            search_queries,
            round((time.perf_counter() - start) * 1000, 2),
        )

        return result