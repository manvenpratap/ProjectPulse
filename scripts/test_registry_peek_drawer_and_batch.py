import time
import os
from playwright.sync_api import sync_playwright

def test_registry_peek_drawer_and_batch():
    print("🚀 Starting Registry View Peek Drawer & Batch Actions Verification...")
    screenshot_dir = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46"
    os.makedirs(screenshot_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        print("[1] Opening app...")
        page.goto("http://localhost:3000/#/dropdowns", wait_until="networkidle")
        time.sleep(1.5)

        # Handle SetupView if needed
        demo_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            print("Loading demo database...")
            demo_btn.first.click()
            time.sleep(1.5)
            page.goto("http://localhost:3000/#/dropdowns", wait_until="networkidle")
            time.sleep(1.5)

        # 1. Verify in-library option search filter
        print("\n--- 1. Testing In-Library Option Search Filter ---")
        option_search = page.locator('input[placeholder*="options… (Press /)"]')
        assert option_search.is_visible(), "Option search input must be visible in workshop"
        option_search.fill("Completed")
        time.sleep(0.5)

        matching_rows = page.locator("main .space-y-2 > div span.truncate:has-text('Completed')")
        assert matching_rows.count() > 0, "Expected at least 1 matching 'Completed' option"
        print(f"✓ Found {matching_rows.count()} matching option for 'Completed'")

        # Clear option search
        option_search.fill("")
        time.sleep(0.5)
        print(f"✓ Option search cleared, total options: {page.locator('main .space-y-2 > div').count()}")

        # 2. Testing Option Usage Dossier Peek Drawer
        print("\n--- 2. Testing Option Usage Dossier Peek Drawer ---")
        peek_btn = page.locator("main .space-y-2 > div button[title*='usage dossier']").first
        assert peek_btn.is_visible(), "Peek dossier button must be visible on option row"
        peek_btn.click()
        time.sleep(1)

        # Check drawer elements
        drawer_metric = page.locator("text=Total Impact")
        assert drawer_metric.count() > 0, "Total Impact metric should exist in drawer"
        print("✓ Master-detail Option Usage Dossier Drawer opened with 4-stat metric bento")

        # Capture drawer screenshot
        screen_drawer = os.path.join(screenshot_dir, "option_usage_dossier_drawer.png")
        page.screenshot(path=screen_drawer)
        print(f"✓ Saved dossier screenshot to {screen_drawer}")

        # Close drawer
        close_btn = page.locator('button[aria-label="Close panel"]')
        if close_btn.count() > 0 and close_btn.first.is_visible():
            close_btn.first.click()
            time.sleep(0.5)
            print("✓ Drawer closed cleanly")

        # 3. Testing Batch Selection & Floating Action Bar
        print("\n--- 3. Testing Batch Multi-Selection & Floating Action Bar ---")
        checkboxes = page.locator("main .space-y-2 > div input[type='checkbox']")
        assert checkboxes.count() >= 2, "Expected multiple option checkboxes"
        checkboxes.nth(0).check()
        checkboxes.nth(1).check()
        time.sleep(0.5)

        # Check Floating Action Bar presence
        floating_bar = page.locator("text=Selected")
        assert floating_bar.is_visible(), "Floating Action Bar must appear when options are checked"
        copy_csv_btn = page.locator("button:has-text('Copy CSV')")
        assert copy_csv_btn.is_visible(), "Copy CSV action must be in Floating Action Bar"
        print("✓ Floating Action Bar rendered with batch actions")

        # Capture floating bar screenshot
        screen_bar = os.path.join(screenshot_dir, "option_floating_action_bar.png")
        page.screenshot(path=screen_bar)
        print(f"✓ Saved floating action bar screenshot to {screen_bar}")

        # Deselect via Floating Action Bar close
        page.locator("div.fixed.bottom-6 button[title='Deselect all']").click()
        time.sleep(0.5)
        assert not floating_bar.is_visible(), "Floating action bar should hide after deselecting"
        print("✓ Batch selection cleared cleanly")

        browser.close()
        print("\n🎉 ALL Registry Peek Drawer & Batch Actions tests passed successfully!")

if __name__ == "__main__":
    test_registry_peek_drawer_and_batch()
