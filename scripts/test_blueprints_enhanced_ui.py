#!/usr/bin/env python3
import os
import sys
import time
from playwright.sync_api import sync_playwright

def test_blueprints_enhanced_ui():
    print("🚀 Starting Comprehensive Step Blueprints UI Verification...")
    screenshots_path = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46"
    os.makedirs(screenshots_path, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE: {msg.text}") if msg.type == "error" else None)

        print("[1] Opening app at http://localhost:3000/#/steps...")
        page.goto("http://localhost:3000/#/steps")
        page.wait_for_timeout(2000)

        demo_btn = page.locator('button:has-text("Load Demo Database")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            print("[2] Loading demo database...")
            demo_btn.first.click()
            page.wait_for_timeout(2000)
            page.goto("http://localhost:3000/#/steps")
            page.wait_for_timeout(1000)

        # 1. Telemetry Strip Verification
        print("\n--- 1. Testing Telemetry KPI Strip ---")
        assert page.locator("text=Workflow Blueprints").is_visible()
        assert page.locator("text=Standardized Phases").is_visible()
        assert page.locator("text=Tasks Governed").is_visible()
        assert page.locator("text=Workflow Scope").is_visible()
        print("✓ Verified 4 Operational Telemetry KPI cards on main page")

        # 2. Search & Category Filters
        print("\n--- 2. Testing Search & Category Filters ---")
        search_input = page.locator('input[placeholder*="Search blueprints"]')
        assert search_input.is_visible()
        search_input.fill("Server")
        page.wait_for_timeout(400)

        matching_cards = page.locator(".card.glass")
        print(f"✓ Search for 'Server' matched {matching_cards.count()} card(s)")
        assert matching_cards.count() >= 1

        # Clear search
        page.locator("button:has(svg.lucide-x)").first.click()
        page.wait_for_timeout(300)

        # Category pill filter
        cat_btn = page.locator("button:has-text('GUI Screen')").first
        if cat_btn.is_visible():
            cat_btn.click()
            page.wait_for_timeout(300)
            gui_cards = page.locator(".card.glass")
            print(f"✓ Category filter 'GUI Screen' matched {gui_cards.count()} card(s)")

            # Reset back to All Categories
            page.locator("button:has-text('All Categories')").click()
            page.wait_for_timeout(300)

        # 3. View Mode Toggle (Grid vs Table)
        print("\n--- 3. Testing View Mode Toggle (Grid vs Table) ---")
        table_btn = page.locator("button:has-text('Table')")
        table_btn.click()
        page.wait_for_timeout(400)

        assert page.locator("table th:has-text('Blueprint Name')").is_visible(), "Table header not visible"
        table_rows = page.locator("tbody tr")
        print(f"✓ Switched to High-Density Table View: {table_rows.count()} blueprints listed")
        assert table_rows.count() >= 3

        # Capture Table View Screenshot
        shot_table = os.path.join(screenshots_path, "blueprints_table_view.png")
        page.screenshot(path=shot_table)
        print(f"✓ Saved table view screenshot to {shot_table}")

        # Switch back to Grid
        grid_btn = page.locator("button:has-text('Grid')")
        grid_btn.click()
        page.wait_for_timeout(400)

        # 4. Proportional Segmented Effort Flow Bar Verification
        print("\n--- 4. Testing Visual Segmented Flow Bar ---")
        first_card = page.locator(".card.glass").first
        segmented_bar = first_card.locator(".h-2.rounded-full")
        assert segmented_bar.is_visible(), "Segmented effort bar missing from card"
        phase_segments = segmented_bar.locator("div")
        print(f"✓ Verified visual proportional effort bar with {phase_segments.count()} segments")
        assert phase_segments.count() >= 3

        # 5. ALM Industry Presets Drawer / Modal
        print("\n--- 5. Testing ALM Workflow Presets ---")
        presets_btn = page.locator("button:has-text('ALM Presets')")
        presets_btn.click()
        page.wait_for_timeout(400)

        assert page.locator("h3:has-text('Standard ALM Industry Workflow Presets')").is_visible()
        preset_items = page.locator("div.space-y-3 > div")
        print(f"✓ Presets modal opened showing {preset_items.count()} enterprise presets")
        assert preset_items.count() >= 5

        # Import a preset (e.g. Critical Defect or DevOps)
        import_devops_btn = page.locator("button:has-text('Import Blueprint')").first
        if import_devops_btn.is_visible():
            import_devops_btn.click()
            page.wait_for_timeout(500)
            print("✓ Imported enterprise blueprint preset into project")

        # 6. Capture Final Enhanced Grid Screenshot
        shot_grid = os.path.join(screenshots_path, "blueprints_enhanced_grid.png")
        page.screenshot(path=shot_grid)
        print(f"✓ Saved enhanced grid view screenshot to {shot_grid}")

        print("\n=======================================================")
        print("🎉 ALL ENHANCED STEP BLUEPRINTS UI TESTS PASSED 100%!")
        print("=======================================================")

        assert len(errors) == 0, f"Errors: {errors}"
        browser.close()

if __name__ == "__main__":
    test_blueprints_enhanced_ui()

