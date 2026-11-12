import asyncio
import os
import sys
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:3000"
ARTIFACTS_DIR = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46"

async def run_tests():
    print("=== STARTING FIELD ARCHITECT ENHANCED VERIFICATION ===")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # Step 0: Initial navigation and handle setup/login if needed
        print("[0] Initializing session...")
        await page.goto(BASE_URL, wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Handle SetupView if project not yet initialized in browser session
        sample_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if await sample_btn.count() > 0 and await sample_btn.first.is_visible():
            print("SetupView detected - loading sample Web workspace...")
            await sample_btn.first.click()
            await page.wait_for_timeout(1000)

        # Step 1: Navigate to Field Architect (#/fields)
        print("[1] Navigating to Field Architect (#/fields)...")
        await page.goto(f"{BASE_URL}/#/fields", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Check for title
        header_title = await page.locator("h1").text_content()
        print(f"Header Title: {header_title}")
        assert "Field Architect" in (header_title or ""), f"Page title does not contain 'Field Architect': {header_title}"

        # Verify domain pill switchers
        tasks_tab = page.get_by_role("button", name="TASKS", exact=True)
        defects_tab = page.get_by_role("button", name="DEFECTS", exact=True)
        deliveries_tab = page.get_by_role("button", name="DELIVERIES", exact=True)

        assert await tasks_tab.is_visible(), "Tasks domain button missing"
        assert await defects_tab.is_visible(), "Defects domain button missing"
        assert await deliveries_tab.is_visible(), "Deliveries domain button missing"
        print("[PASS] Domain pill switcher buttons are visible.")

        # Capture screenshot of Field Architect initial view
        fa_screenshot = os.path.join(ARTIFACTS_DIR, "field_architect_overview.png")
        await page.screenshot(path=fa_screenshot, full_page=False)
        print(f"[SCREENSHOT] Saved Field Architect overview to: {fa_screenshot}")

        # Step 2: Test modifying an existing System Field Label in Tasks
        print("[2] Modifying standard field label in Tasks schema...")
        name_input = page.locator("input[value='TASK NAME & CHECKLIST']")
        assert await name_input.is_visible(), "Standard column label input for TASK NAME & CHECKLIST not found"
        
        await name_input.fill("WORK ITEM TITLE")
        await page.wait_for_timeout(500)
        print("[PASS] Updated 'TASK NAME & CHECKLIST' to 'WORK ITEM TITLE'")

        # Step 3: Navigate to Tasks Grid (#/tasks) and verify live table synchronization
        print("[3] Navigating to #/tasks to verify header reflects 'WORK ITEM TITLE'...")
        await page.goto(f"{BASE_URL}/#/tasks", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        tasks_header = page.locator("th:has-text('WORK ITEM TITLE')")
        assert await tasks_header.is_visible(), "Table header 'WORK ITEM TITLE' not visible in Tasks Matrix!"
        print("[PASS] Tasks Matrix header correctly updated to 'WORK ITEM TITLE'!")

        # Step 4: Test Defect schema customization
        print("[4] Navigating back to Field Architect and switching to DEFECTS domain...")
        await page.goto(f"{BASE_URL}/#/fields", wait_until="networkidle")
        await page.wait_for_timeout(500)
        
        await page.get_by_role("button", name="DEFECTS", exact=True).click()
        await page.wait_for_timeout(500)

        # In Defects, find SEVERITY label and change to 'IMPACT TIER'
        sev_input = page.locator("input[value='SEVERITY']")
        assert await sev_input.is_visible(), "Standard column label input for SEVERITY not found"
        await sev_input.fill("IMPACT TIER")
        await page.wait_for_timeout(500)
        print("[PASS] Updated Defects 'SEVERITY' label to 'IMPACT TIER'")

        # Navigate to Defects Matrix (#/defects) and verify header
        print("[5] Navigating to #/defects to verify header reflects 'IMPACT TIER'...")
        await page.goto(f"{BASE_URL}/#/defects", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        defects_header = page.locator("th:has-text('IMPACT TIER')")
        assert await defects_header.is_visible(), "Table header 'IMPACT TIER' not visible in Defects Matrix!"
        print("[PASS] Defects Matrix header correctly updated to 'IMPACT TIER'!")

        defects_screenshot = os.path.join(ARTIFACTS_DIR, "defects_custom_header.png")
        await page.screenshot(path=defects_screenshot, full_page=False)
        print(f"[SCREENSHOT] Saved Defects custom header to: {defects_screenshot}")

        # Step 5: Test Deliveries schema customization
        print("[6] Navigating back to Field Architect and switching to DELIVERIES domain...")
        await page.goto(f"{BASE_URL}/#/fields", wait_until="networkidle")
        await page.wait_for_timeout(500)

        await page.get_by_role("button", name="DELIVERIES", exact=True).click()
        await page.wait_for_timeout(500)

        alm_input = page.locator("input[value='DEFECT ID - ALM ID']")
        if not await alm_input.is_visible():
            alm_input = page.locator("input[value='ALM ID / PDN']")
        assert await alm_input.is_visible(), "Standard column label input for ALM ID not found"
        await alm_input.fill("TRACKING IDENTIFIER")
        await page.wait_for_timeout(500)
        print("[PASS] Updated Deliveries ALM ID label to 'TRACKING IDENTIFIER'")

        print("[7] Navigating to #/deliveries to verify header reflects 'TRACKING IDENTIFIER'...")
        await page.goto(f"{BASE_URL}/#/deliveries", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        deliveries_header = page.locator("th:has-text('TRACKING IDENTIFIER')")
        assert await deliveries_header.is_visible(), "Table header 'TRACKING IDENTIFIER' not visible in Deliveries View!"
        print("[PASS] Deliveries View header correctly updated to 'TRACKING IDENTIFIER'!")

        # Step 6: Test Custom Field addition in Field Architect
        print("[8] Adding a proprietary Custom Field via modal...")
        await page.goto(f"{BASE_URL}/#/fields", wait_until="networkidle")
        await page.wait_for_timeout(500)
        await page.get_by_role("button", name="TASKS", exact=True).click()
        await page.wait_for_timeout(500)

        # Click 'Add Field' button
        await page.locator("button:has-text('Add Field')").first.click()
        await page.wait_for_timeout(500)

        # Fill modal inputs
        name_field = page.locator("input[placeholder='e.g. Security Classification, Client Contract ID']")
        await name_field.fill("Client Signoff")
        
        # Select Checkbox type
        await page.locator("select").first.select_option("checkbox")
        await page.wait_for_timeout(300)

        # Save field
        await page.locator("button:has-text('Create Attribute')").click()
        await page.wait_for_timeout(500)

        # Verify custom field appears in list
        custom_card = page.locator("h4:has-text('Client Signoff')")
        assert await custom_card.is_visible(), "Custom field 'Client Signoff' card not visible in Field Architect!"
        print("[PASS] Custom field 'Client Signoff' card created and visible in Field Architect!")

        # Verify column appears in Tasks Grid
        await page.goto(f"{BASE_URL}/#/tasks", wait_until="networkidle")
        await page.wait_for_timeout(1000)

        custom_col_header = page.locator("th:has-text('CLIENT SIGNOFF')")
        assert await custom_col_header.is_visible(), "Custom field column header 'CLIENT SIGNOFF' not visible in Tasks Grid!"
        print("[PASS] Custom field column 'CLIENT SIGNOFF' dynamically rendered in Tasks Grid!")

        # Step 7: Reset Defaults + Undo Toast test
        print("[9] Testing 'Reset Defaults' & Undo restoration...")
        await page.goto(f"{BASE_URL}/#/fields", wait_until="networkidle")
        await page.wait_for_timeout(500)
        await page.get_by_role("button", name="TASKS", exact=True).click()
        await page.wait_for_timeout(500)

        # Verify Live Table Header Blueprint Preview & Customized filter before reset
        blueprint = page.locator("section[aria-label='Live table column preview']")
        assert await blueprint.is_visible(), "Live Table Header Blueprint preview missing!"
        modified_filter = page.locator("button:has-text('Modified')").first
        assert await modified_filter.is_visible(), "Modified filter pill missing!"
        await modified_filter.click()
        await page.wait_for_timeout(300)
        assert await page.locator("input[value='WORK ITEM TITLE']").is_visible(), "Modified filter should display WORK ITEM TITLE!"
        await page.locator("button:has-text('All')").first.click()
        await page.wait_for_timeout(200)

        # Click Reset Defaults (immediate with non-blocking Undo toast)
        await page.locator("button:has-text('Reset Defaults')").click()
        await page.wait_for_timeout(400)

        restored_input = page.locator("input[value='TASK NAME & CHECKLIST']")
        assert await restored_input.is_visible(), "TASK NAME & CHECKLIST not restored after Reset Defaults!"
        undo_btn = page.locator("button:has-text('Undo')").first
        assert await undo_btn.is_visible(), "Undo toast button should appear after Reset Defaults!"
        await undo_btn.click()
        await page.wait_for_timeout(300)
        assert await page.locator("input[value='WORK ITEM TITLE']").is_visible(), "Undo should restore WORK ITEM TITLE!"
        await page.locator("button:has-text('Reset Defaults')").click()
        await page.wait_for_timeout(300)
        print("[PASS] Reset Defaults & Undo restoration verified!")

        # Step 8: Test 1-Click Starter Template & Modal Inline Validation + Live Preview
        print("[10] Testing Quick Template 1-Click Add & Modal Inline Validation...")
        await page.locator("button:has-text('Risk Score')").first.click()
        await page.wait_for_timeout(300)
        assert await page.locator("h4:has-text('Risk Score')").is_visible(), "Quick starter 'Risk Score' should be created on 1 click!"

        await page.locator("button:has-text('Add Field')").first.click()
        await page.wait_for_timeout(300)
        await page.locator("button:has-text('Create Attribute')").click()
        await page.wait_for_timeout(200)
        err_alert = page.locator("[role='alert']:has-text('Enter an attribute display name')")
        assert await err_alert.is_visible(), "Inline validation error should display without browser alert!"
        await page.locator("input[placeholder='e.g. Security Classification, Client Contract ID']").fill("Security Classification")
        await page.locator("select").first.select_option("dropdown")
        await page.locator("#fa-manual-opts").fill("Internal; Confidential; Restricted")
        await page.wait_for_timeout(200)
        assert await page.locator("text=Confidential").first.is_visible(), "Live manual option pills should preview!"
        await page.locator("button:has-text('Create Attribute')").click()
        await page.wait_for_timeout(300)
        assert await page.locator("h4:has-text('Security Classification')").is_visible(), "Created dropdown attribute missing!"
        print("[PASS] Quick starters, inline validation & live option preview verified!")

        # Re-capture updated Desktop & Mobile screenshots for visual inspection
        await page.screenshot(path=fa_screenshot, full_page=False)
        await page.set_viewport_size({"width": 393, "height": 852})
        await page.wait_for_timeout(400)
        overflow = await page.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        assert not overflow, "Mobile 393px viewport has horizontal overflow on Field Architect!"
        mobile_shot = os.path.join(ARTIFACTS_DIR, "field_architect_mobile.png")
        await page.screenshot(path=mobile_shot, full_page=False)
        print(f"[SCREENSHOT] Saved Mobile Field Architect screenshot to: {mobile_shot}")

        await browser.close()
        print("=== ALL FIELD ARCHITECT ENHANCEMENT TESTS PASSED! ===")

if __name__ == "__main__":
    asyncio.run(run_tests())
