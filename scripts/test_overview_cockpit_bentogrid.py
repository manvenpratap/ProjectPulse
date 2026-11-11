#!/usr/bin/env python3
"""
Playwright test script to verify:
- Executive Overview Cockpit Bento Grid
- Card click interactivity & detail inspector drawers
- Deep-dive navigation
- Zero console/page errors
"""

import sys
from playwright.sync_api import sync_playwright

SCREENSHOT_PATH = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/overview_cockpit_enhanced.png"
DRAWER_SCREENSHOT_PATH = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/overview_cockpit_detail_drawer.png"

def test_overview_cockpit_bentogrid():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 920})
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

        print("[2] Navigating to Executive Overview at localhost:3000/#/overview...")
        page.goto("http://localhost:3000/#/overview")
        page.wait_for_timeout(1000)

        # Step 1: Verify All High-Quality Bento Grid Cards are Present
        print("[3] Verifying Cockpit Bento Grid Cards...")
        assert page.locator("text=Composite Health Index").is_visible(), "Composite Health Index card missing"
        assert page.locator("text=Milestone Delivery Radar").is_visible(), "Milestone Delivery Radar card missing"
        assert page.locator("text=Early Warning Signals").is_visible(), "Early Warning Signals card missing"
        assert page.locator("text=Scope Completed").is_visible(), "Scope Completed tile missing"
        assert page.locator("text=Effort Burned").is_visible(), "Effort Burned tile missing"
        assert page.locator("text=Team Bandwidth").is_visible(), "Team Bandwidth tile missing"
        assert page.locator("text=Governance Index").is_visible(), "Governance Index tile missing"
        assert page.locator("text=Strategic Deliverables Snapshot").is_visible(), "Strategic Deliverables Snapshot missing"
        assert page.locator("text=Module Gravity").is_visible(), "Module Gravity missing"
        print("✓ Verified all 9 Bento Grid Cards are rendered in the Cockpit")

        # Capture Cockpit Bento Grid overview screenshot
        page.screenshot(path=SCREENSHOT_PATH, full_page=True)
        print(f"✓ Cockpit Bento Grid screenshot saved to: {SCREENSHOT_PATH}")

        # Step 2: Test Card Click to Open Details (Health Card)
        print("[4] Testing Card Click: Composite Health Index...")
        health_card = page.locator("div[role='button']:has-text('Composite Health Index')").first
        health_card.click()
        page.wait_for_timeout(500)

        # Verify Detail Modal opened
        assert page.locator("text=Composite Health Diagnostics & Telemetry").is_visible(), "Health detail modal did not open"
        assert page.locator("text=Identified Timeline Slippage & Bottlenecks").is_visible(), "Health factor breakdown missing"
        print("✓ Composite Health Diagnostics detail inspector opened with full factor breakdown")

        # Capture Detail Modal screenshot
        page.screenshot(path=DRAWER_SCREENSHOT_PATH, full_page=False)
        print(f"✓ Detail Modal screenshot saved to: {DRAWER_SCREENSHOT_PATH}")

        # Close with Close button
        page.locator("button:has-text('Close')").first.click()
        page.wait_for_timeout(400)
        assert page.locator("text=Composite Health Diagnostics & Telemetry").count() == 0, "Detail modal did not close"
        print("✓ Successfully closed Health detail modal")

        # Step 3: Test Card Click: Milestone Delivery Radar
        print("[5] Testing Card Click: Milestone Delivery Radar...")
        milestone_card = page.locator("div[role='button']:has-text('Milestone Delivery Radar')").first
        milestone_card.click()
        page.wait_for_timeout(400)
        assert page.locator("text=Milestone Delivery Runway & Critical Gates").is_visible(), "Milestone detail modal did not open"
        page.locator("button:has-text('Close')").first.click()
        page.wait_for_timeout(300)
        print("✓ Milestone Delivery Runway detail inspector verified")

        # Step 4: Test Card Click: Early Warning Signals
        print("[6] Testing Card Click: Early Warning Signals...")
        ews_card = page.locator("div[role='button']:has-text('Early Warning Signals')").first
        ews_card.click()
        page.wait_for_timeout(400)
        assert page.locator("text=Early Warning Signals & Threat Triage").is_visible(), "EWS detail modal did not open"
        page.locator("button:has-text('Close')").first.click()
        page.wait_for_timeout(300)
        print("✓ Early Warning Signals detail inspector verified")

        # Step 5: Test Card Click: Scope Completed
        print("[7] Testing Card Click: Scope Completed...")
        scope_card = page.locator("div[role='button']:has-text('Scope Completed')").first
        scope_card.click()
        page.wait_for_timeout(400)
        assert page.locator("text=Scope Completion & Backlog Matrix").is_visible(), "Scope detail modal did not open"
        page.locator("button:has-text('Close')").first.click()
        page.wait_for_timeout(300)
        print("✓ Scope Completion detail inspector verified")

        # Step 6: Test Card Click: Effort Burned
        print("[8] Testing Card Click: Effort Burned...")
        effort_card = page.locator("div[role='button']:has-text('Effort Burned')").first
        effort_card.click()
        page.wait_for_timeout(400)
        assert page.locator("text=Effort Burn & Resource Velocity").is_visible(), "Effort detail modal did not open"
        page.locator("button:has-text('Close')").first.click()
        page.wait_for_timeout(300)
        print("✓ Effort Burn detail inspector verified")

        # Step 7: Test Card Click: Team Bandwidth
        print("[9] Testing Card Click: Team Bandwidth...")
        team_card = page.locator("div[role='button']:has-text('Team Bandwidth')").first
        team_card.click()
        page.wait_for_timeout(400)
        assert page.locator("text=Team Bandwidth & Allocation Roster").is_visible(), "Team detail modal did not open"
        page.locator("button:has-text('Close')").first.click()
        page.wait_for_timeout(300)
        print("✓ Team Bandwidth detail inspector verified")

        # Step 8: Test Card Click: Governance Index
        print("[10] Testing Card Click: Governance Index...")
        gov_card = page.locator("div[role='button']:has-text('Governance Index')").first
        gov_card.click()
        page.wait_for_timeout(400)
        assert page.locator("text=Governance, Compliance & Decision Ledger").is_visible(), "Governance detail modal did not open"
        page.locator("button:has-text('Close')").first.click()
        page.wait_for_timeout(300)
        print("✓ Governance Index detail inspector verified")

        # Step 9: Test Card Click: Strategic Deliverables Snapshot
        print("[11] Testing Card Click: Strategic Deliverables Snapshot...")
        deliv_card = page.locator("div[role='button']:has-text('Strategic Deliverables Snapshot')").first
        deliv_card.click()
        page.wait_for_timeout(400)
        assert page.locator("text=Strategic Deliverables & Package Deployment").is_visible(), "Deliverables detail modal did not open"
        page.locator("button:has-text('Close')").first.click()
        page.wait_for_timeout(300)
        print("✓ Strategic Deliverables detail inspector verified")

        # Step 10: Test Card Click: Module Gravity
        print("[12] Testing Card Click: Module Gravity...")
        gravity_card = page.locator("div[role='button']:has-text('Module Gravity')").first
        gravity_card.click()
        page.wait_for_timeout(400)
        assert page.locator("text=Module Gravity & Architectural Cohesion").is_visible(), "Gravity detail modal did not open"
        
        # Test deep-dive navigation button inside modal
        print("[13] Testing Navigation from Detail Modal to Full Hub...")
        nav_btn = page.locator("button:has-text('Open Functional Matrix')").first
        nav_btn.click()
        page.wait_for_timeout(800)
        assert page.locator("h1:has-text('Functional Matrix & Architecture')").is_visible(), "Failed to navigate to Functional Matrix"
        print("✓ Successfully navigated from Detail Modal to Functional Matrix")

        fatal_errors = [e for e in console_errors if "favicon" not in e and "socket" not in e]
        assert len(fatal_errors) == 0, f"Encountered console errors: {fatal_errors}"

        browser.close()
        print("\n=======================================================")
        print("🎉 ALL EXECUTIVE OVERVIEW COCKPIT & CARD DRILL-DOWN TESTS PASSED!")
        print("=======================================================")

if __name__ == "__main__":
    test_overview_cockpit_bentogrid()
