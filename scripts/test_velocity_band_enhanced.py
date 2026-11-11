import sys
from playwright.sync_api import sync_playwright

def test_velocity_band_enhanced():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 950})
        page = context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE ERROR: {msg.text}") if msg.type == "error" else None)

        print("[1] Loading ProjectPulse at localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(1500)

        # Load demo database if empty
        demo_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            demo_btn.first.click()
            page.wait_for_timeout(1500)

        # -------------------------------------------------------------
        # STEP 1: Navigate to Project Intelligence & Delivery Flow
        # -------------------------------------------------------------
        print("\n--- STEP 1: Navigate to Project Intelligence & Delivery Flow ---")
        page.goto("http://localhost:3000/#/dash")
        page.wait_for_timeout(1000)
        assert page.locator("text=Project Intelligence Cockpit").is_visible(), "Intelligence Cockpit title missing"

        # Switch to Delivery Flow & Velocity tab
        flow_tab = page.locator("button:has-text('Delivery Flow & Velocity')").first
        flow_tab.click()
        page.wait_for_timeout(800)

        assert page.locator("text=Weekly Delivery Velocity Band & Benchmark").is_visible(), "Velocity Band title missing"
        print("✓ Successfully navigated to Delivery Flow & Velocity tab and located Velocity Band")

        # -------------------------------------------------------------
        # STEP 2: Verify Executive Telemetry Scorecard Cards
        # -------------------------------------------------------------
        print("\n--- STEP 2: Verify Executive Telemetry Scorecard ---")
        assert page.get_by_text("Average Velocity", exact=True).is_visible(), "Average Velocity card missing"
        assert page.get_by_text("Required Velocity", exact=True).is_visible(), "Required Velocity card missing"
        assert page.get_by_text("Flow Predictability", exact=True).is_visible(), "Flow Predictability card missing"
        assert page.get_by_text("Say-Do Reliability", exact=True).is_visible(), "Say-Do Reliability card missing"
        assert page.get_by_text("Stability", exact=True).is_visible(), "Stability label missing"
        assert page.get_by_text("Fulfillment", exact=True).is_visible(), "Fulfillment label missing"
        print("✓ Verified all 4 Executive Scorecard telemetry chips")

        # -------------------------------------------------------------
        # STEP 3: Verify Metric Toggle (Person-Days vs Tasks)
        # -------------------------------------------------------------
        print("\n--- STEP 3: Test Metric Toggles (pd vs tasks) ---")
        assert page.locator("button:has-text('Person-Days (pd)')").is_visible()
        assert page.locator("button:has-text('Tasks Closed (#)')").is_visible()

        # Switch to Tasks Closed (#)
        page.locator("button:has-text('Tasks Closed (#)')").click()
        page.wait_for_timeout(500)
        assert page.locator("text=tasks/wk").count() > 0, "Unit label did not switch to tasks/wk"
        print("✓ Switched metric to Tasks Closed (#)")

        # Switch back to Person-Days
        page.locator("button:has-text('Person-Days (pd)')").click()
        page.wait_for_timeout(500)
        assert page.locator("text=pd/wk").count() > 0, "Unit label did not switch back to pd/wk"
        print("✓ Switched metric back to Person-Days (pd)")

        # -------------------------------------------------------------
        # STEP 4: Test Time Horizon Controls
        # -------------------------------------------------------------
        print("\n--- STEP 4: Test Time Horizon Controls ---")
        assert page.locator("button:has-text('6 Weeks')").is_visible()
        assert page.locator("button:has-text('10 Weeks')").is_visible()
        assert page.locator("button:has-text('Full Lifecycle')").is_visible()

        # Switch to 10 Weeks
        page.locator("button:has-text('10 Weeks')").click()
        page.wait_for_timeout(500)
        print("✓ Switched to 10 Weeks horizon")

        # Switch to Full Lifecycle
        page.locator("button:has-text('Full Lifecycle')").click()
        page.wait_for_timeout(500)
        print("✓ Switched to Full Lifecycle horizon")

        # Switch back to 6 Weeks
        page.locator("button:has-text('6 Weeks')").click()
        page.wait_for_timeout(500)
        print("✓ Restored 6 Weeks horizon")

        # -------------------------------------------------------------
        # STEP 5: Test Display Layer Toggles
        # -------------------------------------------------------------
        print("\n--- STEP 5: Test Display Layer Toggles ---")
        band_toggle = page.locator("label:has-text('Control Band') input")
        target_toggle = page.locator("label:has-text('Target Line') input")
        forecast_toggle = page.locator("label:has-text('Forecast') input")

        assert band_toggle.is_checked(), "Control Band should be checked by default"
        assert target_toggle.is_checked(), "Target Line should be checked by default"
        assert forecast_toggle.is_checked(), "Forecast should be checked by default"

        # Toggle Control Band
        band_toggle.uncheck()
        page.wait_for_timeout(300)
        assert not band_toggle.is_checked()
        band_toggle.check()
        page.wait_for_timeout(300)
        assert band_toggle.is_checked()
        print("✓ Tested Control Band layer toggle")

        # Toggle Forecast
        forecast_toggle.uncheck()
        page.wait_for_timeout(300)
        forecast_toggle.check()
        page.wait_for_timeout(300)
        print("✓ Tested Forecast layer toggle")

        # -------------------------------------------------------------
        # STEP 6: Test Interactive Sprint Breakdown Drill-Down
        # -------------------------------------------------------------
        print("\n--- STEP 6: Test Interactive Sprint Breakdown Drill-Down ---")
        inspect_btn = page.locator("button:has-text('Inspect Sprint')")
        assert inspect_btn.is_visible(), "Inspect Sprint button missing"
        inspect_btn.click()
        page.wait_for_timeout(400)

        assert page.locator("text=Sprint Breakdown:").is_visible(), "Sprint Breakdown panel did not open"
        print("✓ Successfully opened Sprint Breakdown panel")

        # Close button inside breakdown panel
        close_btn = page.locator("button[title='Close Sprint Breakdown']")
        assert close_btn.is_visible(), "Close Sprint Breakdown button missing"
        close_btn.click()
        page.wait_for_timeout(300)
        assert not page.locator("text=Sprint Breakdown:").is_visible(), "Sprint Breakdown panel did not close"
        print("✓ Successfully closed Sprint Breakdown panel")

        # -------------------------------------------------------------
        # STEP 7: Save High-Resolution Screenshots
        # -------------------------------------------------------------
        print("\n--- STEP 7: Capture Final Artifact Screenshot ---")
        chart_card = page.locator("text=Weekly Delivery Velocity Band & Benchmark").locator("xpath=../../..")
        chart_card.screenshot(path="/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/enhanced_velocity_band_card.png")
        print("✓ Saved artifact screenshot to enhanced_velocity_band_card.png")

        # Verify console errors
        critical_errors = [e for e in errors if "favicon" not in e.lower() and "font" not in e.lower()]
        assert len(critical_errors) == 0, f"Critical browser errors encountered: {critical_errors}"

        print("\n=======================================================")
        print("🎉 ALL ENHANCED VELOCITY BAND & BENCHMARK TESTS PASSED!")
        print("=======================================================")
        browser.close()

if __name__ == "__main__":
    test_velocity_band_enhanced()
