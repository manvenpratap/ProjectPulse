import sys
from playwright.sync_api import sync_playwright

def test_share_and_export_features():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900}, accept_downloads=True)
        context.grant_permissions(["clipboard-read", "clipboard-write"])
        page = context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE ERROR: {msg.text}") if msg.type == "error" else None)

        print("[1] Loading ProjectPulse at localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(2000)

        # Load demo database if empty
        demo_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            demo_btn.first.click()
            page.wait_for_timeout(1500)

        # -------------------------------------------------------------
        # TEST 1: Global Share & Export Dropdown in PageHeader
        # -------------------------------------------------------------
        print("\n--- TEST 1: Global Share & Export Dropdown in PageHeader ---")
        share_btn = page.locator('button[aria-label="Share and export data"]')
        assert share_btn.count() > 0, "Share & Export button missing in PageHeader"
        share_btn.first.click()
        page.wait_for_timeout(400)

        # Verify dropdown menu items
        assert page.locator("text=Export & Distribution").is_visible(), "Export menu header not visible"
        assert page.locator("text=Steering Email Brief (CXO)").is_visible(), "CXO email brief option missing"
        assert page.locator("text=Copy View Summary").is_visible(), "Copy View Summary option missing"
        assert page.locator("text=Standalone Interactive HTML").is_visible(), "Standalone HTML option missing"
        assert page.locator("text=Print / Save as PDF").is_visible(), "Print option missing"
        assert page.locator("text=Share via Email Draft").is_visible(), "Email draft option missing"
        assert page.locator("text=Export Master Excel (.xlsx)").is_visible(), "Master Excel option missing"
        print("✓ Global Share & Export menu opened with all share & workbook export options")

        # -------------------------------------------------------------
        # TEST 2: Trigger CXO Email Brief from Share Menu
        # -------------------------------------------------------------
        print("\n--- TEST 2: Executive CXO Email Brief from Share Menu ---")
        cxo_item = page.locator("text=Steering Email Brief (CXO)")
        cxo_item.click()
        page.wait_for_timeout(600)

        assert page.locator("text=Audience Persona").is_visible() or page.locator("text=Executive CXO Steering Email Brief").is_visible(), "Executive CXO Email Brief did not open from Share menu"
        print("✓ Executive CXO Email Brief opened successfully from Share menu")

        # Navigate back to Tasks Matrix to continue test suite
        page.goto("http://localhost:3000/#/tasks")
        page.wait_for_timeout(600)

        # -------------------------------------------------------------
        # TEST 3: Copy View Summary Table to Clipboard
        # -------------------------------------------------------------
        print("\n--- TEST 3: Copy View Summary Table ---")
        share_btn.first.click()
        page.wait_for_timeout(300)
        copy_btn = page.locator("text=Copy View Summary")
        copy_btn.click()
        page.wait_for_timeout(500)
        assert page.locator("text=Copied!").is_visible(), "Copied feedback banner not shown"
        print("✓ Copy View Summary copies formatted markdown and displays feedback")

        # Close menu if still open
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)

        # -------------------------------------------------------------
        # TEST 4: Standalone Interactive HTML Export Download
        # -------------------------------------------------------------
        print("\n--- TEST 4: Standalone Interactive HTML Report Download ---")
        share_btn.first.click()
        page.wait_for_timeout(300)
        html_item = page.locator("text=Standalone Interactive HTML")

        with page.expect_download() as download_info:
            html_item.click()
        download = download_info.value
        filename = download.suggested_filename
        print(f"✓ Downloaded interactive HTML file: {filename}")
        assert filename.endswith(".html"), f"Expected .html extension, got {filename}"

        # -------------------------------------------------------------
        # TEST 5: CSV and JSON Exports Download
        # -------------------------------------------------------------
        print("\n--- TEST 5: CSV and JSON Data Exports Download ---")
        # CSV Export
        share_btn.first.click()
        page.wait_for_timeout(300)
        csv_item = page.locator("button:has-text('CSV (.csv)')")
        with page.expect_download() as download_info:
            csv_item.click()
        csv_download = download_info.value
        assert csv_download.suggested_filename.endswith(".csv"), f"Expected .csv, got {csv_download.suggested_filename}"
        print(f"✓ Downloaded CSV export: {csv_download.suggested_filename}")

        # JSON Export
        share_btn.first.click()
        page.wait_for_timeout(300)
        json_item = page.locator("button:has-text('JSON (.json)')").first
        with page.expect_download() as download_info:
            json_item.click()
        json_download = download_info.value
        assert json_download.suggested_filename.endswith(".json"), f"Expected .json, got {json_download.suggested_filename}"
        print(f"✓ Downloaded JSON export: {json_download.suggested_filename}")

        # -------------------------------------------------------------
        # TEST 6: Verify NO Separate Export Buttons on Any Screen
        # (Consolidated exclusively into Share & Export dropdown)
        # -------------------------------------------------------------
        print("\n--- TEST 6: Verify Absence of Separate Export Buttons Across Screens ---")

        # 6a. Tasks View
        print("Checking Tasks & Timeline...")
        page.goto("http://localhost:3000/#/tasks")
        page.wait_for_timeout(600)
        task_export_btn = page.locator('button:has-text("Export Tasks")')
        assert not task_export_btn.is_visible(), "Separate 'Export Tasks' button must NOT be present!"
        assert page.locator('button[aria-label="Share and export data"]').is_visible(), "Share & Export must be visible on Tasks"
        print("✓ Tasks View has no separate export button; uses unified Share & Export")

        # 6b. Defect Matrix View
        print("Checking Defect Workshop...")
        page.goto("http://localhost:3000/#/defects")
        page.wait_for_timeout(600)
        defect_export_btn = page.locator('button:has-text("Export Defects")')
        assert not defect_export_btn.is_visible(), "Separate 'Export Defects' button must NOT be present!"
        assert page.locator('button[aria-label="Share and export data"]').is_visible(), "Share & Export must be visible on Defects"
        print("✓ Defect Workshop has no separate export button; uses unified Share & Export")

        # 6c. Functional Matrix / Features View
        print("Checking Functional Matrix...")
        page.goto("http://localhost:3000/#/features")
        page.wait_for_timeout(600)
        matrix_export_btn = page.locator('button:has-text("Export Matrix")')
        assert not matrix_export_btn.is_visible(), "Separate 'Export Matrix' button must NOT be present!"
        assert page.locator('button[aria-label="Share and export data"]').is_visible(), "Share & Export must be visible on Features"
        print("✓ Functional Matrix has no separate export button; uses unified Share & Export")

        # 6d. RAID Register
        print("Checking RAID Register...")
        page.goto("http://localhost:3000/#/risks")
        page.wait_for_timeout(600)
        raid_export_btn = page.locator('button:has-text("Export RAID")')
        assert not raid_export_btn.is_visible(), "Separate 'Export RAID' button must NOT be present!"
        assert page.locator('button[aria-label="Share and export data"]').is_visible(), "Share & Export must be visible on RAID"
        print("✓ RAID Register has no separate export button; uses unified Share & Export")

        # 6e. Team Hub
        print("Checking Team Hub...")
        page.goto("http://localhost:3000/#/team")
        page.wait_for_timeout(600)
        team_export_btn = page.locator('button:has-text("Export Team")')
        assert not team_export_btn.is_visible(), "Separate 'Export Team' button must NOT be present!"
        assert page.locator('button[aria-label="Share and export data"]').is_visible(), "Share & Export must be visible on Team"
        print("✓ Team Hub has no separate export button; uses unified Share & Export")

        # 6f. Deliveries View
        print("Checking ALM Deliveries...")
        page.goto("http://localhost:3000/#/deliveries")
        page.wait_for_timeout(600)
        deliv_export_btn = page.locator('button:has-text("Export Deliveries")')
        assert not deliv_export_btn.is_visible(), "Separate 'Export Deliveries' button must NOT be present!"
        deliv_tpl_btn = page.locator('button[data-testid="download-delivery-template-button"]')
        assert not deliv_tpl_btn.is_visible(), "Separate 'Template' download button must NOT be present on Deliveries screen!"
        assert page.locator('button[aria-label="Share and export data"]').is_visible(), "Share & Export must be visible on Deliveries"
        print("✓ Deliveries View has no separate export button or template button; uses unified Share & Export")

        # 6g. Executive Overview
        print("Checking Executive Overview...")
        page.goto("http://localhost:3000/#/overview")
        page.wait_for_timeout(600)
        overview_export_btn = page.locator('button[aria-label="Export project report to Excel"]')
        assert not overview_export_btn.is_visible(), "Separate 'Export Excel' button must NOT be present on Overview!"
        print("✓ Executive Overview has no separate export button; uses unified Share & Export")

        # 6h. Pulse Reports
        print("Checking Pulse Reports...")
        page.goto("http://localhost:3000/#/reports")
        page.wait_for_timeout(600)
        report_export_btn = page.locator('button:has-text("Export Excel Pack")')
        assert not report_export_btn.is_visible(), "Separate 'Export Excel Pack' button must NOT be present on Reports!"
        print("✓ Pulse Reports has no separate export button; uses unified Share & Export")

        # 6i. Option Libraries
        print("Checking Option Libraries...")
        page.goto("http://localhost:3000/#/dropdowns")
        page.wait_for_timeout(600)
        reg_export_btn = page.locator('button:has-text("Export JSON")')
        assert not reg_export_btn.is_visible(), "Separate 'Export JSON' button must NOT be present on Option Libraries!"
        assert page.locator('button[aria-label="Share and export data"]').is_visible(), "Share & Export must be visible on Option Libraries"
        print("✓ Option Libraries has no separate export button; uses unified Share & Export")

        # 6j. Step Blueprints
        print("Checking Step Blueprints...")
        page.goto("http://localhost:3000/#/steps")
        page.wait_for_timeout(600)
        # Ensure only the Share & Export button in header has the word export
        assert page.locator('header button:has-text("Export")').count() == 1, "Separate 'Export' button must NOT be present on Step Blueprints!"
        assert page.locator('button[aria-label="Share and export data"]').is_visible(), "Share & Export must be visible on Step Blueprints"
        print("✓ Step Blueprints has no separate export button; uses unified Share & Export")

        # -------------------------------------------------------------
        # TEST 7: Test Comprehensive Export Options Inside Share & Export
        # -------------------------------------------------------------
        print("\n--- TEST 7: Context-Specific & Comprehensive Options in Share & Export ---")
        
        # 7a. Test on Deliveries view: Delivery Template option & Deliveries Excel
        page.goto("http://localhost:3000/#/deliveries")
        page.wait_for_timeout(600)
        share_btn_del = page.locator('button[aria-label="Share and export data"]').first
        share_btn_del.click()
        page.wait_for_timeout(400)

        assert page.locator("text=Export Deliveries (.xlsx)").is_visible(), "Export Deliveries (.xlsx) missing"
        assert page.locator("text=Download Delivery Template (.xlsx)").is_visible(), "Download Delivery Template (.xlsx) missing"
        assert page.locator("text=Export Master Excel (.xlsx)").is_visible(), "Export Master Excel (.xlsx) missing"
        assert page.locator("text=Export Full Project JSON (.json)").is_visible(), "Export Full Project JSON (.json) missing"

        # Download Delivery Template from Share & Export
        with page.expect_download() as download_info:
            page.locator("text=Download Delivery Template (.xlsx)").click()
        tpl_download = download_info.value
        assert tpl_download.suggested_filename.endswith(".xlsx"), "Template must be .xlsx"
        print(f"✓ Downloaded delivery template via Share & Export: {tpl_download.suggested_filename}")

        # 7b. Test on Functional Matrix / Features view: Feature Matrix Workbook
        page.goto("http://localhost:3000/#/features")
        page.wait_for_timeout(600)
        share_btn_feat = page.locator('button[aria-label="Share and export data"]').first
        share_btn_feat.click()
        page.wait_for_timeout(400)

        assert page.locator("text=Export Features (.xlsx)").is_visible(), "Export Features (.xlsx) missing"
        assert page.locator("text=Export Feature Matrix (.xlsx)").is_visible(), "Export Feature Matrix (.xlsx) missing"
        assert page.locator("text=Export Full Project JSON (.json)").is_visible(), "Export Full Project JSON (.json) missing"

        # 7c. Test on Option Libraries view: Dedicated Option Libraries JSON Export
        page.goto("http://localhost:3000/#/dropdowns")
        page.wait_for_timeout(600)
        share_btn_reg = page.locator('button[aria-label="Share and export data"]').first
        share_btn_reg.click()
        page.wait_for_timeout(400)

        assert page.locator("text=Export Option Libraries JSON (.json)").is_visible(), "Export Option Libraries JSON (.json) option missing in Share & Export"
        with page.expect_download() as download_info:
            page.locator("text=Export Option Libraries JSON (.json)").click()
        reg_json_download = download_info.value
        assert reg_json_download.suggested_filename.endswith(".json"), "Exported Option Libraries file must be .json"
        print(f"✓ Downloaded Option Libraries JSON via unified Share & Export: {reg_json_download.suggested_filename}")

        # Download Full Project JSON Backup
        share_btn_reg.click()
        page.wait_for_timeout(300)
        with page.expect_download() as download_info:
            page.locator("text=Export Full Project JSON (.json)").click()
        json_backup = download_info.value
        assert json_backup.suggested_filename.endswith(".json"), "Backup must be .json"
        print(f"✓ Downloaded full project JSON backup via Share & Export: {json_backup.suggested_filename}")

        # Check console / page errors
        critical_errors = [e for e in errors if "favicon" not in e.lower() and "font" not in e.lower()]
        assert len(critical_errors) == 0, f"Critical browser errors encountered: {critical_errors}"

        print("\n=======================================================")
        print("🎉 ALL SHARE AND EXPORT PARITY TESTS PASSED SUCCESSFULLY!")
        print("=======================================================")
        browser.close()

if __name__ == "__main__":
    test_share_and_export_features()
