#!/usr/bin/env python3
"""
Playwright test script to verify that on every screen:
The Primary Action Button is present on the top right.
"""

import sys
from playwright.sync_api import sync_playwright

SCREENS_TO_VERIFY = [
    {"view": "tasks", "hash": "#/tasks", "expected_btn": "New Task", "desc": "Project Tasks Matrix"},
    {"view": "defects", "hash": "#/defects", "expected_btn": "Log Defect", "desc": "Defect Workshop"},
    {"view": "deliveries", "hash": "#/deliveries", "expected_btn": "New Package", "desc": "ALM Deliveries"},
    {"view": "risks", "hash": "#/risks", "expected_btn": "Log RAID Item", "desc": "RAID Register"},
    {"view": "team", "hash": "#/team", "expected_btn": "Add Member", "desc": "Team Hub"},
    {"view": "capacity", "hash": "#/capacity", "expected_btn": "Balance Workload", "desc": "Resource Capacity"},
    {"view": "releases", "hash": "#/releases", "expected_btn": "Add Release Version", "desc": "Release Roadmap"},
    {"view": "retro", "hash": "#/retro", "expected_btn": "Add Retro Item", "desc": "Sprint Retrospective"},
    {"view": "steps", "hash": "#/steps", "expected_btn": "New Blueprint", "desc": "Step Blueprints"},
    {"view": "dropdowns", "hash": "#/dropdowns", "expected_btn": "Create Library", "desc": "Option Libraries"},
    {"view": "fields", "hash": "#/fields", "expected_btn": "Add Field", "desc": "Field Architect"},
    {"view": "features", "hash": "#/features", "expected_btn": "New Feature", "desc": "Functional Matrix"},
    {"view": "scaffolder", "hash": "#/scaffolder", "expected_btn": "Next Step", "desc": "Project Scaffolder"},
    {"view": "overview", "hash": "#/overview", "expected_btn": "Intelligence Cockpit", "desc": "Executive Overview"},
    {"view": "dash", "hash": "#/dash", "expected_btn": "Recompute Forecast", "desc": "Project Intelligence Cockpit"},
    {"view": "reports", "hash": "#/reports", "expected_btn": "Print Sheet", "desc": "Executive Reporting"},
    {"view": "log", "hash": "#/log", "expected_btn": "Add Audit Note", "desc": "Project Audit Log"},
    {"view": "settings", "hash": "#/settings", "expected_btn": "Create Snapshot", "desc": "System Settings"},
    {"view": "timeline", "hash": "#/timeline", "expected_btn": "New Task", "desc": "Project Timeline & Gantt"},
]

def test_top_right_primary_actions():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        print("[1] Loading ProjectPulse at localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(1200)

        demo_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            demo_btn.first.click()
            page.wait_for_timeout(1200)

        print("\n--- Verifying Primary Action Button on Top Right across all screens ---")

        for item in SCREENS_TO_VERIFY:
            url = f"http://localhost:3000/{item['hash']}"
            page.goto(url)
            page.wait_for_timeout(400)

            # Locate PageHeader (distinguished by holding h1 title)
            header = page.locator("header:has(h1)").first
            assert header.is_visible(), f"PageHeader not visible on {item['desc']}"

            # Verify Primary Action Button in header
            btn = header.locator(f"button:has-text('{item['expected_btn']}')").first
            assert btn.is_visible(), f"Primary action button '{item['expected_btn']}' missing on top right of {item['desc']}"

            # Verify that the primary action button is positioned at the far right
            # By checking its bounding box X coordinate is greater than or equal to Share & Export button if present
            share_btn = header.locator('button[aria-label="Share and export data"]')
            if share_btn.count() > 0 and share_btn.first.is_visible():
                share_box = share_btn.first.bounding_box()
                btn_box = btn.bounding_box()
                if share_box and btn_box:
                    assert btn_box["x"] >= share_box["x"], f"On {item['desc']}, primary button '{item['expected_btn']}' (x={btn_box['x']}) should be to the right of Share & Export (x={share_box['x']})"

            print(f"✓ [{item['desc']}] Top Right Primary Action Verified: '{item['expected_btn']}'")

        # Capture verification screenshots of tasks and reports
        page.goto("http://localhost:3000/#/tasks")
        page.wait_for_timeout(500)
        page.screenshot(path="/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/tasks_top_right_primary_action.png")

        page.goto("http://localhost:3000/#/reports")
        page.wait_for_timeout(500)
        page.screenshot(path="/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/reports_top_right_primary_action.png")

        fatal_errors = [e for e in console_errors if "favicon" not in e and "socket" not in e]
        assert len(fatal_errors) == 0, f"Encountered console errors: {fatal_errors}"

        browser.close()
        print("\n=======================================================")
        print("🎉 ALL 19 SCREENS HAVE PRIMARY ACTION BUTTON ON TOP RIGHT!")
        print("=======================================================")

if __name__ == "__main__":
    test_top_right_primary_actions()
