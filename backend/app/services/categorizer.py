import re
from typing import Tuple, Optional, Dict, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import numpy as np

CATEGORIES = [
    "Food and dining",
    "Shopping",
    "Travel and transportation",
    "Bills and utilities",
    "Healthcare",
    "Education",
    "Salary and income",
    "Transfers",
    "Entertainment",
    "Housing and rent",
    "Investments",
    "Other expenses"
]

# High-precision merchant & keyword taxonomy
KEYWORD_RULES = {
    "Salary and income": [
        "payroll", "salary", "direct dep", "dir dep", "employer", "wages",
        "stipend", "bonus", "dividend received", "freelance", "upwork", "stripe payout"
    ],
    "Food and dining": [
        "starbucks", "mcdonalds", "mcdonald's", "subway", "uber eats", "doordash", "grubhub",
        "chipotle", "dunkin", "domino", "pizza", "burger", "cafe", "restaurant", "bistro",
        "whole foods", "trader joe", "kroger", "safeway", "albertsons", "supermarket", "grocery",
        "bakery", "deli", "bar & grill", "taco", "panera", "wendys", "chick-fil-a"
    ],
    "Shopping": [
        "amazon", "walmart", "target", "costco", "ebay", "best buy", "apple store", "nike",
        "zara", "h&m", "ikea", "home depot", "lowes", "clothing", "apparel", "retail", "etsy",
        "sephora", "ulta", "nordstrom", "macy", "tj maxx", "marshalls"
    ],
    "Travel and transportation": [
        "uber", "lyft", "delta air", "united airlines", "american airlines", "southwest",
        "amtrak", "subway transit", "metro transit", "shell oil", "chevron", "bp gas", "exxon",
        "mobil", "texaco", "speedway", "parking", "tollway", "hertz", "enterprise rent", "avis",
        "airbnb", "marriott", "hilton", "hyatt", "booking.com", "expedia"
    ],
    "Bills and utilities": [
        "electric", "power", "water dept", "gas company", "pge", "coned", "national grid",
        "comcast", "xfinity", "at&t", "verizon", "t-mobile", "spectrum", "internet", "utility",
        "waste mgmt", "city water", "trash", "geico", "state farm", "progressive", "allstate"
    ],
    "Healthcare": [
        "pharmacy", "cvs", "walgreens", "rite aid", "hospital", "clinic", "dental", "dentist",
        "vision", "optometry", "kaiser", "quest diag", "labcorp", "doctor", "health center",
        "blue cross", "aetna", "cigna", "medicare", "prescription"
    ],
    "Education": [
        "university", "college", "school", "tuition", "coursera", "udemy", "edx", "chegg",
        "textbook", "student loan", "academy", "training", "books", "campus"
    ],
    "Housing and rent": [
        "rent", "lease", "apartment", "property mgmt", "realty", "mortgage", "housing",
        "hoa fee", "condo fee", "landlord", "real estate"
    ],
    "Entertainment": [
        "netflix", "spotify", "hulu", "disney+", "disney plus", "hbo max", "max.com", "apple tv",
        "paramount+", "youtube premium", "amc theater", "regal cinema", "cinemark", "playstation",
        "xbox", "nintendo", "steam games", "twitch", "audible", "ticketmaster", "concert"
    ],
    "Investments": [
        "vanguard", "fidelity", "charles schwab", "robinhood", "coinbase", "binance",
        "etrade", "td ameritrade", "betterment", "wealthfront", "crypto.com", "kraken",
        "treasury direct", "mutual fund", "etf purchase"
    ],
    "Transfers": [
        "transfer to", "transfer from", "zelle to", "venmo", "cash app", "wire transfer",
        "internal transfer", "ach transfer", "p2p payment", "atm withdrawal", "atm deposit"
    ]
}

# Initial training corpus for machine learning text classifier
TRAINING_DATA = [
    ("payroll direct deposit acme corp", "Salary and income"),
    ("monthly salary payment client inc", "Salary and income"),
    ("freelance software dev payment", "Salary and income"),
    ("stripe payout net earnings", "Salary and income"),
    ("starbucks store #4928 seattle", "Food and dining"),
    ("uber eats delivery order", "Food and dining"),
    ("trader joes market organic grocery", "Food and dining"),
    ("whole foods grocery store", "Food and dining"),
    ("mcdonalds drive thru fast food", "Food and dining"),
    ("chipotle mexican grill lunch", "Food and dining"),
    ("local diner breakfast and coffee", "Food and dining"),
    ("amazon prime order retail items", "Shopping"),
    ("walmart supercenter supplies", "Shopping"),
    ("target department store clothes", "Shopping"),
    ("best buy electronics laptop accessories", "Shopping"),
    ("nike store running shoes", "Shopping"),
    ("home depot hardware tools", "Shopping"),
    ("uber trip transit downtown ride", "Travel and transportation"),
    ("lyft ride to airport terminal", "Travel and transportation"),
    ("shell gas station fuel pump 4", "Travel and transportation"),
    ("chevron gasoline and carwash", "Travel and transportation"),
    ("delta airlines flight reservation ticket", "Travel and transportation"),
    ("amtrak train ticket northeast", "Travel and transportation"),
    ("conedison electric and gas monthly bill", "Bills and utilities"),
    ("verizon wireless cell phone service", "Bills and utilities"),
    ("comcast xfinity high speed broadband", "Bills and utilities"),
    ("city water and sewage utility payment", "Bills and utilities"),
    ("cvs pharmacy prescription medicines", "Healthcare"),
    ("walgreens health store vitamins", "Healthcare"),
    ("dental associates cleaning and filling", "Healthcare"),
    ("city general hospital clinic visit copay", "Healthcare"),
    ("university tuition fee fall semester", "Education"),
    ("coursera monthly learning subscription", "Education"),
    ("udemy online course web development", "Education"),
    ("apartment monthly rent wire payment", "Housing and rent"),
    ("mortgage loan principal and interest", "Housing and rent"),
    ("hoa monthly homeowner dues", "Housing and rent"),
    ("netflix streaming monthly subscription", "Entertainment"),
    ("spotify family music plan", "Entertainment"),
    ("disney plus annual subscription", "Entertainment"),
    ("amc theaters movie tickets and popcorn", "Entertainment"),
    ("playstation network digital game store", "Entertainment"),
    ("vanguard index fund s&p 500 deposit", "Investments"),
    ("fidelity brokerage roth ira contribution", "Investments"),
    ("robinhood instant buying power deposit", "Investments"),
    ("coinbase crypto bitcoin buy", "Investments"),
    ("zelle transfer to friend split", "Transfers"),
    ("venmo balance transfer to checking", "Transfers"),
    ("atm cash withdrawal downtown branch", "Transfers"),
    ("wire transfer out personal savings", "Transfers"),
]

class TransactionCategorizer:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, lowercase=True)
        self.classifier = LogisticRegression(C=1.0, max_iter=200)
        self._train_initial_model()

    def _train_initial_model(self):
        X_texts = [item[0] for item in TRAINING_DATA]
        y_labels = [item[1] for item in TRAINING_DATA]
        X_vec = self.vectorizer.fit_transform(X_texts)
        self.classifier.fit(X_vec, y_labels)

    def extract_merchant(self, description: str) -> str:
        """Cleans and isolates clean merchant name from transaction description"""
        desc = description.strip()
        # Remove common prefix noise: POS DEBIT, ACH, CHECKCARD, DEBIT PURCHASE, SQ *
        cleaned = re.sub(r'^(pos\s+debit|checkcard|purchase\s+authorized\s+on\s+\d{2}/\d{2}|debit\s+card\s+purchase|recurring\s+payment|ach\s+debit|ach\s+credit|sq\s*\*|tst\s*\*|paypal\s*\*|dd\s*\*|sp\s*\*)\s*', '', desc, flags=re.IGNORECASE)
        # Remove trailing transaction numbers, store IDs, state codes, e.g. #4829 CA 94105
        cleaned = re.sub(r'(#\d+|store\s*\d+|\b[A-Z]{2}\s+\d{5}\b|\d{5,})', '', cleaned)
        # Clean extra spaces
        merchant = " ".join(cleaned.split()[:4]).strip()
        return merchant if len(merchant) > 1 else desc[:30]

    def categorize(
        self,
        description: str,
        amount: float,
        transaction_type: str,
        user_corrections: Optional[Dict[str, str]] = None
    ) -> Tuple[str, float, str]:
        """
        Categorizes transaction using a multi-layered hierarchical pipeline:
        1. User-specific learned corrections (Highest priority)
        2. Transaction type heuristics (Salary/Income vs Expenses)
        3. Deterministic keyword and merchant taxonomy matching
        4. Machine Learning model (TF-IDF + Logistic Regression) with calibrated probability
        """
        merchant = self.extract_merchant(description)
        desc_lower = description.lower()
        merchant_lower = merchant.lower()

        # Layer 1: Learned user corrections
        if user_corrections:
            for pattern, corrected_cat in user_corrections.items():
                if pattern.lower() in desc_lower or pattern.lower() in merchant_lower:
                    return corrected_cat, 0.99, merchant

        # Layer 2: Type heuristic for positive income/credits
        if transaction_type == "credit":
            for kw in KEYWORD_RULES["Salary and income"]:
                if kw in desc_lower:
                    return "Salary and income", 0.95, merchant
            if any(w in desc_lower for w in ["refund", "reimbursement", "cashback"]):
                return "Other expenses", 0.90, merchant
            if any(w in desc_lower for w in ["transfer", "zelle", "venmo"]):
                return "Transfers", 0.92, merchant
            # Default credit category
            return "Salary and income", 0.85, merchant

        # Layer 3: Rule-based keyword matching
        for category, keywords in KEYWORD_RULES.items():
            for kw in keywords:
                if re.search(r'\b' + re.escape(kw) + r'\b', desc_lower):
                    confidence = 0.95 if kw in merchant_lower else 0.88
                    return category, confidence, merchant

        # Layer 4: Machine Learning text classification
        try:
            vec = self.vectorizer.transform([description])
            probs = self.classifier.predict_proba(vec)[0]
            max_idx = np.argmax(probs)
            pred_cat = self.classifier.classes_[max_idx]
            conf = float(probs[max_idx])

            # If confidence is moderate to high, accept prediction
            if conf >= 0.35:
                return pred_cat, round(min(conf * 1.25, 0.92), 2), merchant
        except Exception:
            pass

        return "Other expenses", 0.60, merchant

categorizer = TransactionCategorizer()
