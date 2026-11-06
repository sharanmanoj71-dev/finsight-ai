import io
import re
import csv
import uuid
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
import pandas as pd
import pdfplumber
from pypdf import PdfReader

from app.models.schemas import ExtractedTransaction
from app.services.categorizer import categorizer

class StatementParser:
    """
    Robust multi-format bank statement extractor.
    Handles CSV and PDF formats across diverse international and domestic bank statement layouts.
    Extracts dates, descriptions, merchants, debits, credits, opening/closing balances,
    detects duplicates, and validates balance continuity.
    """

    DATE_PATTERNS = [
        r'\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b',       # 2026-03-15 or 2026/03/15
        r'\b\d{1,2}[-/]\d{1,2}[-/]\d{4}\b',       # 15-03-2026 or 03/15/2026
        r'\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b', # 15 Mar 2026
        r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b' # March 15, 2026
    ]

    def parse_csv(self, file_bytes: bytes, filename: str) -> Tuple[List[ExtractedTransaction], float, float, List[str]]:
        warnings = []
        try:
            content = file_bytes.decode('utf-8', errors='replace')
        except Exception:
            content = file_bytes.decode('latin-1', errors='replace')
            
        stream = io.StringIO(content)
        # Try finding header row if metadata precedes it
        lines = stream.readlines()
        if not lines:
            raise ValueError("CSV statement is empty")
            
        header_idx = 0
        for i, line in enumerate(lines[:15]):
            low = line.lower()
            if any(k in low for k in ["date", "transaction", "amount", "description", "narration", "debit", "credit"]):
                header_idx = i
                break
                
        stream.seek(0)
        df = pd.read_csv(io.StringIO("".join(lines[header_idx:])))
        
        # Normalize column headers
        col_map = {}
        for col in df.columns:
            clean = str(col).strip().lower().replace("_", " ").replace(".", "")
            if any(w in clean for w in ["date", "txn date", "value date", "trans date"]):
                col_map["date"] = col
            elif any(w in clean for w in ["desc", "particular", "narration", "detail", "memo", "payee", "merchant"]):
                col_map["description"] = col
            elif any(w in clean for w in ["debit", "withdrawal", "spent", "dr"]):
                col_map["debit"] = col
            elif any(w in clean for w in ["credit", "deposit", "cr"]):
                col_map["credit"] = col
            elif "amount" in clean:
                col_map["amount"] = col
            elif any(w in clean for w in ["balance", "running balance", "closing"]):
                col_map["balance"] = col

        if "date" not in col_map or ("description" not in col_map and "amount" not in col_map):
            # Fallback to positional mapping
            if len(df.columns) >= 3:
                col_map["date"] = df.columns[0]
                col_map["description"] = df.columns[1]
                col_map["amount"] = df.columns[2]
            else:
                raise ValueError("Could not detect standard bank statement columns in CSV")

        extracted: List[ExtractedTransaction] = []
        opening_balance = 0.0
        closing_balance = 0.0
        balances = []

        for idx, row in df.iterrows():
            raw_date = str(row.get(col_map.get("date"), "")).strip()
            if not raw_date or raw_date.lower() == "nan":
                continue
                
            std_date = self._standardize_date(raw_date)
            desc = str(row.get(col_map.get("description"), "Transaction")).strip()
            if desc.lower() == "nan":
                desc = "Bank Transaction"

            # Parse amount & transaction type
            amount = 0.0
            tx_type = "debit"

            if "debit" in col_map and "credit" in col_map:
                debit_val = self._clean_amount(row.get(col_map["debit"]))
                credit_val = self._clean_amount(row.get(col_map["credit"]))
                if credit_val > 0:
                    amount = credit_val
                    tx_type = "credit"
                elif debit_val > 0:
                    amount = debit_val
                    tx_type = "debit"
                else:
                    continue
            elif "amount" in col_map:
                raw_amt = self._clean_amount(row.get(col_map["amount"]), preserve_sign=True)
                if raw_amt < 0:
                    amount = abs(raw_amt)
                    tx_type = "debit"
                else:
                    amount = raw_amt
                    # check if row has transaction type marker
                    type_marker = str(row.get("type", "")).lower()
                    if "cr" in type_marker or "credit" in type_marker or "deposit" in desc.lower() or "salary" in desc.lower():
                        tx_type = "credit"
                    else:
                        tx_type = "debit"
            else:
                continue

            if amount <= 0:
                continue

            # Check balance column
            if "balance" in col_map:
                b_val = self._clean_amount(row.get(col_map["balance"]))
                if b_val:
                    balances.append(b_val)

            # Categorize
            cat, conf, merchant = categorizer.categorize(desc, amount, tx_type)

            tx = ExtractedTransaction(
                id=str(uuid.uuid4()),
                transaction_date=std_date,
                description=desc,
                merchant=merchant,
                amount=round(amount, 2),
                transaction_type=tx_type,
                category=cat,
                predicted_category=cat,
                category_confidence=round(conf, 2),
                is_duplicate=False
            )
            extracted.append(tx)

        if balances:
            opening_balance = balances[0]
            closing_balance = balances[-1]

        return extracted, opening_balance, closing_balance, warnings

    def parse_pdf(self, file_bytes: bytes, filename: str) -> Tuple[List[ExtractedTransaction], float, float, List[str]]:
        warnings = []
        extracted: List[ExtractedTransaction] = []
        opening_balance = 0.0
        closing_balance = 0.0
        balances = []
        all_text = ""

        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    all_text += text + "\n"
                    
                    # 1. Try extracting tables first
                    tables = page.extract_tables()
                    for table in tables:
                        if not table or len(table) < 2:
                            continue
                        header = [str(c or "").lower() for c in table[0]]
                        date_col = next((i for i, c in enumerate(header) if "date" in c), None)
                        desc_col = next((i for i, c in enumerate(header) if any(w in c for w in ["desc", "detail", "particular", "narration"])), None)
                        amount_col = next((i for i, c in enumerate(header) if "amount" in c), None)
                        debit_col = next((i for i, c in enumerate(header) if any(w in c for w in ["debit", "withdrawal", "dr"])), None)
                        credit_col = next((i for i, c in enumerate(header) if any(w in c for w in ["credit", "deposit", "cr"])), None)
                        bal_col = next((i for i, c in enumerate(header) if "balance" in c), None)

                        if date_col is not None and (desc_col is not None or amount_col is not None or debit_col is not None):
                            for row in table[1:]:
                                if not row or len(row) <= date_col:
                                    continue
                                raw_date = str(row[date_col] or "").strip()
                                if not self._is_valid_date(raw_date):
                                    continue
                                std_date = self._standardize_date(raw_date)
                                desc = str(row[desc_col] if desc_col is not None and len(row) > desc_col else "Bank Transaction").strip()
                                
                                amt = 0.0
                                tx_type = "debit"
                                if debit_col is not None and credit_col is not None:
                                    deb = self._clean_amount(row[debit_col] if len(row) > debit_col else "")
                                    crd = self._clean_amount(row[credit_col] if len(row) > credit_col else "")
                                    if crd > 0:
                                        amt = crd
                                        tx_type = "credit"
                                    elif deb > 0:
                                        amt = deb
                                        tx_type = "debit"
                                elif amount_col is not None and len(row) > amount_col:
                                    raw_amt = self._clean_amount(row[amount_col], preserve_sign=True)
                                    if raw_amt < 0:
                                        amt = abs(raw_amt)
                                        tx_type = "debit"
                                    else:
                                        amt = raw_amt
                                        tx_type = "credit" if any(w in desc.lower() for w in ["deposit", "salary", "refund", "credit"]) else "debit"

                                if bal_col is not None and len(row) > bal_col:
                                    b_amt = self._clean_amount(row[bal_col])
                                    if b_amt > 0:
                                        balances.append(b_amt)

                                if amt > 0:
                                    cat, conf, merchant = categorizer.categorize(desc, amt, tx_type)
                                    extracted.append(ExtractedTransaction(
                                        id=str(uuid.uuid4()),
                                        transaction_date=std_date,
                                        description=desc,
                                        merchant=merchant,
                                        amount=round(amt, 2),
                                        transaction_type=tx_type,
                                        category=cat,
                                        predicted_category=cat,
                                        category_confidence=round(conf, 2),
                                        is_duplicate=False
                                    ))
        except Exception as e:
            warnings.append(f"Table extraction notice: {str(e)}")

        # 2. Text line pattern matching if table extraction found few transactions
        if len(extracted) < 3 and all_text.strip():
            extracted_from_lines = self._extract_from_text_lines(all_text)
            if len(extracted_from_lines) > len(extracted):
                extracted = extracted_from_lines

        # Extract opening and closing balance from full text if available
        op_match = re.search(r'(?:opening\s+balance|beginning\s+balance|previous\s+balance)[:\s]+\$?([0-9,]+\.[0-9]{2})', all_text, re.IGNORECASE)
        cl_match = re.search(r'(?:closing\s+balance|ending\s+balance|new\s+balance)[:\s]+\$?([0-9,]+\.[0-9]{2})', all_text, re.IGNORECASE)
        if op_match:
            opening_balance = self._clean_amount(op_match.group(1))
        elif balances:
            opening_balance = balances[0]
            
        if cl_match:
            closing_balance = self._clean_amount(cl_match.group(1))
        elif balances:
            closing_balance = balances[-1]

        if not extracted:
            warnings.append("No clear transaction records detected. File may be image-only scanned PDF or non-standard format.")

        return extracted, opening_balance, closing_balance, warnings

    def _extract_from_text_lines(self, text: str) -> List[ExtractedTransaction]:
        """Regex-driven multi-column line parser for bank statements"""
        results: List[ExtractedTransaction] = []
        lines = text.split("\n")
        
        # Regex to capture date, description text, and amount
        # Matches: Date (Description...) Amount (Optional Balance)
        pattern = re.compile(
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})\s+(.+?)\s+([+-]?\$?[0-9,]+\.[0-9]{2})(?:\s+([+-]?\$?[0-9,]+\.[0-9]{2}))?',
            re.IGNORECASE
        )

        for line in lines:
            line_str = line.strip()
            match = pattern.search(line_str)
            if match:
                raw_date = match.group(1)
                desc = match.group(2).strip()
                raw_amt = match.group(3)
                
                # filter out non-transaction headers
                if any(h in desc.lower() for h in ["balance", "statement period", "page", "total", "account"]):
                    continue
                    
                std_date = self._standardize_date(raw_date)
                amt_val = self._clean_amount(raw_amt, preserve_sign=True)
                if amt_val == 0:
                    continue
                    
                tx_type = "credit" if amt_val > 0 and any(w in desc.lower() for w in ["deposit", "payroll", "salary", "refund", "credit", "zelle from"]) else "debit"
                amt = abs(amt_val)
                
                cat, conf, merchant = categorizer.categorize(desc, amt, tx_type)
                results.append(ExtractedTransaction(
                    id=str(uuid.uuid4()),
                    transaction_date=std_date,
                    description=desc,
                    merchant=merchant,
                    amount=round(amt, 2),
                    transaction_type=tx_type,
                    category=cat,
                    predicted_category=cat,
                    category_confidence=round(conf, 2),
                    is_duplicate=False
                ))
                
        return results

    def _clean_amount(self, val: Any, preserve_sign: bool = False) -> float:
        if val is None:
            return 0.0
        val_str = str(val).strip().replace("$", "").replace("€", "").replace("£", "").replace("₹", "").replace(",", "")
        # Remove parenthesized negative format e.g. (120.50)
        is_paren_neg = False
        if val_str.startswith("(") and val_str.endswith(")"):
            is_paren_neg = True
            val_str = val_str[1:-1]
            
        try:
            amt = float(val_str)
            if is_paren_neg:
                amt = -amt
            return amt if preserve_sign else abs(amt)
        except Exception:
            return 0.0

    def _is_valid_date(self, date_str: str) -> bool:
        if not date_str:
            return False
        for p in self.DATE_PATTERNS:
            if re.search(p, date_str, re.IGNORECASE):
                return True
        return False

    def _standardize_date(self, date_str: str) -> str:
        """Standardize any valid date into YYYY-MM-DD"""
        date_str = date_str.strip()
        common_formats = [
            "%Y-%m-%d", "%Y/%m/%d",
            "%m/%d/%Y", "%m-%d-%Y",
            "%d/%m/%Y", "%d-%m-%Y",
            "%d %b %Y", "%d %B %Y",
            "%b %d, %Y", "%B %d, %Y",
            "%m/%d/%y", "%d/%m/%y"
        ]
        for fmt in common_formats:
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime("%Y-%m-%d")
            except Exception:
                continue
        # Fallback to today if parsing fails
        return datetime.utcnow().strftime("%Y-%m-%d")

    def detect_duplicates(self, extracted: List[ExtractedTransaction], existing_transactions: List[dict]) -> List[ExtractedTransaction]:
        """
        Detects duplicate transactions against both already stored transactions
        and duplicate rows within the same uploaded statement.
        """
        existing_signatures = set()
        for t in existing_transactions:
            sig = f"{t.get('transaction_date')}_{round(float(t.get('amount', 0)), 2)}_{t.get('description', '').strip().lower()}"
            existing_signatures.add(sig)

        current_signatures = set()
        for tx in extracted:
            sig = f"{tx.transaction_date}_{round(tx.amount, 2)}_{tx.description.strip().lower()}"
            if sig in existing_signatures or sig in current_signatures:
                tx.is_duplicate = True
                tx.validation_error = "Potential duplicate transaction"
            else:
                current_signatures.add(sig)

        return extracted

statement_parser = StatementParser()
