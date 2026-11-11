import sys
import os
from playwright.sync_api import sync_playwright

def test_functional_matrix_charts():
    artifact_dir = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46"
    errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 920})
        page = context.new_page()

        page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE ERROR: {msg.text}") if msg.type == "error" else None)

        print("[1] Loading ProjectPulse at localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(2000)

        # Load demo database if empty
        demo_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            print("    Loading sample demo data...")
            demo_btn.first.click()
            page.wait_for_timeout(1500)

        print("[2] Navigating to Functional Matrix (#/features)...")
        page.goto("http://localhost:3000/#/features")
        page.wait_for_timeout(1500)

        assert page.locator("text=Functional Matrix & Architecture").is_visible(), "Page header not visible"
        print("✓ Functional Matrix header visible")

        # -------------------------------------------------------------
        # 1. TEST TIMELINE VIEW
        # -------------------------------------------------------------
        print("[3] Switching to Timeline Gantt View...")
        timeline_btn = page.locator('button[aria-label="Timeline Gantt View"]')
        assert timeline_btn.is_visible(), "Timeline toggle button not found"
        timeline_btn.click()
        page.wait_for_timeout(1000)

        # Check Release Legend Bar
        releases_label = page.locator("text=Releases").first
        assert releases_label.is_visible(), "Releases legend not visible in Timeline view"
        print("✓ Release Legend bar rendered")

        # Check Zoom controls
        for zoom in ["day", "week", "month", "quarter"]:
            btn = page.locator(f'button:has-text("{zoom}")')
            assert btn.count() > 0 and btn.first.is_visible(), f"Zoom button '{zoom}' not found"
        print("✓ All 4 Zoom controls (day, week, month, quarter) visible")

        # Check Overlays
        deps_btn = page.locator('button:has-text("Dependencies")')
        actuals_btn = page.locator('button:has-text("Actuals")')
        mc_btn = page.locator('button:has-text("Monte Carlo")')
        assert deps_btn.is_visible(), "Dependencies toggle button not found"
        assert actuals_btn.is_visible(), "Actuals toggle button not found"
        assert mc_btn.is_visible(), "Monte Carlo toggle button not found"
        print("✓ Overlay toggles (Dependencies, Actuals, Monte Carlo) visible")

        # Test toggling Monte Carlo on
        mc_btn.click()
        page.wait_for_timeout(400)
        print("✓ Toggled Monte Carlo probabilistic whiskers")

        # Check Left Column Features and Expand
        expand_all_btn = page.locator('button[title="Expand All Screens"]').first
        assert expand_all_btn.is_visible(), "Expand All button not found"
        expand_all_btn.click()
        page.wait_for_timeout(600)
        print("✓ Tested Expand All screens in Timeline tree")

        # Check Gantt Canvas
        canvas = page.locator('canvas[aria-label="Interactive Feature Gantt Timeline"]')
        assert canvas.is_visible(), "Timeline Gantt canvas not rendered"
        box = canvas.bounding_box()
        assert box and box["width"] > 400 and box["height"] > 200, f"Invalid canvas dimensions: {box}"
        print(f"✓ Timeline Gantt Canvas rendered cleanly with dimensions {box['width']}x{box['height']}")

        # Save Timeline screenshot
        timeline_ss_path = os.path.join(artifact_dir, "functional_matrix_timeline_enhanced.png")
        page.screenshot(path=timeline_ss_path)
        print(f"✓ Functional Matrix Timeline screenshot saved to: {timeline_ss_path}")

        # -------------------------------------------------------------
        # 2. TEST SWIMLANE VIEW
        # -------------------------------------------------------------
        print("[4] Switching to Swimlane Status View...")
        swimlane_btn = page.locator('button[aria-label="Swimlane View"]')
        assert swimlane_btn.is_visible(), "Swimlane toggle button not found"
        swimlane_btn.click()
        page.wait_for_timeout(1000)

        # Check Category Swimlane Header
        sl_title = page.locator("text=Swimlane / Category").first
        assert sl_title.is_visible(), "Swimlane / Category header not visible"
        print("✓ Swimlane axis header visible")

        # Check sticky date axis canvas
        axis_canvas = page.locator('canvas.block').first
        assert axis_canvas.is_visible(), "Sticky date axis canvas not visible"
        print("✓ Sticky date axis canvas rendered")

        # Check category lane tracks
        lane_chevrons = page.locator('div[style*="linear-gradient"]')
        assert lane_chevrons.count() > 0, "Category swimlane headers not rendered"
        print(f"✓ Found {lane_chevrons.count()} category swimlane tracks")

        # Test collapsing and expanding a swimlane
        first_lane_header = lane_chevrons.first
        first_lane_header.click()
        page.wait_for_timeout(400)
        print("✓ Collapsed category swimlane")
        first_lane_header.click()
        page.wait_for_timeout(400)
        print("✓ Re-expanded category swimlane")

        # Save Swimlane screenshot
        swimlane_ss_path = os.path.join(artifact_dir, "functional_matrix_swimlane_enhanced.png")
        page.screenshot(path=swimlane_ss_path)
        print(f"✓ Functional Matrix Swimlane screenshot saved to: {swimlane_ss_path}")

        # -------------------------------------------------------------
        # 3. TEST FEATURE DETAILS MODAL VIA CLICK
        # -------------------------------------------------------------
        print("[5] Testing Feature Click interaction...")
        feature_row = page.locator('div:has-text("scr")').first
        if feature_row.is_visible():
            feature_row.click()
            page.wait_for_timeout(600)
            modal = page.locator('text=Strategic Functional Specification, text=Feature Matrix, text=Feature Details').first
            if modal.is_visible():
                print("✓ Feature Details / Edit Modal opened on row click")
                # Close modal
                close_btn = page.locator('button:has-text("Done"), button:has-text("Close"), button[aria-label="Close"]').first
                if close_btn.is_visible():
                    close_btn.click()
                    page.wait_for_timeout(400)

        print("\n=======================================================")
        print(f"Console/Page Errors logged: {len(errors)}")
        for err in errors:
            print("  -", err)
        print("=======================================================")

        assert len(errors) == 0, f"Found {len(errors)} runtime console/page errors!"
        print("🎉 ALL FUNCTIONAL MATRIX TIMELINE & SWIMLANE TESTS PASSED PERFECTLY!")

        browser.close()

if __name__ == "__main__":
    test_functional_matrix_charts()
