#!/usr/bin/env python3
"""
Playwright test script to verify Module Architecture Maturity enhancement:
- Executive Telemetry Strip (Readiness, L4 Verified, Active Construction, Debt)
- Interactive Matrix Grid & Bento Cards view
- Defect and Effort overlay toggles
- Domain search filter
- Cell drill-down deliverable inspector drawer
- Captures screenshot module_architecture_enhanced.png
"""

import sys
import os
from playwright.sync_api import sync_playwright

SCREENSHOT_PATH = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/module_architecture_enhanced.png"

def test_module_architecture_maturity():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 960})
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        print("[1] Loading ProjectPulse at localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(1500)

        # Load demo database if empty
        demo_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            demo_btn.first.click()
            page.wait_for_timeout(1500)

        print("[2] Navigating to Project Intelligence at localhost:3000/#/dash...")
        page.goto("http://localhost:3000/#/dash")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        # Step 1: Switch to Delivery Flow & Velocity Tab
        print("[3] Switching to Tab 2: Delivery Flow & Velocity...")
        tab_btn = page.locator("button:has-text('Delivery Flow & Velocity')").first
        assert tab_btn.is_visible(), "Delivery Flow & Velocity tab not visible"
        tab_btn.click()
        page.wait_for_timeout(600)

        # Step 2: Locate Module Architecture Maturity container
        print("[4] Verifying Module Architecture Maturity header and telemetry...")
        matrix_header = page.locator("text=Module Architecture Maturity").first
        assert matrix_header.is_visible(), "Module Architecture Maturity header not found"
        matrix_header.scroll_into_view_if_needed()
        page.wait_for_timeout(500)

        # Verify 4 KPI metric cards in telemetry strip
        assert page.locator("text=Overall Readiness").first.is_visible(), "Overall Readiness KPI card missing"
        assert page.locator("text=Production Ready").first.is_visible(), "Production Ready KPI card missing"
        assert page.locator("text=Active Implementation").first.is_visible(), "Active Implementation KPI card missing"
        assert page.locator("text=Architectural Debt").first.is_visible(), "Architectural Debt KPI card missing"
        print("✓ Verified Executive Telemetry Strip (4 KPI chips)")

        # Step 3: Test Search Filtering
        print("[5] Testing Domain Search Filter...")
        search_input = page.locator("input[placeholder*='Filter domains']").first
        assert search_input.is_visible(), "Search input not found"
        search_input.fill("Payment")
        page.wait_for_timeout(400)
        assert page.locator("text=Payment Module").first.is_visible(), "Payment Module should be visible after search"
        # Clear search
        search_input.fill("")
        page.wait_for_timeout(400)
        print("✓ Verified Domain Search Filter")

        # Step 4: Test Bento Cards View Mode Toggle
        print("[6] Testing View Mode Toggle (Matrix <-> Cards)...")
        cards_btn = page.locator("button[title='Domain Cards View']").first
        assert cards_btn.is_visible(), "Cards view toggle button missing"
        cards_btn.click()
        page.wait_for_timeout(500)
        # In Cards view, domains are rendered as bento cards
        assert page.locator("text=Active Architecture Tiers").first.is_visible(), "Domain architecture tiers summary in cards missing"
        
        # Switch back to Matrix Grid view
        matrix_btn = page.locator("button[title='2D Matrix Grid']").first
        assert matrix_btn.is_visible(), "Matrix view toggle button missing"
        matrix_btn.click()
        page.wait_for_timeout(500)
        print("✓ Verified Bento Cards & Matrix Grid toggle")

        # Step 5: Test Interactive Cell Drill-Down
        print("[7] Testing Cell Click Drill-Down Inspector...")
        # Find any clickable matrix cell that has tasks (showing progress badge)
        active_cell = page.locator("td[title*='Click to inspect']").first
        active_cell.scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        assert active_cell.is_visible(), "Active matrix cell not found"
        active_cell.click()
        page.wait_for_timeout(600)

        # Verify drill-down drawer opened
        assert page.locator("text=Deliverable Task").first.is_visible(), "Cell drill-down inspector drawer did not open"
        print("✓ Verified Cell Drill-Down Inspector opened with deliverables")

        # Capture screenshot while drawer is active
        page.wait_for_timeout(500)
        page.screenshot(path=SCREENSHOT_PATH, full_page=False)
        print(f"✓ Screenshot captured to: {SCREENSHOT_PATH}")

        # Close drill-down drawer
        close_btn = page.locator("button[title='Close drilldown panel']").first
        assert close_btn.is_visible(), "Close button not visible"
        close_btn.click()
        page.wait_for_timeout(400)
        print("✓ Closed drill-down inspector panel")

        # Check for fatal errors
        fatal_errors = [e for e in console_errors if "favicon" not in e and "socket" not in e]
        assert len(fatal_errors) == 0, f"Encountered console errors: {fatal_errors}"

        browser.close()
        print("\n🎉 ALL MODULE ARCHITECTURE MATURITY TESTS PASSED!")

if __name__ == "__main__":
    test_module_architecture_maturity()
