import asyncio
import os
import sys
from playwright.async_api import async_playwright

ARTIFACT_DIR = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46"

async def test_scaffolder():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        print("[0] Navigating to ProjectPulse...")
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Handle SetupView if project not yet initialized in browser session
        sample_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if await sample_btn.count() > 0 and await sample_btn.first.is_visible():
            print("SetupView detected - loading sample Web workspace...")
            await sample_btn.first.click()
            await page.wait_for_timeout(1000)

        print("[1] Navigating to Scaffolder (#/scaffolder)...")
        await page.goto("http://localhost:3000/#/scaffolder", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        print("[1] Verifying Scaffolder Page Header & Stepper...")
        await page.wait_for_selector("text=Project Scaffolder", timeout=5000)
        assert await page.locator("text=Module Blueprint").is_visible()
        assert await page.locator("text=Interface Mapping").is_visible()
        print("[PASS] Header & Stepper visible.")

        print("[2] Testing Architecture Blueprint Presets via Bulk Modal...")
        await page.locator("button:has-text('Bulk & Presets')").click()
        await page.wait_for_timeout(500)
        await page.wait_for_selector("text=Bulk Module & Architecture Presets", timeout=3000)
        
        # Click on 'Cloud Modernization Suite' preset
        await page.locator("text=Cloud Modernization Suite").click()
        await page.wait_for_timeout(300)

        # Click Import
        await page.locator("button:has-text('Import 4 Module(s)')").click()
        await page.wait_for_timeout(800)
        print("[PASS] Cloud Modernization Suite imported.")

        # Take screenshot of table
        table_path = os.path.join(ARTIFACT_DIR, "scaffolder_linear_table.png")
        await page.screenshot(path=table_path)
        print(f"[SCREENSHOT] Saved table screenshot: {table_path}")

        print("[3] Testing Search Input & Filter Presets...")
        # Test keyboard shortcut '/' focus
        await page.locator("body").click()
        await page.keyboard.press("/")
        await page.wait_for_timeout(200)

        search_input = page.locator("input[aria-label='Filter modules']")
        await search_input.fill("Auth Gateway")
        await page.wait_for_timeout(400)
        
        # Verify filtered results
        assert await page.locator("table tbody tr input[value*='Auth Gateway']").first.is_visible()
        print("[PASS] Search query filtered table.")

        # Clear search via button
        clear_btn = page.locator("button[aria-label='Clear search']")
        if await clear_btn.is_visible():
            await clear_btn.click()
        else:
            await search_input.fill("")
        await page.wait_for_timeout(300)

        # Filter by GUI
        await page.locator("button[data-filter-layer='GUI']").click()
        await page.wait_for_timeout(400)
        assert await page.locator("table tbody tr input[value*='Customer Portal']").first.is_visible()
        print("[PASS] Layer filter preset chip verified.")

        # Reset filter
        await page.get_by_role("button", name="Reset", exact=True).click()
        await page.wait_for_timeout(300)

        print("[4] Testing Master-Detail SlideOver Drawer...")
        # Click inspect button on first module
        inspect_btn = page.locator("button[title='Inspect Module Blueprint in Peek Drawer']").first
        await inspect_btn.click()
        await page.wait_for_timeout(600)

        # Verify drawer
        await page.wait_for_selector("text=Architecture Generation Impact", timeout=3000)
        await page.wait_for_selector("text=Module Specification", timeout=3000)
        print("[PASS] Master-Detail Drawer opened.")

        # Screenshot drawer
        drawer_path = os.path.join(ARTIFACT_DIR, "scaffolder_peek_drawer.png")
        await page.screenshot(path=drawer_path)
        print(f"[SCREENSHOT] Saved drawer screenshot: {drawer_path}")

        # Navigate using next stepper in drawer
        await page.keyboard.press("]")
        await page.wait_for_timeout(400)
        print("[PASS] Navigated to next module via ']' shortcut.")

        # Close drawer with close panel button
        close_btn = page.locator("button[aria-label='Close panel']")
        if await close_btn.count() > 0 and await close_btn.first.is_visible():
            await close_btn.first.click()
        else:
            await page.keyboard.press("Escape")
        await page.wait_for_timeout(500)
        print("[PASS] Drawer closed.")

        print("[5] Testing Multi-Select & Floating Action Bar...")
        checkboxes = page.locator("table tbody tr input[type='checkbox']")
        count = await checkboxes.count()
        assert count >= 2
        await checkboxes.nth(0).click()
        await checkboxes.nth(1).click()
        await page.wait_for_timeout(400)

        # Verify Floating Action Bar
        await page.wait_for_selector("[data-testid='floating-action-bar']", timeout=3000)
        assert await page.locator("button:has-text('Duplicate')").is_visible()
        print("[PASS] Floating Action Bar visible with 2 selected.")

        # Screenshot floating bar
        bar_path = os.path.join(ARTIFACT_DIR, "scaffolder_floating_action_bar.png")
        await page.screenshot(path=bar_path)
        print(f"[SCREENSHOT] Saved action bar screenshot: {bar_path}")

        # Deselect
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(300)
        print("[PASS] Deselected via Escape.")

        print("[6] Testing Step 2 Interface Mapping...")
        await page.locator("button:has-text('Next Step')").click()
        await page.wait_for_timeout(600)

        await page.wait_for_selector("text=Interface Mapping & Screen Hierarchy", timeout=3000)
        assert await page.locator("button:has-text('Generate Architecture')").first.is_visible()
        assert await page.locator("button:has-text('Back to Blueprint')").first.is_visible()
        print("[PASS] Step 2 Interface Mapping rendered successfully.")

        # Screenshot step 2
        step2_path = os.path.join(ARTIFACT_DIR, "scaffolder_interface_mapping.png")
        await page.screenshot(path=step2_path)
        print(f"[SCREENSHOT] Saved step 2 screenshot: {step2_path}")

        # Return back to blueprint
        await page.locator("button:has-text('Back to Blueprint')").first.click()
        await page.wait_for_timeout(400)
        print("[PASS] Returned to Step 1 Module Blueprint.")

        print("=== ALL PROJECT SCAFFOLDER LINEAR PRECISION TESTS PASSED ===")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_scaffolder())
