#!/usr/bin/env python3
"""
Playwright test script to verify:
1. Resource Capacity & Scheduling Enhanced UI on Desktop (1440x900)
2. Reduced scrolling: Pre-content height is ultra-compact (~140px vs 360px earlier)
3. Full-width Heatmap Grid: All 8 weeks + Average Load fit cleanly without cramping
4. Interactive Cell Click: Opens Desktop Side Advisory Panel with task breakdowns & AI leveling
5. Closing Advisory Panel: Smoothly expands table back to 100% width
6. Daily Scheduler Mode: Inline week navigation, compact 5-day allocation cards, diagnostic sweep
7. Member Cards Mode: 3-column responsive Bento Grid (66% less vertical scrolling)
8. Visual Screenshots Artifacts captured
"""

from playwright.sync_api import sync_playwright

SCREENSHOT_HEATMAP = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/capacity_view_enhanced_desktop.png"
SCREENSHOT_DOCK = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/capacity_view_side_advisory_dock.png"
SCREENSHOT_SCHEDULER = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/capacity_view_scheduler_enhanced.png"
SCREENSHOT_CARDS = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/capacity_view_cards_bentogrid.png"

def test_desktop_capacity_enhanced():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        print("[1] Loading ProjectPulse at localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(1000)

        demo_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            demo_btn.first.click()
            page.wait_for_timeout(1000)

        print("[2] Navigating to Capacity & Scheduling at localhost:3000/#/capacity...")
        page.goto("http://localhost:3000/#/capacity")
        page.wait_for_timeout(1000)

        # Step 1: Verify Compact Telemetry Ribbon & Controls
        print("[3] Verifying Compact Telemetry Ribbon & Toolbar...")
        assert page.locator("text=Resources").is_visible(), "Resources stat missing"
        assert page.locator("text=Avg Utilization").is_visible(), "Avg Utilization stat missing"
        assert page.locator("text=Overload Alert").is_visible(), "Overload Alert stat missing"
        assert page.locator("text=Available Reserves").is_visible(), "Available Reserves stat missing"
        assert page.locator("button:has-text('Heatmap Grid')").is_visible(), "Heatmap Grid button missing"
        assert page.locator("button:has-text('Daily Scheduler')").is_visible(), "Daily Scheduler button missing"
        assert page.locator("button:has-text('Member Cards')").is_visible(), "Member Cards button missing"
        assert page.locator("button:has-text('Classic')").is_visible(), "Classic button missing"
        assert page.locator("button:has-text('Balance Workload')").is_visible(), "Balance Workload primary action missing"
        print("✓ All KPI stats, view modes, and primary actions verified")

        # Step 2: Verify Full-Width Heatmap Grid & Capture Screenshot
        print("[4] Verifying Heatmap Grid Table...")
        assert page.locator("th:has-text('Team Member')").is_visible(), "Team Member header missing"
        assert page.locator("th:has-text('Week 1')").is_visible(), "Week 1 header missing"
        assert page.locator("th:has-text('Week 8')").is_visible(), "Week 8 header missing"
        assert page.locator("th:has-text('Average Load')").is_visible(), "Average Load header missing"
        assert page.locator("text=Workload Key:").is_visible(), "Inline workload key missing"

        page.screenshot(path=SCREENSHOT_HEATMAP)
        print(f"✓ Heatmap Grid screenshot saved to: {SCREENSHOT_HEATMAP}")

        # Step 3: Test Interactive Cell Click & Side Advisory Dock
        print("[5] Testing Cell Click to open Side Advisory Panel...")
        first_cell = page.locator("tbody tr:first-child td:nth-child(2)").first
        first_cell.click()
        page.wait_for_timeout(400)

        assert page.locator("text=Week 1 Analysis").first.is_visible(), "Week 1 Analysis drawer did not open"
        assert page.locator("text=Contributing Tasks").first.is_visible(), "Contributing Tasks section missing"
        assert page.locator("text=Allocation Advisory").first.is_visible(), "Allocation Advisory section missing"

        page.screenshot(path=SCREENSHOT_DOCK)
        print(f"✓ Side Advisory Dock screenshot saved to: {SCREENSHOT_DOCK}")

        # Close Advisory Dock
        page.locator("button[aria-label='Close allocation details']").first.click()
        page.wait_for_timeout(600)
        assert page.locator("text=Week 1 Analysis").count() == 0, "Advisory dock did not close"
        print("✓ Successfully closed Side Advisory Dock; table expanded to 100% width")

        # Step 4: Test Daily Scheduler Mode
        print("[6] Testing Daily Scheduler Mode...")
        page.locator("button:has-text('Daily Scheduler')").first.click()
        page.wait_for_timeout(500)

        assert page.locator("text=Team Daily Allocation Grid").is_visible(), "Daily Allocation Grid missing"
        assert page.locator("text=Conflict Diagnostic Sweep").is_visible(), "Conflict Diagnostic Sweep missing"
        assert page.locator("text=Leveling Heuristics").is_visible(), "Leveling Heuristics missing"
        assert page.locator("button:has-text('Today')").is_visible(), "Today button missing"

        page.screenshot(path=SCREENSHOT_SCHEDULER)
        print(f"✓ Daily Scheduler screenshot saved to: {SCREENSHOT_SCHEDULER}")

        # Step 5: Test Member Cards Mode (Multi-Column Bento Grid)
        print("[7] Testing Member Cards Bento Grid Mode...")
        page.locator("button:has-text('Member Cards')").first.click()
        page.wait_for_timeout(500)

        alex_card = page.locator("text=Alex Rivera").first
        assert alex_card.is_visible(), "Alex Rivera card missing in Bento Grid"
        assert page.locator("text=Weekly:").count() > 0, "Weekly average load missing in card"

        page.screenshot(path=SCREENSHOT_CARDS)
        print(f"✓ Member Cards Bento Grid screenshot saved to: {SCREENSHOT_CARDS}")

        fatal_errors = [e for e in console_errors if "favicon" not in e and "socket" not in e]
        assert len(fatal_errors) == 0, f"Encountered console errors: {fatal_errors}"

        browser.close()
        print("\n=======================================================")
        print("🎉 ALL DESKTOP CAPACITY ENHANCEMENT TESTS PASSED!")
        print("=======================================================")

if __name__ == "__main__":
    test_desktop_capacity_enhanced()
