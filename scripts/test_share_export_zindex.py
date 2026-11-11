import asyncio
import os
import sys
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:3000"
ARTIFACTS_DIR = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46"

async def test_share_export_zindex():
    print("=== TESTING SHARE & EXPORT DROPDOWN Z-INDEX OVER TABLE HEADERS ===")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # Step 0: Initial navigation
        await page.goto(BASE_URL, wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Handle SetupView if project not yet initialized
        sample_btn = page.get_by_role("button", name="Load Demo Database")
        if await sample_btn.is_visible():
            print("SetupView detected - loading sample database...")
            await sample_btn.click()
            await page.wait_for_timeout(1500)

        # Step 1: Go to #/tasks
        print("[1] Navigating to #/tasks...")
        tasks_nav = page.locator("aside button:has-text('Tasks & Timeline')").first
        if await tasks_nav.is_visible():
            await tasks_nav.click()
        else:
            await page.goto(f"{BASE_URL}/#/tasks", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Find and click 'Share & Export' button
        share_btn = page.locator("button[aria-label='Share and export data']")
        assert await share_btn.is_visible(), "Share & Export button should be visible"
        await share_btn.click()
        await page.wait_for_timeout(500)

        # Verify dropdown menu is open
        dropdown = page.locator("div[role='menu']")
        assert await dropdown.is_visible(), "Dropdown menu should be visible after clicking"

        # Check key items that were previously covered by table header
        print_btn = page.get_by_role("menuitem", name="Print / Save as PDF")
        email_btn = page.get_by_role("menuitem", name="Share via Email Draft")
        excel_btn = page.get_by_role("menuitem", name="Export Tasks (.xlsx)")

        assert await print_btn.is_visible(), "'Print / Save as PDF' item should be visible"
        assert await email_btn.is_visible(), "'Share via Email Draft' item should be visible"
        assert await excel_btn.is_visible(), "'Export Tasks (.xlsx)' item should be visible"

        # Check what element is at the center of the print button
        print_box = await print_btn.bounding_box()
        assert print_box is not None, "Bounding box of print button should not be None"
        
        elem_at_point = await page.evaluate(
            """({x, y}) => {
                const el = document.elementFromPoint(x, y);
                return el ? el.innerText || el.tagName : null;
            }""",
            {"x": print_box["x"] + print_box["width"] / 2, "y": print_box["y"] + print_box["height"] / 2}
        )
        print(f"Element at point ({print_box['x'] + print_box['width']/2}, {print_box['y'] + print_box['height']/2}): {elem_at_point}")
        assert "Print" in (elem_at_point or "") or "PDF" in (elem_at_point or "") or "Printer" in (elem_at_point or ""), f"Dropdown item must be the topmost element! Found: {elem_at_point}"
        print("[PASS] Dropdown item 'Print / Save as PDF' is top-most and NOT obscured by table header!")

        # Take screenshot of the open dropdown
        screenshot_path = os.path.join(ARTIFACTS_DIR, "share_export_dropdown_fixed.png")
        await page.screenshot(path=screenshot_path, full_page=False)
        print(f"[SCREENSHOT] Saved screenshot to: {screenshot_path}")

        # Close Share & Export dropdown and verify separate ViewExportButton is NOT present
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(300)

        separate_export = page.locator("button:has-text('Export Tasks')")
        assert not await separate_export.is_visible(), "Separate 'Export Tasks' button must NOT be present!"
        print("[PASS] Verified no separate Export Tasks button on tasks screen!")

        # Step 2: Test on #/defects as well
        print("[2] Navigating to #/defects and testing dropdown...")
        defects_nav = page.get_by_role("button", name="Defects").first
        if await defects_nav.is_visible():
            await defects_nav.click()
        else:
            await page.goto(f"{BASE_URL}/#/defects", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        share_btn_def = page.locator("button[aria-label='Share and export data']")
        assert await share_btn_def.is_visible()
        await share_btn_def.click()
        await page.wait_for_timeout(500)

        def_print_btn = page.get_by_role("menuitem", name="Print / Save as PDF")
        assert await def_print_btn.is_visible()
        def_print_box = await def_print_btn.bounding_box()
        def_elem = await page.evaluate(
            """({x, y}) => {
                const el = document.elementFromPoint(x, y);
                return el ? el.innerText || el.tagName : null;
            }""",
            {"x": def_print_box["x"] + def_print_box["width"] / 2, "y": def_print_box["y"] + def_print_box["height"] / 2}
        )
        print(f"Defects element at point: {def_elem}")
        assert "Print" in (def_elem or "") or "PDF" in (def_elem or "") or "Printer" in (def_elem or "")
        print("[PASS] Defects Share & Export dropdown is top-most and NOT obscured!")

        await browser.close()
        print("=== ALL SHARE & EXPORT Z-INDEX TESTS PASSED! ===")

if __name__ == "__main__":
    asyncio.run(test_share_export_zindex())
