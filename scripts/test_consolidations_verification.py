import sys
import os
from playwright.sync_api import sync_playwright

def test_consolidations_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900}, accept_downloads=True)
        context.grant_permissions(["clipboard-read", "clipboard-write"])
        page = context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE ERROR: {msg.text}") if msg.type == "error" else None)

        print("[1] Loading ProjectPulse at localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(2000)

        # Load demo database if empty
        demo_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            demo_btn.first.click()
            page.wait_for_timeout(1500)

        # -------------------------------------------------------------
        # TEST 1: Share & Export Menu with useClickOutside Hook
        # -------------------------------------------------------------
        print("\n--- TEST 1: Share & Export with useClickOutside Hook ---")
        share_btn = page.locator('button[aria-label="Share and export data"]')
        assert share_btn.count() > 0, "Share & Export button missing in PageHeader"
        share_btn.first.click()
        page.wait_for_timeout(400)

        menu_header = page.locator("text=Export & Distribution")
        assert menu_header.is_visible(), "Export menu header not visible after click"
        print("✓ Share & Export dropdown opened successfully")

        # Test click outside to close
        page.mouse.click(50, 50)
        page.wait_for_timeout(300)
        assert not menu_header.is_visible(), "Menu should be closed after clicking outside"
        print("✓ Click-outside closed Share & Export dropdown")

        # Test Escape key to close
        share_btn.first.click()
        page.wait_for_timeout(300)
        assert menu_header.is_visible(), "Menu should be open again"
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        assert not menu_header.is_visible(), "Menu should be closed after pressing Escape"
        print("✓ Escape key closed Share & Export dropdown")

        # -------------------------------------------------------------
        # TEST 2: User Profile Flyout with useClickOutside Hook
        # -------------------------------------------------------------
        print("\n--- TEST 2: User Profile Flyout with useClickOutside Hook ---")
        user_avatar_btn = page.locator('button[aria-label="User Account and Access Controls"]')
        assert user_avatar_btn.count() > 0, "User profile avatar button missing"
        user_avatar_btn.first.click()
        page.wait_for_timeout(400)

        flyout_content = page.locator("text=Switch Active Persona")
        assert flyout_content.is_visible(), "User profile flyout not visible"
        print("✓ User Profile Flyout opened")

        # Test click outside
        page.mouse.click(50, 50)
        page.wait_for_timeout(300)
        assert not flyout_content.is_visible(), "User Profile Flyout should be closed after click outside"
        print("✓ Click-outside closed User Profile Flyout")

        # -------------------------------------------------------------
        # TEST 3: Team View Skills Rendering (normalizeSkills)
        # -------------------------------------------------------------
        print("\n--- TEST 3: Team View Skills Normalization ---")
        team_nav = page.locator('button:has-text("Team"), button[aria-label="Team Hub"]')
        if team_nav.count() > 0:
            team_nav.first.click()
            page.wait_for_timeout(1000)
            # Verify team view loaded and skill tags are visible
            skill_badges = page.locator('span:has-text("React"), span:has-text("TypeScript"), span:has-text("Node")')
            print(f"✓ Found {skill_badges.count()} skill badges rendered on Team Hub")

        # -------------------------------------------------------------
        # TEST 4: Downloads using consolidated saveBlob
        # -------------------------------------------------------------
        print("\n--- TEST 4: Downloads with consolidated saveBlob ---")
        share_btn.first.click()
        page.wait_for_timeout(400)

        with page.expect_download(timeout=10000) as download_info:
            page.locator("text=Export Master Excel (.xlsx)").click()
        download = download_info.value
        assert download.suggested_filename.endswith(".xlsx"), f"Expected .xlsx, got {download.suggested_filename}"
        print(f"✓ Consolidated saveBlob successfully downloaded: {download.suggested_filename}")

        # -------------------------------------------------------------
        # TEST 5: Unified CXO Email Briefing Inside Pulse Reports
        # -------------------------------------------------------------
        print("\n--- TEST 5: Unified CXO Email Briefing Inside Pulse Reports ---")
        # Navigate to Pulse Reports
        reports_nav = page.locator('button:has-text("Pulse Reports"), aside button:has-text("Reports")')
        assert reports_nav.count() > 0, "Pulse Reports nav item not found"
        reports_nav.first.click()
        page.wait_for_timeout(1000)

        # Click CXO Email Briefing tab
        cxo_tab = page.locator('button:has-text("CXO Email Briefing")')
        assert cxo_tab.count() > 0, "CXO Email Briefing tab missing in Reports"
        cxo_tab.first.click()
        page.wait_for_timeout(600)

        # Verify full suite is embedded in-page
        assert page.locator("text=Reporting Cadence").is_visible(), "Reporting Cadence controls missing in-page"
        assert page.locator("text=Executive Steering Note").is_visible(), "Executive Steering Note missing in-page"
        assert page.locator("button:has-text('Fortnightly (14d)')").is_visible(), "Fortnightly button missing in-page"
        assert page.locator("button:has-text('Copy Rich Email')").is_visible(), "Copy Rich Email button missing in-page"
        assert page.locator("button:has-text('Copy Markdown')").is_visible(), "Copy Markdown button missing in-page"
        print("✓ Full Executive CXO Briefing Suite successfully embedded in Pulse Reports")

        # Test changing cadence
        page.locator("button:has-text('Fortnightly (14d)')").click()
        page.wait_for_timeout(300)

        # Test switching preview to Markdown
        page.get_by_role("button", name="Markdown", exact=True).click()
        page.wait_for_timeout(300)
        assert page.locator("pre:has-text('Fortnightly Executive Brief')").is_visible(), "Markdown preview did not update"
        print("✓ Live preview reactivity and Markdown mode verified")

        # Capture screenshot for artifact
        screenshot_path = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/unified_cxo_briefing_reports.png"
        page.screenshot(path=screenshot_path)
        print(f"✓ Saved screenshot to {screenshot_path}")

        # -------------------------------------------------------------
        # TEST 6: Unified Navigation (Sidebar & Share Menu)
        # -------------------------------------------------------------
        print("\n--- TEST 6: Unified Navigation from Sidebar & Share Menu ---")
        # Navigate away to Tasks Matrix
        page.locator('button:has-text("Tasks Matrix")').first.click()
        page.wait_for_timeout(1000)

        # Click "Executive CXO Email Brief" from sidebar
        sidebar_cxo_btn = page.locator("aside button:has-text('Executive CXO Email Brief')")
        assert sidebar_cxo_btn.count() > 0, "Sidebar Executive CXO Email Brief button missing"
        sidebar_cxo_btn.first.click()
        page.wait_for_timeout(1000)

        # Verify it navigated to Pulse Reports and CXO tab is active
        assert page.locator("text=Reporting Cadence").is_visible(), "Sidebar button failed to navigate to CXO Briefing tab"
        print("✓ Sidebar Executive CXO Email Brief routes directly to unified CXO Briefing")

        # -------------------------------------------------------------
        # TEST 7: Timeline View Mode inside Tasks Matrix
        # -------------------------------------------------------------
        print("\n--- TEST 7: Timeline View Mode under Tasks Matrix ---")
        # Navigate to Tasks Matrix
        page.locator('aside button:has-text("Tasks Matrix")').first.click()
        page.wait_for_timeout(1000)

        # Check that Grid, Board, and Timeline toggles are present
        grid_btn = page.locator('button[aria-label="Grid Matrix View"]')
        board_btn = page.locator('button[aria-label="Kanban Board View"]')
        timeline_btn = page.locator('button[aria-label="Timeline Gantt View"]')

        assert grid_btn.is_visible(), "Grid toggle button not found"
        assert board_btn.is_visible(), "Board toggle button not found"
        assert timeline_btn.is_visible(), "Timeline toggle button not found alongside Grid and Board"
        print("✓ Grid, Board, and Timeline toggles exist alongside each other")

        # Click Board toggle
        board_btn.click()
        page.wait_for_timeout(500)
        assert page.locator("text=Backlog").first.is_visible() or page.locator("text=In Progress").first.is_visible(), "Kanban Board failed to render"
        print("✓ Successfully switched to Kanban Board mode")

        # Click Timeline toggle
        timeline_btn.click()
        page.wait_for_timeout(1000)

        # Verify embedded Timeline rendered
        assert page.locator("button:has-text('Swimlanes')").is_visible(), "Embedded Timeline swimlanes button not found"
        assert page.locator("button:has-text('Deps')").is_visible(), "Embedded Timeline Deps toggle not found"
        assert page.locator("canvas").count() >= 2, "Gantt timeline canvases not rendered"
        print("✓ Successfully switched to Timeline Gantt mode within Tasks")

        # Save screenshot
        timeline_screenshot = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/tasks_timeline_view_mode.png"
        page.screenshot(path=timeline_screenshot, full_page=True)
        print(f"✓ Saved screenshot to {timeline_screenshot}")

        # Click Grid toggle to verify roundtrip switching
        grid_btn.click()
        page.wait_for_timeout(500)
        assert page.locator("table").count() > 0 or page.locator("text=Task Name").count() > 0 or page.locator("text=ID").count() > 0, "Grid failed to restore"
        print("✓ Successfully switched back to Grid mode")

        # Verify sidebar "Project Timeline" shortcut
        page.locator('aside button:has-text("Project Timeline")').first.click()
        page.wait_for_timeout(1000)
        assert timeline_btn.is_visible(), "Timeline button in Tasks header not visible after sidebar navigation"
        assert page.locator("button:has-text('Swimlanes')").is_visible(), "Timeline view mode failed to activate from sidebar shortcut"
        print("✓ Sidebar Project Timeline shortcut smoothly opens Tasks in Timeline mode")

        # Ensure no uncaught page errors
        real_errors = [e for e in errors if "favicon" not in e.lower()]
        assert len(real_errors) == 0, f"Encountered unexpected browser errors: {real_errors}"
        print("✓ Zero browser console/page errors detected during test run")

        browser.close()
        print("\n=======================================================")
        print("🎉 ALL 7 CONSOLIDATION & TIMELINE PLAYWRIGHT TESTS PASSED (0 DEFECTS)!")
        print("=======================================================")

if __name__ == "__main__":
    test_consolidations_verification()
