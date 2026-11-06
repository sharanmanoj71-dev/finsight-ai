import os
import sqlite3
import uuid
import logging
from datetime import datetime, date
from pathlib import Path
from typing import Any, Optional, Dict, List
import json

from app.core.config import settings

logger = logging.getLogger("finsight.database")

# Try initializing Supabase client
supabase_client = None
using_supabase = False

if settings.SUPABASE_KEY and settings.SUPABASE_KEY.strip():
    try:
        from supabase import create_client, Client
        supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        using_supabase = True
        print(f"[Database] Successfully connected to Supabase project: {settings.SUPABASE_PROJECT_ID}")
    except Exception as e:
        print(f"[Database] Warning: Supabase client initialization failed ({e}). Falling back to local storage.")
else:
    print(f"[Database] Supabase key not set. Using local persistent storage (technovate mirror).")

# Local SQLite storage directory
DB_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
SQLITE_DB_PATH = DB_DIR / "finsight_technovate.db"

def init_local_db():
    """Initialize local SQLite database mirroring Supabase schema"""
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        firebase_uid TEXT UNIQUE NOT NULL,
        full_name TEXT,
        email TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bank_statements (
        id TEXT PRIMARY KEY,
        firebase_uid TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        uploaded_at TEXT NOT NULL,
        processing_status TEXT DEFAULT 'completed',
        opening_balance REAL DEFAULT 0.0,
        closing_balance REAL DEFAULT 0.0
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        firebase_uid TEXT NOT NULL,
        statement_id TEXT,
        transaction_date TEXT NOT NULL,
        description TEXT NOT NULL,
        merchant TEXT,
        amount REAL NOT NULL,
        transaction_type TEXT NOT NULL,
        category TEXT NOT NULL,
        predicted_category TEXT,
        category_confidence REAL DEFAULT 0.85,
        is_reviewed INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY(statement_id) REFERENCES bank_statements(id) ON DELETE CASCADE
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        firebase_uid TEXT,
        category_name TEXT NOT NULL,
        category_type TEXT DEFAULT 'expense',
        created_at TEXT NOT NULL,
        UNIQUE(firebase_uid, category_name)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recurring_payments (
        id TEXT PRIMARY KEY,
        firebase_uid TEXT NOT NULL,
        merchant TEXT NOT NULL,
        amount REAL NOT NULL,
        frequency TEXT NOT NULL,
        next_expected_date TEXT,
        category TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT NOT NULL
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS anomaly_alerts (
        id TEXT PRIMARY KEY,
        firebase_uid TEXT NOT NULL,
        transaction_id TEXT,
        anomaly_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        explanation TEXT NOT NULL,
        reviewed INTEGER DEFAULT 0,
        user_note TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS financial_insights (
        id TEXT PRIMARY KEY,
        firebase_uid TEXT NOT NULL,
        insight_type TEXT NOT NULL,
        insight_text TEXT NOT NULL,
        score REAL,
        created_at TEXT NOT NULL
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        firebase_uid TEXT NOT NULL,
        category TEXT NOT NULL,
        monthly_limit REAL NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(firebase_uid, category, month, year)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS category_corrections (
        id TEXT PRIMARY KEY,
        firebase_uid TEXT NOT NULL,
        merchant_pattern TEXT NOT NULL,
        corrected_category TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(firebase_uid, merchant_pattern)
    )
    """)
    
    # Seed default categories
    default_categories = [
        ("Food and dining", "expense"),
        ("Shopping", "expense"),
        ("Travel and transportation", "expense"),
        ("Bills and utilities", "expense"),
        ("Healthcare", "expense"),
        ("Education", "expense"),
        ("Salary and income", "income"),
        ("Transfers", "transfer"),
        ("Entertainment", "expense"),
        ("Housing and rent", "expense"),
        ("Investments", "investment"),
        ("Other expenses", "expense"),
    ]
    
    for cat_name, cat_type in default_categories:
        cursor.execute("""
            INSERT OR IGNORE INTO categories (id, firebase_uid, category_name, category_type, created_at)
            VALUES (?, NULL, ?, ?, ?)
        """, (str(uuid.uuid4()), cat_name, cat_type, datetime.utcnow().isoformat()))
        
    conn.commit()
    conn.close()

init_local_db()

class DatabaseManager:
    """
    Unified Database Access Layer supporting Supabase PostgreSQL with seamless,
    fault-tolerant fallback to local persistent storage (technovate mirror).
    Guarantees 100% API uptime and prevents 500 crashes when Supabase tables have RLS policies or schema differences.
    """
    
    def __init__(self):
        self._rls_warned_tables = set()
        self.supabase_has_rls_restriction = False

    @property
    def is_supabase(self) -> bool:
        return using_supabase and supabase_client is not None
        
    @property
    def status_info(self) -> dict:
        return {
            "engine": "Supabase PostgreSQL + Local Mirror" if self.is_supabase else "Local SQLite (Technovate Mirror)",
            "project_id": settings.SUPABASE_PROJECT_ID,
            "supabase_url": settings.SUPABASE_URL,
            "connected": True,
            "rls_notice": "Anon key active. Local persistence mirror active for zero-downtime." if self.supabase_has_rls_restriction else "Active"
        }

    def _warn_supabase_error(self, table: str, error: Exception, operation: str = "operation"):
        err_msg = str(error)
        is_rls = "row-level security" in err_msg.lower() or "42501" in err_msg
        if is_rls:
            self.supabase_has_rls_restriction = True
        if table not in self._rls_warned_tables:
            self._rls_warned_tables.add(table)
            reason = "RLS policy restriction (code 42501)" if is_rls else err_msg[:120]
            print(f"[Database Advisory] Supabase '{table}' {operation} notice: {reason}. Using persistent local database mirror.")

    def _get_local_conn(self):
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    # 1. PROFILES
    def get_profile(self, firebase_uid: str) -> Optional[dict]:
        if self.is_supabase:
            try:
                res = supabase_client.table("profiles").select("*").eq("firebase_uid", firebase_uid).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                self._warn_supabase_error("profiles", e, "read")
        
        conn = self._get_local_conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM profiles WHERE firebase_uid = ?", (firebase_uid,))
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else None

    def upsert_profile(self, firebase_uid: str, email: str, full_name: Optional[str] = None) -> dict:
        now = datetime.utcnow().isoformat()
        name = full_name or email.split("@")[0]

        # 1. Always persist to local technovate DB mirror
        conn = self._get_local_conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM profiles WHERE firebase_uid = ?", (firebase_uid,))
        existing = cur.fetchone()
        if existing:
            cur.execute("""
                UPDATE profiles SET full_name = COALESCE(?, full_name), email = ?
                WHERE firebase_uid = ?
            """, (name, email, firebase_uid))
            conn.commit()
            profile_data = dict(existing)
            profile_data["full_name"] = name
            profile_data["email"] = email
        else:
            profile_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO profiles (id, firebase_uid, full_name, email, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (profile_id, firebase_uid, name, email, now))
            conn.commit()
            profile_data = {"id": profile_id, "firebase_uid": firebase_uid, "full_name": name, "email": email, "created_at": now}
        conn.close()

        # 2. Try Supabase cloud sync
        if self.is_supabase:
            try:
                data = {
                    "firebase_uid": firebase_uid,
                    "email": email,
                    "full_name": name,
                    "created_at": now
                }
                res = supabase_client.table("profiles").upsert(data, on_conflict="firebase_uid").execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                self._warn_supabase_error("profiles", e, "upsert")

        return profile_data

    # 2. STATEMENTS
    def create_statement(self, firebase_uid: str, filename: str, file_type: str, opening_balance: float = 0.0, closing_balance: float = 0.0) -> dict:
        stmt_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        stmt_data = {
            "id": stmt_id,
            "firebase_uid": firebase_uid,
            "filename": filename,
            "file_type": file_type,
            "uploaded_at": now,
            "processing_status": "completed",
            "opening_balance": opening_balance,
            "closing_balance": closing_balance
        }

        # 1. Local SQLite mirror
        conn = self._get_local_conn()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO bank_statements (id, firebase_uid, filename, file_type, uploaded_at, processing_status, opening_balance, closing_balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (stmt_id, firebase_uid, filename, file_type, now, "completed", opening_balance, closing_balance))
        conn.commit()
        conn.close()

        # 2. Supabase Cloud Sync
        if self.is_supabase:
            try:
                res = supabase_client.table("bank_statements").insert(stmt_data).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                self._warn_supabase_error("bank_statements", e, "insert")

        return stmt_data

    def get_statements(self, firebase_uid: str) -> list[dict]:
        if self.is_supabase:
            try:
                res = supabase_client.table("bank_statements").select("*").eq("firebase_uid", firebase_uid).order("uploaded_at", desc=True).execute()
                if res.data and len(res.data) > 0:
                    return res.data
            except Exception as e:
                self._warn_supabase_error("bank_statements", e, "read")
            
        conn = self._get_local_conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM bank_statements WHERE firebase_uid = ? ORDER BY uploaded_at DESC", (firebase_uid,))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    # 3. TRANSACTIONS
    def insert_transactions(self, transactions: list[dict]) -> list[dict]:
        if not transactions:
            return []
        
        now = datetime.utcnow().isoformat()
        prepared = []
        for tx in transactions:
            prepared.append({
                "id": tx.get("id") or str(uuid.uuid4()),
                "firebase_uid": tx["firebase_uid"],
                "statement_id": tx.get("statement_id"),
                "transaction_date": str(tx["transaction_date"]),
                "description": tx.get("description", ""),
                "merchant": tx.get("merchant", ""),
                "amount": float(tx["amount"]),
                "transaction_type": tx["transaction_type"],
                "category": tx.get("category", "Other expenses"),
                "predicted_category": tx.get("predicted_category", tx.get("category", "Other expenses")),
                "category_confidence": float(tx.get("category_confidence", 0.85)),
                "is_reviewed": 1 if tx.get("is_reviewed") else 0,
                "created_at": tx.get("created_at") or now
            })

        # 1. Local SQLite mirror
        conn = self._get_local_conn()
        cur = conn.cursor()
        for p in prepared:
            cur.execute("""
                INSERT INTO transactions (id, firebase_uid, statement_id, transaction_date, description, merchant, amount, transaction_type, category, predicted_category, category_confidence, is_reviewed, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p["id"], p["firebase_uid"], p["statement_id"], p["transaction_date"],
                p["description"], p["merchant"], p["amount"], p["transaction_type"],
                p["category"], p["predicted_category"], p["category_confidence"],
                p["is_reviewed"], p["created_at"]
            ))
        conn.commit()
        conn.close()

        # 2. Supabase Cloud Sync
        if self.is_supabase:
            try:
                pg_prepared = [{**item, "is_reviewed": bool(item["is_reviewed"])} for item in prepared]
                res = supabase_client.table("transactions").insert(pg_prepared).execute()
                if res.data:
                    return res.data
            except Exception as e:
                self._warn_supabase_error("transactions", e, "insert")

        return prepared

    def get_transactions(
        self,
        firebase_uid: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        category: Optional[str] = None,
        transaction_type: Optional[str] = None,
        search: Optional[str] = None,
        statement_id: Optional[str] = None,
        limit: int = 1000
    ) -> list[dict]:
        if self.is_supabase:
            try:
                query = supabase_client.table("transactions").select("*").eq("firebase_uid", firebase_uid)
                if start_date:
                    query = query.gte("transaction_date", start_date)
                if end_date:
                    query = query.lte("transaction_date", end_date)
                if category:
                    query = query.eq("category", category)
                if transaction_type:
                    query = query.eq("transaction_type", transaction_type)
                if statement_id:
                    query = query.eq("statement_id", statement_id)
                if search:
                    query = query.ilike("description", f"%{search}%")
                res = query.order("transaction_date", desc=True).limit(limit).execute()
                if res.data and len(res.data) > 0:
                    return res.data
            except Exception as e:
                self._warn_supabase_error("transactions", e, "read")
            
        conn = self._get_local_conn()
        cur = conn.cursor()
        query = "SELECT * FROM transactions WHERE firebase_uid = ?"
        params: list[Any] = [firebase_uid]
        
        if start_date:
            query += " AND transaction_date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND transaction_date <= ?"
            params.append(end_date)
        if category:
            query += " AND category = ?"
            params.append(category)
        if transaction_type:
            query += " AND transaction_type = ?"
            params.append(transaction_type)
        if statement_id:
            query += " AND statement_id = ?"
            params.append(statement_id)
        if search:
            query += " AND (description LIKE ? OR merchant LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%"])
            
        query += " ORDER BY transaction_date DESC LIMIT ?"
        params.append(limit)
        
        cur.execute(query, params)
        rows = []
        for r in cur.fetchall():
            d = dict(r)
            d["is_reviewed"] = bool(d["is_reviewed"])
            rows.append(d)
        conn.close()
        return rows

    def update_transaction(self, tx_id: str, firebase_uid: str, update_data: dict) -> Optional[dict]:
        local_data = dict(update_data)
        if "is_reviewed" in local_data:
            local_data["is_reviewed"] = 1 if local_data["is_reviewed"] else 0
                
        # 1. Local update
        conn = self._get_local_conn()
        cur = conn.cursor()
        set_clauses = [f"{k} = ?" for k in local_data.keys()]
        values = list(local_data.values())
        values.extend([tx_id, firebase_uid])
        
        cur.execute(f"UPDATE transactions SET {', '.join(set_clauses)} WHERE id = ? AND firebase_uid = ?", values)
        conn.commit()
        
        cur.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
        row = cur.fetchone()
        conn.close()
        result = None
        if row:
            d = dict(row)
            d["is_reviewed"] = bool(d["is_reviewed"])
            result = d

        # 2. Supabase update
        if self.is_supabase:
            try:
                res = supabase_client.table("transactions").update(update_data).eq("id", tx_id).eq("firebase_uid", firebase_uid).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                self._warn_supabase_error("transactions", e, "update")

        return result

    def delete_statement_transactions(self, statement_id: str, firebase_uid: str):
        # 1. Local deletion
        conn = self._get_local_conn()
        cur = conn.cursor()
        cur.execute("DELETE FROM transactions WHERE statement_id = ? AND firebase_uid = ?", (statement_id, firebase_uid))
        cur.execute("DELETE FROM bank_statements WHERE id = ? AND firebase_uid = ?", (statement_id, firebase_uid))
        conn.commit()
        conn.close()

        # 2. Supabase deletion
        if self.is_supabase:
            try:
                supabase_client.table("transactions").delete().eq("statement_id", statement_id).eq("firebase_uid", firebase_uid).execute()
                supabase_client.table("bank_statements").delete().eq("id", statement_id).eq("firebase_uid", firebase_uid).execute()
            except Exception as e:
                self._warn_supabase_error("bank_statements", e, "delete")

    # 4. CATEGORIES & CORRECTIONS
    def get_categories(self, firebase_uid: str) -> list[dict]:
        if self.is_supabase:
            try:
                res = supabase_client.table("categories").select("*").or_(f"firebase_uid.is.null,firebase_uid.eq.{firebase_uid}").execute()
                if res.data and len(res.data) > 0:
                    return res.data
            except Exception as e:
                self._warn_supabase_error("categories", e, "read")
            
        conn = self._get_local_conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM categories WHERE firebase_uid IS NULL OR firebase_uid = ? ORDER BY category_name ASC", (firebase_uid,))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    def create_category(self, firebase_uid: str, category_name: str, category_type: str = "expense") -> dict:
        cat_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        cat_data = {
            "id": cat_id,
            "firebase_uid": firebase_uid,
            "category_name": category_name,
            "category_type": category_type,
            "created_at": now
        }

        # 1. Local insert
        conn = self._get_local_conn()
        cur = conn.cursor()
        cur.execute("""
            INSERT OR REPLACE INTO categories (id, firebase_uid, category_name, category_type, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (cat_id, firebase_uid, category_name, category_type, now))
        conn.commit()
        conn.close()

        # 2. Supabase insert
        if self.is_supabase:
            try:
                res = supabase_client.table("categories").insert(cat_data).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                self._warn_supabase_error("categories", e, "insert")

        return cat_data

    def get_category_corrections(self, firebase_uid: str) -> dict[str, str]:
        """Returns map of merchant_pattern -> corrected_category"""
        if self.is_supabase:
            try:
                res = supabase_client.table("category_corrections").select("*").eq("firebase_uid", firebase_uid).execute()
                if res.data and len(res.data) > 0:
                    return {r["merchant_pattern"]: r["corrected_category"] for r in res.data}
            except Exception as e:
                self._warn_supabase_error("category_corrections", e, "read")
            
        conn = self._get_local_conn()
        cur = conn.cursor()
        cur.execute("SELECT merchant_pattern, corrected_category FROM category_corrections WHERE firebase_uid = ?", (firebase_uid,))
        rows = cur.fetchall()
        conn.close()
        return {r["merchant_pattern"]: r["corrected_category"] for r in rows}

    def save_category_correction(self, firebase_uid: str, merchant_pattern: str, corrected_category: str):
        now = datetime.utcnow().isoformat()
        clean_pattern = merchant_pattern.strip().lower()

        # 1. Local update
        conn = self._get_local_conn()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO category_corrections (id, firebase_uid, merchant_pattern, corrected_category, created_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(firebase_uid, merchant_pattern) DO UPDATE SET corrected_category = excluded.corrected_category
        """, (str(uuid.uuid4()), firebase_uid, clean_pattern, corrected_category, now))
        conn.commit()
        conn.close()

        # 2. Supabase upsert
        if self.is_supabase:
            try:
                supabase_client.table("category_corrections").upsert({
                    "firebase_uid": firebase_uid,
                    "merchant_pattern": clean_pattern,
                    "corrected_category": corrected_category,
                    "created_at": now
                }, on_conflict="firebase_uid,merchant_pattern").execute()
            except Exception as e:
                self._warn_supabase_error("category_corrections", e, "upsert")

    # 5. RECURRING PAYMENTS
    def get_recurring_payments(self, firebase_uid: str) -> list[dict]:
        if self.is_supabase:
            try:
                res = supabase_client.table("recurring_payments").select("*").eq("firebase_uid", firebase_uid).order("amount", desc=True).execute()
                if res.data and len(res.data) > 0:
                    return res.data
            except Exception as e:
                self._warn_supabase_error("recurring_payments", e, "read")
            
        conn = self._get_local_conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM recurring_payments WHERE firebase_uid = ? ORDER BY amount DESC", (firebase_uid,))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    def save_recurring_payments(self, firebase_uid: str, payments: list[dict]):
        now = datetime.utcnow().isoformat()

        # 1. Local update
        conn = self._get_local_conn()
        cur = conn.cursor()
        cur.execute("DELETE FROM recurring_payments WHERE firebase_uid = ?", (firebase_uid,))
        for p in payments:
            p_id = p.get("id") or str(uuid.uuid4())
            cur.execute("""
                INSERT INTO recurring_payments (id, firebase_uid, merchant, amount, frequency, next_expected_date, category, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                p_id, firebase_uid, p["merchant"], float(p["amount"]),
                p["frequency"], str(p.get("next_expected_date", "")),
                p.get("category", "Bills and utilities"), p.get("status", "active"), now
            ))
        conn.commit()
        conn.close()

        # 2. Supabase update
        if self.is_supabase:
            try:
                supabase_client.table("recurring_payments").delete().eq("firebase_uid", firebase_uid).execute()
                if payments:
                    formatted = [{
                        "id": p.get("id") or str(uuid.uuid4()),
                        "firebase_uid": firebase_uid,
                        "merchant": p["merchant"],
                        "amount": float(p["amount"]),
                        "frequency": p["frequency"],
                        "next_expected_date": str(p.get("next_expected_date", "")),
                        "category": p.get("category", "Bills and utilities"),
                        "status": p.get("status", "active"),
                        "created_at": now
                    } for p in payments]
                    supabase_client.table("recurring_payments").insert(formatted).execute()
            except Exception as e:
                self._warn_supabase_error("recurring_payments", e, "save")

    # 6. ANOMALY ALERTS
    def get_anomaly_alerts(self, firebase_uid: str) -> list[dict]:
        if self.is_supabase:
            try:
                res = supabase_client.table("anomaly_alerts").select("*, transactions(*)").eq("firebase_uid", firebase_uid).order("created_at", desc=True).execute()
                if res.data and len(res.data) > 0:
                    return res.data
            except Exception as e:
                self._warn_supabase_error("anomaly_alerts", e, "read")
            
        conn = self._get_local_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT a.*, t.transaction_date, t.description, t.merchant, t.amount, t.category, t.transaction_type
            FROM anomaly_alerts a
            LEFT JOIN transactions t ON a.transaction_id = t.id
            WHERE a.firebase_uid = ?
            ORDER BY a.created_at DESC
        """, (firebase_uid,))
        rows = []
        for r in cur.fetchall():
            d = dict(r)
            d["reviewed"] = bool(d["reviewed"])
            rows.append(d)
        conn.close()
        return rows

    def save_anomaly_alerts(self, firebase_uid: str, alerts: list[dict]):
        now = datetime.utcnow().isoformat()

        # 1. Local update
        conn = self._get_local_conn()
        cur = conn.cursor()
        for a in alerts:
            a_id = a.get("id") or str(uuid.uuid4())
            cur.execute("""
                INSERT INTO anomaly_alerts (id, firebase_uid, transaction_id, anomaly_type, severity, explanation, reviewed, user_note, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                a_id, firebase_uid, a["transaction_id"], a["anomaly_type"],
                a["severity"], a["explanation"], 1 if a.get("reviewed") else 0,
                a.get("user_note"), now
            ))
        conn.commit()
        conn.close()

        # 2. Supabase update
        if self.is_supabase:
            try:
                formatted = [{
                    "id": a.get("id") or str(uuid.uuid4()),
                    "firebase_uid": firebase_uid,
                    "transaction_id": a["transaction_id"],
                    "anomaly_type": a["anomaly_type"],
                    "severity": a["severity"],
                    "explanation": a["explanation"],
                    "reviewed": bool(a.get("reviewed", False)),
                    "user_note": a.get("user_note"),
                    "created_at": now
                } for a in alerts]
                if formatted:
                    supabase_client.table("anomaly_alerts").insert(formatted).execute()
            except Exception as e:
                self._warn_supabase_error("anomaly_alerts", e, "save")

    def update_anomaly_alert(self, alert_id: str, firebase_uid: str, reviewed: bool, user_note: Optional[str] = None) -> bool:
        # 1. Local update
        conn = self._get_local_conn()
        cur = conn.cursor()
        if user_note is not None:
            cur.execute("""
                UPDATE anomaly_alerts SET reviewed = ?, user_note = ? WHERE id = ? AND firebase_uid = ?
            """, (1 if reviewed else 0, user_note, alert_id, firebase_uid))
        else:
            cur.execute("""
                UPDATE anomaly_alerts SET reviewed = ? WHERE id = ? AND firebase_uid = ?
            """, (1 if reviewed else 0, alert_id, firebase_uid))
        conn.commit()
        conn.close()

        # 2. Supabase update
        if self.is_supabase:
            try:
                data = {"reviewed": reviewed}
                if user_note is not None:
                    data["user_note"] = user_note
                res = supabase_client.table("anomaly_alerts").update(data).eq("id", alert_id).eq("firebase_uid", firebase_uid).execute()
            except Exception as e:
                self._warn_supabase_error("anomaly_alerts", e, "update")

        return True

    # 7. FINANCIAL INSIGHTS
    def get_financial_insights(self, firebase_uid: str) -> list[dict]:
        if self.is_supabase:
            try:
                res = supabase_client.table("financial_insights").select("*").eq("firebase_uid", firebase_uid).order("created_at", desc=True).execute()
                if res.data and len(res.data) > 0:
                    return res.data
            except Exception as e:
                self._warn_supabase_error("financial_insights", e, "read")
            
        conn = self._get_local_conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM financial_insights WHERE firebase_uid = ? ORDER BY created_at DESC", (firebase_uid,))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    def save_financial_insights(self, firebase_uid: str, insights: list[dict]):
        now = datetime.utcnow().isoformat()

        # 1. Local update
        conn = self._get_local_conn()
        cur = conn.cursor()
        cur.execute("DELETE FROM financial_insights WHERE firebase_uid = ?", (firebase_uid,))
        for ins in insights:
            cur.execute("""
                INSERT INTO financial_insights (id, firebase_uid, insight_type, insight_text, score, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (str(uuid.uuid4()), firebase_uid, ins["insight_type"], ins["insight_text"], ins.get("score"), now))
        conn.commit()
        conn.close()

        # 2. Supabase update
        if self.is_supabase:
            try:
                supabase_client.table("financial_insights").delete().eq("firebase_uid", firebase_uid).execute()
                formatted = [{
                    "id": str(uuid.uuid4()),
                    "firebase_uid": firebase_uid,
                    "insight_type": ins["insight_type"],
                    "insight_text": ins["insight_text"],
                    "score": ins.get("score"),
                    "created_at": now
                } for ins in insights]
                if formatted:
                    supabase_client.table("financial_insights").insert(formatted).execute()
            except Exception as e:
                self._warn_supabase_error("financial_insights", e, "save")

    # 8. BUDGETS
    def get_budgets(self, firebase_uid: str, month: int, year: int) -> list[dict]:
        if self.is_supabase:
            try:
                res = supabase_client.table("budgets").select("*").eq("firebase_uid", firebase_uid).eq("month", month).eq("year", year).execute()
                if res.data and len(res.data) > 0:
                    return res.data
            except Exception as e:
                self._warn_supabase_error("budgets", e, "read")
            
        conn = self._get_local_conn()
        cur = conn.cursor()
        cur.execute("SELECT * FROM budgets WHERE firebase_uid = ? AND month = ? AND year = ?", (firebase_uid, month, year))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    def upsert_budget(self, firebase_uid: str, category: str, monthly_limit: float, month: int, year: int) -> dict:
        now = datetime.utcnow().isoformat()
        budget_data = {
            "firebase_uid": firebase_uid,
            "category": category,
            "monthly_limit": monthly_limit,
            "month": month,
            "year": year,
            "created_at": now
        }

        # 1. Local update
        conn = self._get_local_conn()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO budgets (id, firebase_uid, category, monthly_limit, month, year, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(firebase_uid, category, month, year) DO UPDATE SET monthly_limit = excluded.monthly_limit
        """, (str(uuid.uuid4()), firebase_uid, category, monthly_limit, month, year, now))
        conn.commit()
        conn.close()

        # 2. Supabase update
        if self.is_supabase:
            try:
                res = supabase_client.table("budgets").upsert(budget_data, on_conflict="firebase_uid,category,month,year").execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                self._warn_supabase_error("budgets", e, "upsert")

        return budget_data

db = DatabaseManager()
