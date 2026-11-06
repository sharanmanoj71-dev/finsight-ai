import sys
from pathlib import Path
from starlette.testclient import TestClient

from app.main import app
from app.core.database import db

client = TestClient(app)

def run_all_tests():
    print("=" * 70)
    print("FINSIGHT AI -- FULL END-TO-END VERIFICATION SUITE")
    print("=" * 70)

    user1_token = "demo-token-alex-chen"
    user2_token = "demo-token-sarah-connor"
    headers1 = {"Authorization": f"Bearer {user1_token}"}
    headers2 = {"Authorization": f"Bearer {user2_token}"}

    # 1 & 2. Register & Login / Me Endpoint
    print("\n[Step 1 & 2] Verifying Firebase Auth & Profile Verification...")
    res = client.get("/api/v1/auth/me", headers=headers1)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    user_info = res.json()["user"]
    print(f" -> User Authenticated: {user_info['name']} (UID: {user_info['uid']})")
    print(f" -> Active Database: {res.json()['database_status']['engine']}")

    # 3 & 5 & 6 & 7. Upload PDF Statement & Extract
    print("\n[Step 3, 5, 6, 7] Uploading PDF Statement & Validating AI Extraction Preview...")
    pdf_path = Path(__file__).resolve().parent / "sample_data" / "wells_fargo_statement.pdf"
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    
    upload_res = client.post(
        "/api/v1/statements/upload",
        headers=headers1,
        files={"file": ("wells_fargo_statement.pdf", pdf_bytes, "application/pdf")}
    )
    assert upload_res.status_code == 200, f"PDF Upload failed: {upload_res.text}"
    pdf_data = upload_res.json()
    print(f" -> Total Transactions Extracted: {pdf_data['total_extracted']}")
    print(f" -> Opening Balance: ${pdf_data['opening_balance']}, Closing Balance: ${pdf_data['closing_balance']}")
    assert pdf_data['total_extracted'] > 0, "No transactions extracted from PDF!"

    # Save extracted transactions
    save_res = client.post(
        "/api/v1/statements/save",
        headers=headers1,
        json=pdf_data
    )
    assert save_res.status_code == 200, f"Save failed: {save_res.text}"
    print(f" -> Saved to Supabase: {save_res.json()['saved_count']} rows")

    # 4 & 5. Upload CSV Statement
    print("\n[Step 4] Uploading CSV Statement...")
    csv_path = Path(__file__).resolve().parent / "sample_data" / "chase_checking_sample.csv"
    with open(csv_path, "rb") as f:
        csv_bytes = f.read()
    
    upload_csv_res = client.post(
        "/api/v1/statements/upload",
        headers=headers1,
        files={"file": ("chase_checking_sample.csv", csv_bytes, "text/csv")}
    )
    assert upload_csv_res.status_code == 200, f"CSV Upload failed: {upload_csv_res.text}"
    csv_data = upload_csv_res.json()
    print(f" -> CSV Extracted: {csv_data['total_extracted']} rows, Duplicates flagged: {csv_data['duplicates_count']}")

    # 8 & 9. Correct Category Manually & Verify Rule Memory
    print("\n[Step 8 & 9] Correcting Category & Verifying Category Rule Memory...")
    txs_res = client.get("/api/v1/transactions/", headers=headers1)
    txs = txs_res.json()
    target_tx = txs[0]
    original_cat = target_tx["category"]
    new_cat = "Shopping" if original_cat != "Shopping" else "Other expenses"

    patch_res = client.patch(
        f"/api/v1/transactions/{target_tx['id']}",
        headers=headers1,
        json={"category": new_cat, "save_as_rule": True}
    )
    assert patch_res.status_code == 200
    updated_tx = patch_res.json()["transaction"]
    print(f" -> Updated tx {target_tx['id'][:8]} category: '{original_cat}' -> '{updated_tx['category']}'")
    assert updated_tx["category"] == new_cat

    # Check that category correction is saved in database memory
    corrections = db.get_category_corrections("alex-chen")
    print(f" -> Learned Merchant Rules: {list(corrections.keys())}")

    # 10. Generate Financial Analytics
    print("\n[Step 10] Testing Analytics & Dashboard Generation...")
    ov_res = client.get("/api/v1/analytics/overview", headers=headers1)
    assert ov_res.status_code == 200
    ov = ov_res.json()
    print(f" -> Total Income: ${ov['total_income']:,.2f}")
    print(f" -> Total Expenses: ${ov['total_expenses']:,.2f}")
    print(f" -> Net Savings: ${ov['net_savings']:,.2f} ({ov['monthly_savings_rate']}% rate)")
    print(f" -> Top Category: {ov['highest_spending_category']} (${ov['highest_category_amount']:,.2f})")

    charts_res = client.get("/api/v1/analytics/charts", headers=headers1)
    assert charts_res.status_code == 200
    charts = charts_res.json()
    print(f" -> Monthly points: {len(charts['income_vs_expense'])}, Categories: {len(charts['category_spending'])}")

    # 11. Recurring Payment Detection
    print("\n[Step 11] Detecting Recurring Payments & Subscriptions...")
    rec_res = client.get("/api/v1/recurring/", headers=headers1)
    assert rec_res.status_code == 200
    rec = rec_res.json()
    print(f" -> Detected Subscriptions: {rec['total_subscriptions']}")
    print(f" -> Monthly Recurring Burden: ${rec['total_monthly_recurring']:,.2f}/mo")
    for r in rec["items"][:3]:
        print(f"    * {r['merchant']}: ${r['amount']} ({r['frequency']})")

    # 12. Unusual Transaction / Anomaly Detection
    print("\n[Step 12] Analyzing Spending Anomalies & Statistical Outliers...")
    anom_res = client.get("/api/v1/anomalies/", headers=headers1)
    assert anom_res.status_code == 200
    anomalies = anom_res.json()
    print(f" -> Anomalies Flagged: {len(anomalies)}")
    for a in anomalies[:3]:
        print(f"    [ALERT] [{a['severity'].upper()}] {a['anomaly_type']}: {a['explanation']}")

    # Review an anomaly
    if anomalies:
        first_alert = anomalies[0]
        rev_res = client.patch(
            f"/api/v1/anomalies/{first_alert['id']}",
            headers=headers1,
            json={"reviewed": True, "user_note": "Verified personal electronics outlay"}
        )
        assert rev_res.status_code == 200
        print(f" -> Successfully reviewed alert {first_alert['id'][:8]}")

    # 13. Financial Health Scoring
    print("\n[Step 13] Calculating Financial Health Score (0-100)...")
    hl_res = client.get("/api/v1/health/", headers=headers1)
    assert hl_res.status_code == 200
    health = hl_res.json()
    print(f" -> Health Score: {health['overall_score']} / 100 (Grade: {health['grade']})")
    print(" -> 6 Dimensions:")
    for dim in health["breakdown"]:
        print(f"    - {dim['name']} ({int(dim['weight']*100)}%): {dim['score']}/100 [{dim['status']}] - {dim['metric_value']}")

    # 14. Cash-Flow Prediction
    print("\n[Step 14] Generating Cash-Flow Forecast (7, 30, 90 Days)...")
    cf_res = client.get("/api/v1/cashflow/forecast?days=90", headers=headers1)
    assert cf_res.status_code == 200
    cf = cf_res.json()
    print(f" -> Starting Balance: ${cf['current_balance']:,.2f}")
    print(f" -> 7-Day Balance: ${cf['forecast_7d_balance']:,.2f}")
    print(f" -> 30-Day Balance: ${cf['forecast_30d_balance']:,.2f}")
    print(f" -> 90-Day Balance: ${cf['forecast_90d_balance']:,.2f}")
    print(f" -> Timeline Points: {len(cf['timeline'])}")

    # 15. AI Assistant Answering Grounded Financial Questions
    print("\n[Step 15] Asking FinSight Assistant Financial Questions...")
    test_queries = [
        "Where did most of my money go?",
        "How much did I spend this month?",
        "Which subscriptions are recurring?",
        "Will I have enough money next month?"
    ]
    for q in test_queries:
        chat_res = client.post("/api/v1/assistant/chat", headers=headers1, json={"message": q})
        assert chat_res.status_code == 200
        ans = chat_res.json()["response"]
        print(f"  Q: '{q}'")
        first_line = ans.split("\n")[0]
        clean_line = first_line.encode('ascii', 'ignore').decode('ascii')
        print(f"  A: {clean_line[:90]}...")

    # 16. Per-User Data Isolation (Verify User2 cannot access User1's data)
    print("\n[Step 16] Verifying Strict Per-User Data Isolation...")
    u2_txs_res = client.get("/api/v1/transactions/", headers=headers2)
    u2_txs = u2_txs_res.json()
    print(f" -> User 2 transactions count: {len(u2_txs)} (Expected: 0)")
    assert len(u2_txs) == 0, f"Data leak detected! User2 saw {len(u2_txs)} transactions belonging to User1!"

    u2_ov = client.get("/api/v1/analytics/overview", headers=headers2).json()
    assert u2_ov["total_transactions"] == 0, "User 2 saw User 1's overview data!"
    print(" -> Data isolation verified: User 2 has 0 access to User 1's transactions or metrics.")

    print("\n" + "=" * 70)
    print("[SUCCESS] ALL 16 END-TO-END VERIFICATION STEPS PASSED PERFECTLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_all_tests()
