#!/usr/bin/env python3
"""
Playwright test script to verify:
- Executive Overview Visual Command Center
- All Visual Instruments:
  1. Composite Health Index (360° Circular SVG Gauge + 7-Week Sparkline + KPI strip)
  2. Delivery Confidence (180° Speedometer SVG Dial + Runway Forecast)
  3. Threat Radar & Anomaly Multi-Meters
  4. Delivery Velocity 6-Week Histogram with Target Benchmark line
  5. Module Architecture Mass Donut Chart with Domain Slices
  6. RAID 3x3 Risk Heatmap Matrix
  7. Deliverable Scope & Effort Dual Radial Rings & Priority Bar
  8. Milestone Delivery Horizon & Release Flight Path
  9. Recent Deliveries & Multi-Level Accomplishments Stream
  10. Intelligence Deep-Dive Gateway Banner
- Interactivity: Card click to open inspector modals and deep-dive links
- Zero console/page errors
"""

import sys
from playwright.sync_api import sync_playwright

OVERVIEW_SCREENSHOT = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/executive_overview_visual_widgets.png"
MIDDLE_SCREENSHOT = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/executive_overview_matrix_and_scope.png"
LOWER_SCREENSHOT = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/executive_overview_milestones_and_stream.png"
MODAL_SCREENSHOT = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/executive_overview_detail_modal.png"

def test_visual_overview_widgets():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 950})
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

        # Step 1: Verify All Visual Widgets and Charts
        print("[3] Verifying All Visual Instruments & Charts...")
        
        # 1. Composite Health Index Dial & Sparkline
        assert page.locator("text=Composite Health Index").is_visible(), "Composite Health Index card missing"
        assert page.locator("text=7-Week Trend").is_visible(), "7-Week Sparkline trend label missing"
        
        # 2. Delivery Confidence Speedometer
        assert page.locator("text=Delivery Confidence").is_visible(), "Delivery Confidence card missing"
        assert page.locator('button[aria-label="Delivery Confidence guide"]').is_visible(), "Delivery Confidence section help button missing"
        assert page.locator("text=Velocity Corridor:").is_visible(), "Velocity Corridor label missing"

        # 3. Threat Radar
        assert page.locator("text=Threat Radar").is_visible(), "Threat Radar card missing"
        assert page.locator("text=Overdue Deliverables").is_visible(), "Overdue Deliverables meter missing"
        assert page.locator("text=High Threat RAID").is_visible(), "High Threat RAID meter missing"

        # 4. Delivery Velocity Histogram
        assert page.locator("text=Delivery Velocity & Throughput Corridor").is_visible(), "Velocity histogram missing"
        assert page.locator("text=Delivery Momentum:").is_visible(), "Delivery Momentum footer missing"

        # 5. Module Architecture Mass Donut Chart
        assert page.locator("text=Module Architecture Mass").is_visible(), "Module Architecture Donut missing"
        assert page.locator("text=Total Mass").is_visible(), "Donut center Total Mass label missing"
        assert page.locator("text=Architectural Cohesion").is_visible(), "Architectural Cohesion footer missing"

        # 6. RAID 3x3 Risk Heatmap Matrix
        assert page.locator("text=RAID 3×3 Risk Heatmap Matrix").is_visible(), "Risk Heatmap Matrix missing"
        assert page.locator("text=Impact ↓ / Prob →").is_visible(), "3x3 Matrix header missing"
        assert page.locator("text=Risk Resolution Progress").is_visible(), "Risk Resolution progress missing"

        # 7. Scope & Effort Dual Radial Rings
        assert page.locator("text=Deliverable Scope & Effort Burn").is_visible(), "Scope & Effort rings missing"
        assert page.locator("text=Priority Distribution").is_visible(), "Priority Distribution segmented bar missing"

        # 8. Milestone Delivery Horizon
        assert page.locator("text=Milestone Delivery Horizon & Release Gates").is_visible(), "Milestones runway missing"
        assert page.locator("text=Target Launch:").is_visible(), "Target Launch countdown missing"

        # 9. Recent Deliveries Stream
        assert page.locator("text=Recent Deliveries & Multi-Level Accomplishments").is_visible(), "Accomplishments stream missing"
        assert page.locator("text=Completed").first.is_visible(), "Completed count pill missing"

        # 10. Intelligence Jump Links Bar
        assert page.locator("text=Intelligence Cockpit Jump Links").is_visible(), "Intelligence jump links header missing"
        assert page.locator("button:has-text('Launch Intelligence Cockpit')").is_visible(), "Launch Intelligence button missing"

        print("✓ All 10 Visual Telemetry Instruments & Charts verified successfully!")

        # Step 2: Capture Visual Screenshots
        print("[4] Capturing Executive Overview Visual Screenshots...")
        page.screenshot(path=OVERVIEW_SCREENSHOT)
        print(f"✓ Hero & Charts screenshot saved to: {OVERVIEW_SCREENSHOT}")

        # Scroll to middle (Risk Heatmap & Scope Rings)
        page.locator("text=RAID 3×3 Risk Heatmap Matrix").scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        page.screenshot(path=MIDDLE_SCREENSHOT)
        print(f"✓ Matrix & Scope Rings screenshot saved to: {MIDDLE_SCREENSHOT}")

        # Scroll to lower (Milestone Flight Path & Accomplishments Stream)
        page.locator("text=Intelligence Cockpit Jump Links").scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        page.screenshot(path=LOWER_SCREENSHOT)
        print(f"✓ Milestones & Stream screenshot saved to: {LOWER_SCREENSHOT}")

        # Step 2b: Test Telemetry Controls & Interactive In-Card Mode Toggles
        print("[4b] Testing Telemetry Controls & Interactive Chart Toggles...")
        pause_btn = page.locator("button:has-text('Pause Sweep')").first
        assert pause_btn.is_visible(), "Pause Sweep button missing"
        pause_btn.click()
        page.wait_for_timeout(150)
        assert page.locator("button:has-text('Resume Sweep')").is_visible(), "Resume Sweep toggle failed"
        page.locator("button:has-text('Resume Sweep')").first.click()
        page.wait_for_timeout(150)

        replay_btn = page.locator("button:has-text('Replay')").first
        assert replay_btn.is_visible(), "Replay button missing"
        replay_btn.click()
        page.wait_for_timeout(450)

        # Switch Velocity Mode to Curve & back without triggering modal
        curve_btn = page.locator("button:has-text('Curve')").first
        assert curve_btn.is_visible(), "Curve toggle missing"
        curve_btn.click()
        page.wait_for_timeout(300)
        assert page.locator("text=Effort Burn & Resource Velocity").count() == 0, "Curve toggle must not bubble into card modal"
        page.locator("button:has-text('Bars')").first.click()
        page.wait_for_timeout(200)
        print("✓ Telemetry Strip, Replay & Interactive Chart Mode Toggles verified!")

        # Scroll back to top
        page.locator("text=Composite Health Index").scroll_into_view_if_needed()
        page.wait_for_timeout(300)

        # Step 3: Test Interactive Modal Inspection (Health Card)
        print("[5] Testing Card Click: Composite Health Index...")
        health_card = page.locator("div[role='button']:has-text('Composite Health Index')").first
        health_card.click()
        page.wait_for_timeout(400)

        assert page.locator("text=Composite Health Diagnostics & Telemetry").is_visible(), "Health detail modal did not open"
        assert page.locator("text=Identified Timeline Slippage & Bottlenecks").is_visible(), "Health factor breakdown missing"
        print("✓ Composite Health Diagnostics detail inspector opened with full factor breakdown")

        # Capture Modal screenshot
        page.screenshot(path=MODAL_SCREENSHOT, full_page=False)
        print(f"✓ Detail Modal screenshot saved to: {MODAL_SCREENSHOT}")

        # Close Modal
        page.locator("button:has-text('Close')").first.click()
        page.wait_for_timeout(300)
        assert page.locator("text=Composite Health Diagnostics & Telemetry").count() == 0, "Detail modal did not close"
        print("✓ Successfully closed Health detail modal")

        # Step 4: Test Interactive Modal Inspection (Risk Matrix + Escape Key Dismissal)
        print("[6] Testing Card Click: RAID 3x3 Risk Heatmap Matrix...")
        risk_card = page.locator("div[role='button']:has-text('RAID 3×3 Risk Heatmap Matrix')").first
        risk_card.click()
        page.wait_for_timeout(400)

        assert page.locator("text=Governance, Compliance & Decision Ledger").is_visible(), "Governance detail modal did not open"
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        assert page.locator("text=Governance, Compliance & Decision Ledger").count() == 0, "Escape key did not close modal"
        print("✓ Risk Heatmap / Governance detail inspector & Escape dismissal verified")

        # Step 4b: Light Theme & Mobile Viewport Overflow Check
        page.evaluate("() => { if (window.setTheme) window.setTheme('origin'); document.documentElement.setAttribute('data-theme', 'origin'); document.documentElement.setAttribute('data-color-mode', 'light'); }")
        page.wait_for_timeout(300)
        assert page.locator("text=Composite Health Index").is_visible(), "Overview failed on light theme"

        mobile_ctx = browser.new_context(viewport={"width": 375, "height": 812})
        m_page = mobile_ctx.new_page()
        m_page.goto("http://localhost:3000")
        m_page.wait_for_timeout(1000)
        m_demo = m_page.locator('button:has-text("Load Demo Database")')
        if m_demo.count() > 0 and m_demo.first.is_visible():
            m_demo.first.click()
            m_page.wait_for_timeout(1000)
        m_page.goto("http://localhost:3000/#/overview")
        m_page.wait_for_timeout(700)
        overflow = m_page.evaluate("document.documentElement.scrollWidth > window.innerWidth + 2")
        assert not overflow, "Horizontal overflow detected on 375px mobile viewport"
        mobile_ctx.close()
        print("✓ Light theme & 375px Mobile responsive check passed with 0 overflow!")

        # Step 5: Test Deep-Dive Link to Intelligence Cockpit
        print("[7] Testing Launch Intelligence Cockpit button...")
        launch_btn = page.locator("button:has-text('Launch Intelligence Cockpit')").first
        launch_btn.click()
        page.wait_for_timeout(600)
        assert page.locator("h1:has-text('Project Intelligence Cockpit')").is_visible(), "Failed to navigate to Intelligence Cockpit"
        print("✓ Successfully navigated from Executive Overview to Project Intelligence Cockpit")

        # Check console errors
        fatal_errors = [e for e in console_errors if "favicon" not in e and "socket" not in e]
        assert len(fatal_errors) == 0, f"Encountered console errors: {fatal_errors}"

        browser.close()
        print("\n=======================================================")
        print("🎉 ALL EXECUTIVE OVERVIEW VISUAL WIDGET TESTS PASSED!")
        print("=======================================================")

if __name__ == "__main__":
    test_visual_overview_widgets()
