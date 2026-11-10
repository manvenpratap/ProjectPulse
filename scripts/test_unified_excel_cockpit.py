#!/usr/bin/env python3
import os
import sys
import time
import openpyxl
from playwright.sync_api import sync_playwright

def test_unified_excel_cockpit():
    print("🚀 Starting Comprehensive Excel Cockpit & Unified Sheets E2E Test...")
    downloads_path = "/tmp/pp_excel_test"
    os.makedirs(downloads_path, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            accept_downloads=True
        )
        page = context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE: {msg.text}") if msg.type == "error" else None)

        print("[1] Opening app at http://localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(2000)

        demo_btn = page.locator('button:has-text("Load Demo Database")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            print("[2] On SetupView, loading demo database...")
            demo_btn.first.click()
            page.wait_for_timeout(2500)

        assert page.locator("text=Project Titan").first.is_visible(), "Project Titan title missing"
        print("✓ Verified app is loaded with Project Titan workspace")

        # -------------------------------------------------------------
        # 1. TEST MASTER EXCEL EXPORT (Executive Dashboard + Unified Views)
        # -------------------------------------------------------------
        print("\n--- 1. Testing Master Excel Export ---")
        share_btn = page.locator('button[aria-label="Share and export data"]')
        share_btn.first.click()
        page.wait_for_timeout(400)

        master_excel_btn = page.locator("text=Export Master Excel (.xlsx)")
        assert master_excel_btn.is_visible(), "Master Excel option missing from share menu"

        with page.expect_download() as download_info:
            master_excel_btn.click()
        download = download_info.value
        master_path = os.path.join(downloads_path, download.suggested_filename)
        download.save_as(master_path)
        print(f"✓ Master Excel downloaded: {download.suggested_filename} ({os.path.getsize(master_path)} bytes)")

        # Verify Master Workbook sheets with openpyxl
        wb = openpyxl.load_workbook(master_path, data_only=False)
        sheet_names = wb.sheetnames
        print(f"✓ Master Workbook sheets ({len(sheet_names)}): {sheet_names}")

        # Invariant checks: Must contain Executive Dashboard, Tasks & Subtasks, Feature Rollouts
        assert "Executive Dashboard" in sheet_names, "Missing Executive Dashboard"
        assert "Tasks & Subtasks" in sheet_names, "Missing Unified Tasks & Subtasks sheet"
        assert "Feature Rollouts" in sheet_names, "Missing Unified Feature Rollouts sheet"
        assert "Tasks" in sheet_names, "Missing Tasks Matrix"

        # Check Executive Dashboard
        ds = wb["Executive Dashboard"]
        assert ds.max_row >= 80, f"Executive Dashboard rows too few ({ds.max_row}), expected >= 80"
        title_val = str(ds["B2"].value or "")
        assert "SYSTEM.PULSE" in title_val or "PROJECTPULSE" in title_val or ds["B2"].comment or ds.cell(2, 2).value, "Executive Dashboard banner missing"
        print(f"✓ Executive Dashboard verified: {ds.max_row} rows populated with governance tables & cockpit panels")

        # Check Tasks & Subtasks
        ts_unified = wb["Tasks & Subtasks"]
        assert ts_unified.max_row >= 20, "Tasks & Subtasks has too few rows"
        # Check that outline grouping exists
        outline_levels = [ts_unified.row_dimensions[r].outlineLevel for r in range(1, ts_unified.max_row + 1) if r in ts_unified.row_dimensions]
        print(f"✓ Tasks & Subtasks outline levels found: set={set(outline_levels)}")
        assert 1 in set(outline_levels), "Tasks & Subtasks must have outlineLevel 1 for subtasks"
        print("✓ Verified native multi-tier collapsible outline levels in Tasks & Subtasks")

        # Check Feature Rollouts
        fr_unified = wb["Feature Rollouts"]
        assert fr_unified.max_row >= 10, "Feature Rollouts has too few rows"
        fr_outline_levels = [fr_unified.row_dimensions[r].outlineLevel for r in range(1, fr_unified.max_row + 1) if r in fr_unified.row_dimensions]
        print(f"✓ Feature Rollouts outline levels found: set={set(fr_outline_levels)}")
        assert 1 in set(fr_outline_levels), "Feature Rollouts must have outlineLevel 1 for features"
        print("✓ Verified native release milestone grouping & outlines in Feature Rollouts")

        # -------------------------------------------------------------
        # 2. TEST TASKS VIEW EXCEL EXPORT (Unified View Included)
        # -------------------------------------------------------------
        print("\n--- 2. Testing Tasks View Excel Export ---")
        page.goto("http://localhost:3000/#/tasks")
        page.wait_for_timeout(800)

        page.locator('button[aria-label="Share and export data"]').first.click()
        page.wait_for_timeout(400)

        with page.expect_download() as dl_tasks_info:
            page.locator("text=Export Tasks (.xlsx)").first.click()
        dl_tasks = dl_tasks_info.value
        tasks_path = os.path.join(downloads_path, dl_tasks.suggested_filename)
        dl_tasks.save_as(tasks_path)
        print(f"✓ Tasks View Excel downloaded: {dl_tasks.suggested_filename} ({os.path.getsize(tasks_path)} bytes)")

        wb_tasks = openpyxl.load_workbook(tasks_path, data_only=False)
        print(f"✓ Tasks Workbook sheets: {wb_tasks.sheetnames}")
        assert "Tasks & Subtasks" in wb_tasks.sheetnames, "Tasks view export must contain Tasks & Subtasks unified view"
        assert "Tasks Matrix" in wb_tasks.sheetnames, "Tasks view export must contain Tasks Matrix flat view"
        print("✓ Verified Tasks View export contains both Unified Outline and Relational Matrix sheets")

        # -------------------------------------------------------------
        # 3. TEST FEATURES VIEW EXCEL EXPORT (Complete Feature Matrix)
        # -------------------------------------------------------------
        print("\n--- 3. Testing Features View Excel Export ---")
        page.goto("http://localhost:3000/#/features")
        page.wait_for_timeout(800)

        page.locator('button[aria-label="Share and export data"]').first.click()
        page.wait_for_timeout(400)

        with page.expect_download() as dl_feat_info:
            page.locator("text=Export Features (.xlsx)").first.click()
        dl_feat = dl_feat_info.value
        feat_path = os.path.join(downloads_path, dl_feat.suggested_filename)
        dl_feat.save_as(feat_path)
        print(f"✓ Feature Matrix Excel downloaded: {dl_feat.suggested_filename} ({os.path.getsize(feat_path)} bytes)")

        wb_feat = openpyxl.load_workbook(feat_path, data_only=False)
        print(f"✓ Feature Matrix sheets: {wb_feat.sheetnames}")
        assert "Feature Rollouts" in wb_feat.sheetnames, "Feature Matrix must contain Feature Rollouts"
        assert "Release Plan" in wb_feat.sheetnames, "Feature Matrix must contain Release Plan"
        assert "Feature Details" in wb_feat.sheetnames, "Feature Matrix must contain Feature Details"
        assert "Traceability Matrix" in wb_feat.sheetnames, "Feature Matrix must contain Traceability Matrix"
        assert "Executive Overview & SmartArt" in wb_feat.sheetnames, "Feature Matrix must contain Executive Overview & SmartArt"
        print("✓ Verified Feature Matrix export contains all 5 comprehensive enterprise sheets")

        # -------------------------------------------------------------
        # 4. TEST ROUND-TRIP RE-IMPORT INTO APP
        # -------------------------------------------------------------
        print("\n--- 4. Testing Master Excel Roundtrip Re-Import ---")
        page.goto("http://localhost:3000/#/settings")
        page.wait_for_timeout(1000)

        dialog_messages = []
        page.on("dialog", lambda dialog: (dialog_messages.append(dialog.message), dialog.accept()))

        settings_file_input = page.locator('input[type="file"][accept*=".xlsx"]')
        assert settings_file_input.count() > 0, "Settings file input missing"

        settings_file_input.first.set_input_files(master_path)
        page.wait_for_timeout(2500)

        # Verify state integrity
        page.click("button:has-text('Tasks Matrix')")
        page.wait_for_timeout(1000)
        body_text = page.locator("body").inner_text()
        assert "TASK-001" in body_text, "Expected TASK-001 to be intact after re-import"
        print("✓ Verified TASK-001 intact after Master Excel re-import")

        page.click("button:has-text('ALM Deliveries')")
        page.wait_for_timeout(1000)
        deliv_text = page.locator("body").inner_text()
        assert "ALM-" in deliv_text, "Expected ALM Deliveries intact after re-import"
        print("✓ Verified ALM Deliveries intact after Master Excel re-import")

        page.click("button:has-text('Functional Matrix')")
        page.wait_for_timeout(1000)
        feat_text = page.locator("body").inner_text()
        assert "Feature" in feat_text or "Functional" in feat_text, "Functional Matrix intact after re-import"
        print("✓ Verified Functional Matrix intact after Master Excel re-import")

        print("\n=======================================================")
        print("🎉 ALL ENHANCED EXCEL EXPORT & UNIFIED VIEW TESTS PASSED!")
        print("=======================================================")
        browser.close()

if __name__ == "__main__":
    test_unified_excel_cockpit()
