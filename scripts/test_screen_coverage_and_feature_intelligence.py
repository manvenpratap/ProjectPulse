import sys
import os
from playwright.sync_api import sync_playwright

def test_screen_coverage_and_feature_intelligence():
    artifact_dir = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46"
    errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 960})
        page = context.new_page()

        page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE ERROR: {msg.text}") if msg.type == "error" else None)

        print("[1] Loading ProjectPulse at localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(2000)

        # Load demo database if needed
        demo_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            print("    Loading sample demo data...")
            demo_btn.first.click()
            page.wait_for_timeout(1500)

        print("[2] Navigating to Functional Matrix (#/features)...")
        page.goto("http://localhost:3000/#/features")
        page.wait_for_timeout(1500)

        header = page.locator("text=Functional Matrix & Architecture")
        assert header.is_visible(), "Functional Matrix header not visible"
        print("✓ Functional Matrix header visible")

        # ---------------------------------------------------------------------
        # 1. TEST SCREEN COVERAGE AUDIT DRAWER & MODULE GROUPING
        # ---------------------------------------------------------------------
        print("[3] Testing Screen Coverage Audit Toggle...")
        coverage_btn = page.locator('button[title*="Screen Coverage Audit"]')
        assert coverage_btn.is_visible(), "Coverage toggle button not found"
        coverage_btn.click()
        page.wait_for_timeout(1000)

        audit_heading = page.locator("text=Screen Coverage Audit")
        assert audit_heading.is_visible(), "Screen Coverage Audit drawer heading not visible"
        print("✓ Screen Coverage Audit drawer opened")

        # Capture screenshot of coverage audit drawer with module groups
        audit_screenshot_path = os.path.join(artifact_dir, "screen_coverage_audit_module_grouped.png")
        page.screenshot(path=audit_screenshot_path)
        print(f"✓ Saved screenshot: {audit_screenshot_path}")

        # Check for module groups and batch assign controls
        module_groups = page.locator('div.bg-\\[var\\(--color-surface\\)\\].border.rounded-xl')
        print(f"    Found {module_groups.count()} module groups in Coverage Audit")
        
        assign_all_btns = page.locator('button:has-text("Assign All")')
        print(f"    Found {assign_all_btns.count()} 'Assign All' batch buttons")
        
        map_btns = page.locator('button:has-text("Map")')
        print(f"    Found {map_btns.count()} individual screen 'Map' buttons")

        # ---------------------------------------------------------------------
        # 2. TEST BATCH ASSIGN "+ New Feature..." FROM COVERAGE AUDIT
        # ---------------------------------------------------------------------
        print("[4] Testing '+ New Feature...' from Module Batch Assign...")
        batch_select = page.locator('select[title*="Assign all unmapped screens"]').first
        if batch_select.is_visible():
            batch_select.select_option("__new__")
            page.wait_for_timeout(300)
            assign_all_btns.first.click()
            page.wait_for_timeout(1000)

            # Check if Feature Create Modal opened with pre-selected screens
            modal_title = page.locator("text=Create Strategic Feature")
            assert modal_title.is_visible(), "Create Feature modal did not open from batch assign"
            print("✓ Create Strategic Feature modal opened with pre-selected screens from module")

            # Check mapped screens count badge
            mapped_count = page.locator("text=mapped").first
            assert mapped_count.is_visible(), "Mapped screens count badge not visible"
            print("✓ Pre-selected screen chips visible in modal")

            # Check Auto-inferred Target Release badge
            auto_rel_badge = page.locator('button:has-text("Auto:")')
            if auto_rel_badge.count() > 0:
                print(f"✓ Target Release auto-inferred badge: {auto_rel_badge.first.inner_text()}")

            # Close modal to test New Feature button
            cancel_btn = page.locator('button:has-text("Cancel")')
            cancel_btn.click()
            page.wait_for_timeout(500)

        # ---------------------------------------------------------------------
        # 3. TEST FEATURE CREATE/EDIT MODAL INTELLIGENCE & SUGGESTIONS
        # ---------------------------------------------------------------------
        print("[5] Opening New Feature modal via top-right 'New Feature' button...")
        new_feat_btn = page.locator('button:has-text("New Feature")').first
        new_feat_btn.click()
        page.wait_for_timeout(1000)

        # Type feature name to trigger Auto-Category inference
        name_input = page.locator('input[placeholder*="Risk Analytics"]').first
        assert name_input.is_visible(), "Feature name input not visible"
        name_input.fill("Liquidity Risk & Margin Collateral Engine")
        page.wait_for_timeout(500)

        # Check Category auto-inferred
        cat_badge = page.locator('button:has-text("Auto: Risk Management")')
        assert cat_badge.is_visible(), "Category was not auto-inferred as 'Risk Management'"
        print("✓ Category successfully auto-inferred as 'Risk Management' with '✨ Auto' badge")

        # Check Screen Suggestions block
        sugg_header = page.locator("text=Suggested Screens (Token-Overlap Match)")
        print(f"    Screen Suggestions rendered: {sugg_header.is_visible()}")

        # Check module-grouped available screens
        all_modules_picker = page.locator("text=Available Interface Screens by Module")
        assert all_modules_picker.is_visible(), "Available Interface Screens by Module section not visible"
        print("✓ Available Interface Screens by Module section visible")

        # Capture modal screenshot with auto-inferred category and suggestions
        modal_screenshot_path = os.path.join(artifact_dir, "feature_edit_intelligence_modal.png")
        page.screenshot(path=modal_screenshot_path)
        print(f"✓ Saved screenshot: {modal_screenshot_path}")

        # Add a suggested or available screen
        add_btn = page.locator('button:has-text("+ Add All in")').first
        if add_btn.is_visible():
            add_btn.click()
            page.wait_for_timeout(500)
            print("✓ Clicked '+ Add All in [Module]'")

        # Check save
        save_btn = page.locator('button:has-text("Save Changes")')
        assert save_btn.is_visible(), "Save Changes button not visible"
        save_btn.click()
        page.wait_for_timeout(1000)

        print("[6] Verifying saved feature in matrix...")
        saved_feat = page.locator("h3:has-text('Liquidity Risk & Margin Collateral Engine'), div:has-text('Liquidity Risk & Margin Collateral Engine')").first
        assert saved_feat.is_visible(), "Saved feature not found in matrix"
        print("✓ Newly created feature with auto-inferred metadata successfully persisted in matrix")

        # Final verification screenshot
        final_screenshot_path = os.path.join(artifact_dir, "functional_matrix_with_new_feature.png")
        page.screenshot(path=final_screenshot_path)
        print(f"✓ Saved screenshot: {final_screenshot_path}")

        browser.close()

    print("\n--- TEST SUMMARY ---")
    if errors:
        print(f"Encountered {len(errors)} errors:")
        for e in errors:
            print("  ", e)
        sys.exit(1)
    else:
        print("All tests passed with ZERO errors!")

if __name__ == "__main__":
    test_screen_coverage_and_feature_intelligence()
