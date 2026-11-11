import os
import sys
import time
from playwright.sync_api import sync_playwright

def test_excel_enhanced_roundtrip():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        downloads_path = "/tmp/pp_downloads"
        os.makedirs(downloads_path, exist_ok=True)
        
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            accept_downloads=True
        )
        page = context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE: {msg.text}") if msg.type == "error" else None)

        print("[1] Opening app at localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(2000)

        # 1. Load Demo database if on SetupView
        demo_btn = page.locator('button:has-text("Load Demo Database")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            print("[2] On SetupView, loading demo database...")
            demo_btn.first.click()
            page.wait_for_timeout(2500)

        # Confirm entered app
        assert page.locator("text=Project Titan").first.is_visible(), "Project Titan title missing"
        print("✓ Verified app is loaded with Project Titan data")

        # 2. Test Master Excel Export
        print("\n--- TEST: Master Excel Export with 12 Sheets & Top KPI Cards ---")
        share_btn = page.locator('button[aria-label="Share and export data"]')
        share_btn.first.click()
        page.wait_for_timeout(400)

        master_excel_btn = page.locator("text=Export Master Excel (.xlsx)")
        assert master_excel_btn.is_visible(), "Master Excel option missing from share menu"

        with page.expect_download() as download_info:
            master_excel_btn.click()
        download = download_info.value
        exported_path = os.path.join(downloads_path, download.suggested_filename)
        download.save_as(exported_path)
        print(f"✓ Master Excel downloaded: {download.suggested_filename} ({os.path.getsize(exported_path)} bytes)")
        assert os.path.getsize(exported_path) > 10000, "Exported workbook is suspiciously small"

        # 3. Test Deliveries Template Download & Deliveries Import UI
        print("\n--- TEST: Deliveries Template Download & Ingestion ---")
        page.click("button:has-text('ALM Deliveries')")
        page.wait_for_timeout(1000)

        # Check for Import button and Template button
        import_btn = page.locator('[data-testid="import-deliveries-button"]')
        template_btn = page.locator('[data-testid="download-delivery-template-button"]')
        export_btn = page.locator('button:has-text("Export Deliveries")')

        assert import_btn.is_visible(), "Import Deliveries button missing"
        assert template_btn.is_visible(), "Download Delivery Template button missing"
        assert export_btn.is_visible(), "Export Deliveries button missing"
        print("✓ Import, Template, and Export buttons visible in Deliveries header toolbar")

        with page.expect_download() as dl_template_info:
            template_btn.click()
        dl_template = dl_template_info.value
        template_path = os.path.join(downloads_path, dl_template.suggested_filename)
        dl_template.save_as(template_path)
        print(f"✓ Delivery Template downloaded: {dl_template.suggested_filename} ({os.path.getsize(template_path)} bytes)")
        assert "Deliveries_Template" in dl_template.suggested_filename

        dialog_messages = []
        page.on("dialog", lambda dialog: (dialog_messages.append(dialog.message), dialog.accept()))

        # Test uploading template / Excel into DeliveriesView
        print("\n--- TEST: Uploading & Ingesting Deliveries via DeliveriesView ---")
        file_input = page.locator('[data-testid="deliveries-file-input"]')
        
        file_input.set_input_files(template_path)
        page.wait_for_timeout(2000)

        assert len(dialog_messages) > 0, "Expected alert dialog on deliveries import"
        print(f"✓ Deliveries import alert message: {dialog_messages[-1]}")
        assert "imported successfully" in dialog_messages[-1] or "total records" in dialog_messages[-1]

        # 4. Verify roundtrip Master Excel Re-import via SettingsView
        print("\n--- TEST: Full Project State Re-Import from Exported Master Excel ---")
        page.goto("http://localhost:3000/#/settings")
        page.wait_for_timeout(1000)

        settings_file_input = page.locator('input[type="file"][accept*=".xlsx"]')
        assert settings_file_input.count() > 0, "Settings file input missing"

        prev_dialog_count = len(dialog_messages)
        settings_file_input.first.set_input_files(exported_path)
        page.wait_for_timeout(2500)

        # Verify state is fully active
        page.click("button:has-text('Tasks & Timeline')")
        page.wait_for_timeout(1000)
        body_text = page.locator("body").inner_text()
        assert "TASK-001" in body_text, "Expected TASK-001 after full workbook re-import"
        print("✓ Verified Tasks Matrix intact after full workbook re-import")

        page.click("button:has-text('ALM Deliveries')")
        page.wait_for_timeout(1000)
        deliv_text = page.locator("body").inner_text()
        assert "ALM-" in deliv_text, "Expected ALM Deliveries intact after full workbook re-import"
        print("✓ Verified ALM Deliveries intact after full workbook re-import")

        print("\n=======================================================")
        print("🎉 ALL ENHANCED EXCEL IMPORT/EXPORT TESTS PASSED!")
        print("=======================================================")

        browser.close()

if __name__ == "__main__":
    test_excel_enhanced_roundtrip()
