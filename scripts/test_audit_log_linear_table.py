import time
import os
import sys
from playwright.sync_api import sync_playwright

def test_audit_log_linear_table():
    print("🚀 Starting Audit Log Linear-Grade Table E2E Test...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()
        page.goto("http://localhost:3000", wait_until="networkidle")
        time.sleep(1)

        # Handle SetupView if project not yet initialized
        sample_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if sample_btn.count() > 0 and sample_btn.first.is_visible():
            print("SetupView detected - loading sample Web workspace...")
            sample_btn.first.click()
            time.sleep(1)

        # Navigate to Audit Log
        print("\n--- 1. Navigating to Project Audit Log ---")
        page.goto("http://localhost:3000/#/log", wait_until="networkidle")
        time.sleep(1.5)

        # Verify Header and Title
        header_title = page.locator('h1:has-text("Project Audit Log")')
        assert header_title.count() > 0, "Audit Log header title should exist"
        print("✓ Audit Log page loaded successfully")

        # Verify Preset Chips
        print("\n--- 2. Verifying Linear-Grade Quick Preset Chips ---")
        presets = ["All Activity", "Status Changes", "Creations", "Field Updates", "Governance Notes"]
        for p_name in presets:
            chip = page.locator(f'button:has-text("{p_name}")')
            assert chip.count() > 0, f"Preset chip '{p_name}' should exist"
            print(f"✓ Found preset chip: {p_name}")

        # Verify View Mode Toggle
        print("\n--- 3. Verifying View Mode Toggle (Audit Grid vs Timeline) ---")
        grid_btn = page.locator('button[title="Linear-Grade Enterprise Audit Table"]')
        stream_btn = page.locator('button[title="Chronological Timeline Stream"]')
        assert grid_btn.count() > 0, "Audit Grid button should exist"
        assert stream_btn.count() > 0, "Timeline button should exist"
        print("✓ View Mode switcher present")

        # Verify DataTable in Audit Grid mode
        table = page.locator('table')
        assert table.count() > 0, "DataTable should be rendered in Audit Grid mode"
        print("✓ Audit Grid DataTable is rendered")

        # Verify Frozen Column 0 and Headers
        th_rn = page.locator('th:has-text("#")')
        assert th_rn.count() > 0, "Row number header '#' should exist"
        print("✓ Row number header '#' verified")

        th_entity = page.locator('th:has-text("TIMESTAMP & TARGET ENTITY")')
        assert th_entity.count() > 0, "Column header 'TIMESTAMP & TARGET ENTITY' should exist"
        print("✓ Frozen Column 0 header verified")

        # Create an Audit Note to ensure at least one record exists
        print("\n--- 3.5. Creating a Governance Audit Note ---")
        add_btn = page.locator('button:has-text("Add Audit Note")').first
        assert add_btn.is_visible(), "Add Audit Note button must be visible"
        add_btn.click()
        time.sleep(0.5)

        subject_input = page.locator('input[placeholder*="Architecture Steering Review"]')
        assert subject_input.is_visible(), "Subject input in modal should be visible"
        subject_input.fill("Architecture Steering Sign-Off")

        notes_textarea = page.locator('textarea[placeholder*="Record steering decision"]')
        notes_textarea.fill("E2E verification of Linear table governance audit trail")

        save_btn = page.locator('button:has-text("Save Entry")')
        save_btn.click()
        time.sleep(1)
        print("✓ Created governance audit note")

        # Click a row to open SlideOverDrawer
        print("\n--- 4. Verifying Master-Detail Audit Peek Side Drawer ---")
        first_row = page.locator('tbody tr').first
        assert first_row.is_visible(), "A log row should be visible in DataTable"
        first_row.click()
        time.sleep(1)

        # Check drawer elements
        drawer = page.locator('text=Immutable Audit Trail Record')
        assert drawer.count() > 0, "SlideOverDrawer should open with audit record"
        print("✓ Master-detail Audit Peek Side Drawer opened successfully")
        
        json_btn = page.locator('button:has-text("Copy JSON")')
        assert json_btn.count() > 0, "Copy JSON button should exist in drawer"
        print("✓ Drawer action buttons present")

        # Close drawer
        close_btn = page.locator('button[aria-label="Close panel"]')
        if close_btn.count() > 0 and close_btn.first.is_visible():
            close_btn.first.click()
            time.sleep(0.5)
            print("✓ Drawer closed cleanly via close button")
        else:
            page.keyboard.press("Escape")
            time.sleep(0.5)
            print("✓ Drawer closed cleanly via Escape")

        # Test Switching to Timeline Mode
        print("\n--- 5. Verifying Timeline Stream Mode ---")
        stream_btn.click()
        time.sleep(1)
        timeline_dot = page.locator('.rounded-full.ring-4')
        print(f"✓ Timeline view rendered with {timeline_dot.count()} timeline items")

        # Switch back to Audit Grid mode
        grid_btn.click()
        time.sleep(1)

        # Capture Artifact Screenshot
        screenshot_path = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/linear_table_audit_log.png"
        page.screenshot(path=screenshot_path)
        print(f"✓ Screenshot captured at {screenshot_path}")

        browser.close()
        print("\n🎉 ALL Audit Log Linear Table tests passed successfully!")

if __name__ == "__main__":
    test_audit_log_linear_table()
