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
        # TEST 2: Trigger CXO Email Brief Modal from Share Menu
        # -------------------------------------------------------------
        print("\n--- TEST 2: Executive CXO Email Brief Modal from Share Menu ---")
        cxo_item = page.locator("text=Steering Email Brief (CXO)")
        cxo_item.click()
        page.wait_for_timeout(600)

        cxo_modal = page.locator("text=Executive CXO Steering Email Brief")
        assert cxo_modal.is_visible(), "Executive CXO Email Brief modal did not open from Share menu"
        print("✓ Executive CXO Email Brief modal opened successfully from Share menu")

        # Close CXO Modal
        close_btn = page.locator('button:has-text("Close"), button[aria-label="Close modal"]')
        if close_btn.count() > 0:
            close_btn.first.click()
            page.wait_for_timeout(400)

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
        json_item = page.locator("button:has-text('JSON (.json)')")
        with page.expect_download() as download_info:
            json_item.click()
        json_download = download_info.value
        assert json_download.suggested_filename.endswith(".json"), f"Expected .json, got {json_download.suggested_filename}"
        print(f"✓ Downloaded JSON export: {json_download.suggested_filename}")

        # -------------------------------------------------------------
        # TEST 6: View-Level Export Buttons in Specific Views
        # -------------------------------------------------------------
        print("\n--- TEST 6: View-Level Export Buttons in Specific Screens ---")

        # 6a. Tasks View
        print("Navigating to Tasks Matrix...")
        page.locator('button:has-text("Tasks Matrix")').first.click()
        page.wait_for_timeout(1000)
        task_export_btn = page.locator('button:has-text("Export Tasks")')
        assert task_export_btn.is_visible(), "Export Tasks button not found in Tasks View"
        print("✓ Tasks View has dedicated 'Export Tasks' action button")

        # 6b. Defect Matrix View
        print("Navigating to Defect Workshop...")
        page.locator('button:has-text("Defect Workshop")').first.click()
        page.wait_for_timeout(1000)
        defect_export_btn = page.locator('button:has-text("Export Defects")')
        assert defect_export_btn.is_visible(), "Export Defects button not found in Defect View"
        print("✓ Defect Workshop has dedicated 'Export Defects' action button")

        # 6c. Functional Matrix / Features View
        print("Navigating to Functional Matrix...")
        page.locator('button:has-text("Functional Matrix")').first.click()
        page.wait_for_timeout(1000)
        matrix_export_btn = page.locator('button:has-text("Export Matrix")')
        assert matrix_export_btn.is_visible(), "Export Matrix button not found in Functional Matrix View"
        print("✓ Functional Matrix has dedicated 'Export Matrix' action button")

        # 6d. RAID Register
        print("Navigating to RAID Register...")
        page.locator('button:has-text("RAID Register")').first.click()
        page.wait_for_timeout(1000)
        raid_export_btn = page.locator('button:has-text("Export RAID")')
        assert raid_export_btn.is_visible(), "Export RAID button not found in RAID View"
        print("✓ RAID Register has dedicated 'Export RAID' action button")

        # 6e. Team Hub
        print("Navigating to Team Hub...")
        page.locator('button:has-text("Team Hub")').first.click()
        page.wait_for_timeout(1000)
        team_export_btn = page.locator('button:has-text("Export Team")')
        assert team_export_btn.is_visible(), "Export Team button not found in Team Hub View"
        print("✓ Team Hub has dedicated 'Export Team' action button")

        # 6f. Deliveries View
        print("Navigating to ALM Deliveries...")
        page.locator('button:has-text("ALM Deliveries")').first.click()
        page.wait_for_timeout(1000)
        deliv_export_btn = page.locator('button:has-text("Export Deliveries")')
        assert deliv_export_btn.is_visible(), "Export Deliveries button not found in Deliveries View"
        print("✓ Deliveries View has dedicated 'Export Deliveries' action button")

        # -------------------------------------------------------------
        # TEST 7: View-Level Split Dropdown & Excel Download
        # -------------------------------------------------------------
        print("\n--- TEST 7: View-Level Split Dropdown & Direct Excel Download ---")
        # Click more options on Deliveries export button
        more_btn = page.locator('button[aria-label="More export options for Export Deliveries"]')
        assert more_btn.is_visible(), "More export options toggle missing on Deliveries button"
        more_btn.click()
        page.wait_for_timeout(300)
        assert page.locator("text=Excel Sheet (.xlsx)").is_visible(), "Excel sheet option missing in split menu"
        assert page.locator("text=CSV File (.csv)").is_visible(), "CSV option missing in split menu"
        assert page.locator("text=Copy Summary Table").is_visible(), "Copy Summary option missing in split menu"

        # Trigger direct Excel download from view button
        with page.expect_download() as download_info:
            page.locator("text=Excel Sheet (.xlsx)").click()
        deliv_xlsx = download_info.value
        assert deliv_xlsx.suggested_filename.endswith(".xlsx"), f"Expected .xlsx, got {deliv_xlsx.suggested_filename}"
        print(f"✓ View-level split button downloaded styled view Excel: {deliv_xlsx.suggested_filename}")

        # Check console / page errors
        critical_errors = [e for e in errors if "favicon" not in e.lower() and "font" not in e.lower()]
        assert len(critical_errors) == 0, f"Critical browser errors encountered: {critical_errors}"

        print("\n=======================================================")
        print("🎉 ALL SHARE AND EXPORT PARITY TESTS PASSED SUCCESSFULLY!")
        print("=======================================================")
        browser.close()

if __name__ == "__main__":
    test_share_and_export_features()
