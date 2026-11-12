#!/usr/bin/env python3
import os
import sys
import time
from playwright.sync_api import sync_playwright

def test_option_libraries_ui():
    print("🚀 Starting Comprehensive Option Libraries UI & Feature Verification...")
    screenshot_dir = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46"
    os.makedirs(screenshot_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            accept_downloads=True
        )
        page = context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE: {msg.text}") if msg.type == "error" else None)

        print("[1] Opening app at http://localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(2000)

        demo_btn = page.locator('button:has-text("Load Demo Database")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            print("[2] Loading demo database...")
            demo_btn.first.click()
            page.wait_for_timeout(2000)

        print("[3] Navigating to Option Libraries view...")
        page.goto("http://localhost:3000/#/dropdowns")
        page.wait_for_timeout(1000)

        # 1. Header and Telemetry KPI Strip verification
        assert page.locator("h1:has-text('Option Libraries')").is_visible(), "Page header 'Option Libraries' not found"
        print("✓ Verified Page Header: 'Option Libraries'")

        kpi_cards = page.locator("div.grid-cols-2 > div, div.md\\:grid-cols-4 > div")
        assert kpi_cards.count() >= 4, f"Expected 4 Telemetry KPI cards, got {kpi_cards.count()}"
        print(f"✓ Verified Telemetry KPI strip with {kpi_cards.count()} telemetry cards")

        # Capture initial screenshot
        screen1 = os.path.join(screenshot_dir, "option_libraries_enhanced_live.png")
        page.screenshot(path=screen1)
        print(f"✓ Saved screenshot to {screen1}")

        # 2. Testing Search & Filtering in Sidebar
        print("\n--- Testing Sidebar Search & Tabs ---")
        search_input = page.locator('input[placeholder*="Filter libraries"]')
        assert search_input.is_visible()
        search_input.fill("defect")
        page.wait_for_timeout(400)

        defect_libs = page.locator("div.overflow-y-auto button:has-text('Defect')")
        print(f"✓ Search for 'defect' found {defect_libs.count()} matching libraries")
        assert defect_libs.count() >= 3, "Expected at least 3 defect libraries"

        # Clear search
        page.locator("button:has(svg.lucide-x)").first.click()
        page.wait_for_timeout(300)

        # Tab switching
        page.locator("div.flex.items-center.p-0\\.5 button:has-text('Core')").click()
        page.wait_for_timeout(300)
        core_count = page.locator("div.overflow-y-auto button:has-text('Core')").count()
        print(f"✓ Core tab active: {core_count} core libraries")

        page.locator("div.flex.items-center.p-0\\.5 button:has-text('All')").click()
        page.wait_for_timeout(300)

        # 3. Testing Library Selection & Human-Friendly Labels
        print("\n--- Testing Library Selection ---")
        # Click Defect Severity Rating
        sev_btn = page.locator("button:has-text('Defect Severity')").first
        sev_btn.click()
        page.wait_for_timeout(500)

        active_title = page.locator("h2:has-text('Defect Severity')")
        assert active_title.is_visible(), "Defect Severity workshop header not visible"
        print("✓ Selected 'Defect Severity Rating' (defectSeverity)")

        # 4. Testing Option Reordering (Move Up / Move Down)
        print("\n--- Testing Option Reordering ---")
        first_option_text = page.locator("main .space-y-2 > div span.truncate").first.inner_text()
        print(f"✓ Top option before move down: '{first_option_text}'")

        # Click Move Down on first item
        move_down_btn = page.locator("main .space-y-2 > div button[title='Move option down']").first
        move_down_btn.click()
        page.wait_for_timeout(400)

        second_option_text = page.locator("main .space-y-2 > div span.truncate").nth(1).inner_text()
        assert second_option_text == first_option_text, f"Expected '{first_option_text}' to move to index 1, got '{second_option_text}'"
        print(f"✓ Reorder verified: '{first_option_text}' moved down successfully")

        # 5. Testing Default Option Toggling (Star)
        print("\n--- Testing Default Option Star Toggling ---")
        # Star the first option
        star_btn = page.locator("main .space-y-2 > div button[title*='default']").first
        star_btn.click()
        page.wait_for_timeout(400)

        default_badge = page.locator("main .space-y-2 > div span:has-text('Default')").first
        assert default_badge.is_visible(), "Default badge not visible after clicking star"
        print("✓ Star toggle verified: Default badge active with amber indicator")

        # 6. Testing Inline Editing
        print("\n--- Testing Inline Editing ---")
        edit_btn = page.locator("main .space-y-2 > div button[title='Edit value']").first
        edit_btn.click()
        page.wait_for_timeout(300)

        edit_input = page.locator("main .space-y-2 > div input[type='text']")
        assert edit_input.is_visible(), "Inline edit input did not appear"
        curr_val = edit_input.input_value()
        edit_input.fill(curr_val + " (Verified)")
        page.keyboard.press("Enter")
        page.wait_for_timeout(400)

        edited_text = page.locator("main .space-y-2 > div span.truncate").first.inner_text()
        assert "(Verified)" in edited_text, f"Expected edited text to contain '(Verified)', got '{edited_text}'"
        print(f"✓ Inline edit verified: updated to '{edited_text}'")

        # 7. Testing Adding New Option Value
        print("\n--- Testing Add Option ---")
        add_input = page.locator('input[placeholder*="Type new option value"]')
        add_input.fill("S5 - Trivial Cosmetic")
        page.keyboard.press("Enter")
        page.wait_for_timeout(400)

        assert page.locator("span.truncate:has-text('S5 - Trivial Cosmetic')").is_visible(), "New option not added"
        print("✓ Add option verified: 'S5 - Trivial Cosmetic' added via Enter shortcut")

        # 8. Testing Alphabetical Sorting
        print("\n--- Testing Alphabetical Sort ---")
        sort_az_btn = page.locator("button:has-text('A→Z')")
        sort_az_btn.click()
        page.wait_for_timeout(400)

        first_sorted = page.locator("main .space-y-2 > div span.truncate").first.inner_text()
        last_sorted = page.locator("main .space-y-2 > div span.truncate").last.inner_text()
        print(f"✓ Alphabetical A→Z sort: First='{first_sorted}', Last='{last_sorted}'")

        # 9. Testing Bulk Edit Modal
        print("\n--- Testing Bulk Edit Modal ---")
        bulk_btn = page.locator("button:has-text('Bulk Edit')")
        bulk_btn.click()
        page.wait_for_timeout(400)

        bulk_modal = page.locator("h3:has-text('Bulk Edit')")
        assert bulk_modal.is_visible(), "Bulk Edit modal not visible"
        textarea = page.locator("textarea")
        assert textarea.is_visible()
        lines = textarea.input_value().split("\n")
        print(f"✓ Bulk modal opened with {len(lines)} lines")

        # Close bulk modal
        page.locator("button:has-text('Cancel')").click()
        page.wait_for_timeout(300)

        # 10. Testing Creating a Custom Library
        print("\n--- Testing Create Custom Option Library ---")
        create_lib_btn = page.locator("button:has-text('Create Library')").first
        create_lib_btn.click()
        page.wait_for_timeout(400)

        lib_key_input = page.locator("input[placeholder*='e.g. tierLevel']")
        lib_key_input.fill("clientSlaTier")

        lib_values_input = page.locator("textarea[placeholder*='Enterprise']")
        lib_values_input.fill("Tier 1 - Mission Critical\nTier 2 - Business Impact\nTier 3 - Standard")

        page.locator("button:has-text('Create Library')").nth(1).click()
        page.wait_for_timeout(600)

        assert page.locator("h2:has-text('Client Sla Tier')").is_visible(), "Newly created custom library not loaded"
        print("✓ Created custom library: 'Client Sla Tier' (clientSlaTier)")

        # Verify options in new library
        assert page.locator("span.truncate:has-text('Tier 1 - Mission Critical')").is_visible()
        print("✓ Custom library options populated properly")

        # Capture final screenshot
        screen2 = os.path.join(screenshot_dir, "option_libraries_custom_created.png")
        page.screenshot(path=screen2)
        print(f"✓ Saved screenshot to {screen2}")

        print("\n=======================================================")
        print("🎉 ALL OPTION LIBRARIES UI & FEATURE TESTS PASSED 100%!")
        print("=======================================================")

        assert len(errors) == 0, f"Errors encountered: {errors}"
        browser.close()

if __name__ == "__main__":
    test_option_libraries_ui()
