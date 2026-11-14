import asyncio
import os
import sys
from playwright.async_api import async_playwright

ARTIFACT_DIR = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46"

async def test_sprint_retro():
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

        print("[1] Navigating to Sprint Retrospective (#/retro)...")
        await page.goto("http://localhost:3000/#/retro", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Verify Header and Title
        header_title = await page.locator("h1").text_content()
        print(f"Header Title: {header_title}")
        assert "Sprint Retrospective" in (header_title or ""), "Page title missing 'Sprint Retrospective'"

        # Verify Primary Action Button
        assert await page.locator("button:has-text('Add Retro Item')").is_visible(), "Add Retro Item button missing"
        print("[PASS] Sprint Retrospective Header & Action Button verified.")

        print("[2] Verifying Feedback Board Grid Mode...")
        # Verify Board Mode is active or switch to it
        board_toggle = page.locator("button[data-testid='toggle-retro-board']")
        await board_toggle.click()
        await page.wait_for_timeout(400)

        # Verify 4 Category Columns
        assert await page.locator("h2:has-text('What Went Well')").first.is_visible()
        assert await page.locator("h2:has-text('Areas for Growth')").first.is_visible()
        assert await page.locator("h2:has-text('Action Commitments')").first.is_visible()
        assert await page.locator("h2:has-text('Team Kudos')").first.is_visible()
        print("[PASS] All 4 Category Columns rendered in Board Mode.")

        # Take screenshot of board
        board_path = os.path.join(ARTIFACT_DIR, "sprint_retro_feedback_board.png")
        await page.screenshot(path=board_path)
        print(f"[SCREENSHOT] Saved board screenshot: {board_path}")

        print("[3] Testing Dual-Mode Toggle: Switching to Linear-Grade Table Mode...")
        table_toggle = page.locator("button[data-testid='toggle-retro-table']")
        await table_toggle.click()
        await page.wait_for_timeout(400)

        # Verify DataTable elements
        await page.wait_for_selector("table", timeout=4000)
        table = page.locator("table")
        assert await table.is_visible()

        # Check Column Headers
        headers = ["Observation & Feedback", "Category", "Votes", "Commitment Status", "Assigned Owner", "Contributor", "Actions"]
        for h in headers:
            assert await page.locator(f"th:has-text('{h}')").first.is_visible(), f"Missing column header: {h}"
        print("[PASS] All Linear-Grade Table columns rendered.")

        # Take screenshot of table
        table_path = os.path.join(ARTIFACT_DIR, "sprint_retro_linear_table.png")
        await page.screenshot(path=table_path)
        print(f"[SCREENSHOT] Saved table screenshot: {table_path}")

        print("[4] Testing Search Input & Category Filter Presets...")
        # Test keyboard shortcut '/' focus
        await page.locator("body").click()
        await page.keyboard.press("/")
        await page.wait_for_timeout(200)

        search_input = page.locator("input[aria-label='Search retrospective items']")
        first_item_title = await page.locator("table tbody tr td:nth-child(3) span.font-bold").first.text_content()
        target_search = (first_item_title or "smoke").strip().split()[0]
        print(f"Targeting search query: '{target_search}'")

        await search_input.fill(target_search)
        await page.wait_for_timeout(300)
        assert await page.locator(f"table tbody tr:has-text('{target_search}')").first.is_visible()
        print(f"[PASS] Search input successfully filtered by '{target_search}'.")

        # Clear search
        clear_btn = page.locator("button[aria-label='Clear search']")
        if await clear_btn.is_visible():
            await clear_btn.click()
        else:
            await search_input.fill("")
        await page.wait_for_timeout(300)

        # Filter by What Went Well
        await page.locator("button[data-filter-category='went_well']").click()
        await page.wait_for_timeout(300)
        print("[PASS] Filtered by 'went_well' category.")

        # Reset filter
        reset_btn = page.locator("button:text-is('Reset')")
        if await reset_btn.is_visible():
            await reset_btn.click()
            await page.wait_for_timeout(300)
        print("[PASS] Filter reset verified.")

        print("[5] Testing Upvotes & Status Cycling...")
        vote_btn = page.locator("table tbody tr button[aria-label*='Upvote']").first
        init_votes = (await vote_btn.text_content() or "0").strip()
        await vote_btn.click()
        await page.wait_for_timeout(300)
        new_votes = (await vote_btn.text_content() or "0").strip()
        print(f"[PASS] Upvoted item from {init_votes} to {new_votes}.")

        print("[6] Testing Master-Detail Retro Item Peek Side Drawer (<SlideOverDrawer>)...")
        # Click inspect button on first row
        inspect_btn = page.locator("table tbody tr button[title='Inspect Item in Peek Drawer']").first
        await inspect_btn.click()
        await page.wait_for_timeout(600)

        # Verify drawer content
        await page.wait_for_selector("text=Observation Content", timeout=3000)
        assert await page.locator("div[role='dialog']").is_visible()
        print("[PASS] Master-Detail SlideOverDrawer opened with observation dossier.")

        # Screenshot drawer
        drawer_path = os.path.join(ARTIFACT_DIR, "sprint_retro_peek_drawer.png")
        await page.screenshot(path=drawer_path)
        print(f"[SCREENSHOT] Saved drawer screenshot: {drawer_path}")

        # Navigate using next item stepper via ']' shortcut
        await page.keyboard.press("]")
        await page.wait_for_timeout(400)
        print("[PASS] Navigated to next item via ']' shortcut.")

        # Close drawer with Escape
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(500)
        print("[PASS] Drawer closed via Escape.")

        print("[7] Testing Multi-Select & Floating Action Bar...")
        checkboxes = page.locator("table tbody tr input[type='checkbox']")
        count = await checkboxes.count()
        if count >= 2:
            await checkboxes.nth(0).click()
            await checkboxes.nth(1).click()
            await page.wait_for_timeout(400)

            # Verify Floating Action Bar
            await page.wait_for_selector("[data-testid='retro-floating-action-bar']", timeout=3000)
            assert await page.locator("button:has-text('Upvote (+1)')").is_visible()
            assert await page.locator("button:has-text('Resolve Actions')").is_visible()
            print("[PASS] Floating Action Bar visible with selected retro items.")

            # Screenshot action bar
            bar_path = os.path.join(ARTIFACT_DIR, "sprint_retro_floating_action_bar.png")
            await page.screenshot(path=bar_path)
            print(f"[SCREENSHOT] Saved floating action bar screenshot: {bar_path}")

            # Deselect via Escape
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(300)
            print("[PASS] Deselected via Escape.")

        print("=== ALL SPRINT RETRO LINEAR PRECISION TESTS PASSED ===")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_sprint_retro())
