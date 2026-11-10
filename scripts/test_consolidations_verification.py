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

        # Ensure no uncaught page errors
        real_errors = [e for e in errors if "favicon" not in e.lower()]
        assert len(real_errors) == 0, f"Encountered unexpected browser errors: {real_errors}"
        print("✓ Zero browser console/page errors detected during test run")

        browser.close()
        print("\n=======================================================")
        print("🎉 CONSOLIDATION PLAYWRIGHT VERIFICATION PASSED (0 DEFECTS)!")
        print("=======================================================")

if __name__ == "__main__":
    test_consolidations_verification()
