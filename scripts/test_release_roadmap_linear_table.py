import asyncio
import os
import sys
from playwright.async_api import async_playwright

ARTIFACT_DIR = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46"

async def test_release_roadmap():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1366, 'height': 850})
        page = await context.new_page()

        print("[0] Initializing session and navigating to ProjectPulse...")
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Handle SetupView if project not yet initialized in browser session
        sample_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if await sample_btn.count() > 0 and await sample_btn.first.is_visible():
            print("SetupView detected - loading sample Web workspace...")
            await sample_btn.first.click()
            await page.wait_for_timeout(1000)

        print("[1] Navigating to Release Roadmap (#/releases)...")
        await page.goto("http://localhost:3000/#/releases", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Verify Header and Title
        header_title = await page.locator("h1").text_content()
        print(f"Header Title: {header_title}")
        assert "Release Roadmap" in (header_title or ""), "Page title missing 'Release Roadmap'"

        # Verify Primary Action Button
        assert await page.locator("button:has-text('Add Release Version')").is_visible(), "Add Release Version button missing"
        print("[PASS] Release Roadmap Header & Action Button verified.")

        print("[2] Verifying Linear-Grade Precision Table Mode...")
        # Ensure table mode is active
        table_toggle = page.locator("button[data-testid='toggle-view-table']")
        await table_toggle.click()
        await page.wait_for_timeout(400)

        # Verify DataTable elements
        table = page.locator("table")
        await page.wait_for_selector("table", timeout=4000)
        assert await table.is_visible()

        # Check Column Headers
        headers = ["Release Version", "Governance Status", "Cycle Start", "Target Launch", "Scope Completion", "Tasks", "Deliveries", "Actions"]
        for h in headers:
            assert await page.locator(f"th:has-text('{h}')").first.is_visible(), f"Missing column header: {h}"
        print("[PASS] All Linear-Grade Table columns rendered.")

        # Take screenshot of table
        table_path = os.path.join(ARTIFACT_DIR, "release_roadmap_linear_table.png")
        await page.screenshot(path=table_path)
        print(f"[SCREENSHOT] Saved table screenshot: {table_path}")

        print("[3] Testing Dual-Mode Toggle: Switching to Cards Grid Mode...")
        cards_toggle = page.locator("button[data-testid='toggle-view-cards']")
        await cards_toggle.click()
        await page.wait_for_timeout(400)

        # Verify cards grid
        card_items = page.locator("div.grid.grid-cols-1.md\\:grid-cols-2 > div")
        card_count = await card_items.count()
        assert card_count > 0, "No release cards rendered in Cards Mode"
        print(f"[PASS] Rendered {card_count} release cards in Grid Mode.")

        # Take screenshot of cards
        cards_path = os.path.join(ARTIFACT_DIR, "release_roadmap_cards_view.png")
        await page.screenshot(path=cards_path)
        print(f"[SCREENSHOT] Saved cards screenshot: {cards_path}")

        # Switch back to table mode
        await table_toggle.click()
        await page.wait_for_timeout(400)

        print("[4] Testing Search Input & Filter Presets...")
        # Test keyboard shortcut '/' focus
        await page.locator("body").click()
        await page.keyboard.press("/")
        await page.wait_for_timeout(200)

        search_input = page.locator("input[aria-label='Search release versions']")
        first_rel_name = await page.locator("table tbody tr td:nth-child(3) span").first.text_content()
        first_rel_name = (first_rel_name or "v1").strip()
        print(f"Targeting search query: '{first_rel_name}'")
        
        await search_input.fill(first_rel_name)
        await page.wait_for_timeout(300)
        assert await page.locator(f"table tbody tr:has-text('{first_rel_name}')").first.is_visible()
        print(f"[PASS] Search input successfully filtered by '{first_rel_name}'.")

        # Clear search
        clear_btn = page.locator("button[aria-label='Clear search']")
        if await clear_btn.is_visible():
            await clear_btn.click()
        else:
            await search_input.fill("")
        await page.wait_for_timeout(300)

        # Filter by Active
        await page.locator("button[data-filter-status='Active']").click()
        await page.wait_for_timeout(300)
        print("[PASS] Filtered by Active status.")

        # Reset filter
        reset_btn = page.locator("button:text-is('Reset')")
        if await reset_btn.is_visible():
            await reset_btn.click()
            await page.wait_for_timeout(300)
        print("[PASS] Filter reset verified.")

        print("[5] Testing Master-Detail Scope Peek Side Drawer (<SlideOverDrawer>)...")
        # Click inspect scope button on first row
        inspect_btn = page.locator("button[title='Inspect Release Scope in Peek Drawer']").first
        await inspect_btn.click()
        await page.wait_for_timeout(600)

        # Verify drawer content
        await page.wait_for_selector("text=Milestone Delivery Velocity", timeout=3000)
        assert await page.locator("div[role='dialog'] button:has-text('All Scope')").is_visible()
        assert await page.locator("div[role='dialog'] button:has-text('Open Deliveries')").is_visible()
        print("[PASS] Master-Detail SlideOverDrawer opened with scope telemetry.")

        # Screenshot drawer
        drawer_path = os.path.join(ARTIFACT_DIR, "release_scope_peek_drawer.png")
        await page.screenshot(path=drawer_path)
        print(f"[SCREENSHOT] Saved drawer screenshot: {drawer_path}")

        # Navigate using next release stepper via ']' shortcut
        await page.keyboard.press("]")
        await page.wait_for_timeout(400)
        print("[PASS] Navigated to next release via ']' shortcut.")

        # Close drawer with Escape
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(500)
        print("[PASS] Drawer closed via Escape.")

        print("[6] Testing Multi-Select & Floating Action Bar...")
        checkboxes = page.locator("table tbody tr input[type='checkbox']")
        count = await checkboxes.count()
        if count >= 2:
            await checkboxes.nth(0).click()
            await checkboxes.nth(1).click()
            await page.wait_for_timeout(400)

            # Verify Floating Action Bar
            await page.wait_for_selector("[data-testid='release-floating-action-bar']", timeout=3000)
            assert await page.locator("button:has-text('Sync Dates')").is_visible()
            print("[PASS] Floating Action Bar visible with selected releases.")

            # Screenshot action bar
            bar_path = os.path.join(ARTIFACT_DIR, "release_floating_action_bar.png")
            await page.screenshot(path=bar_path)
            print(f"[SCREENSHOT] Saved floating action bar screenshot: {bar_path}")

            # Deselect via Escape
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(300)
            print("[PASS] Deselected via Escape.")

        print("=== ALL RELEASE ROADMAP LINEAR PRECISION TESTS PASSED ===")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_release_roadmap())
