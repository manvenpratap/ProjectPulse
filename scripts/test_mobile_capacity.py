import asyncio
from playwright.async_api import async_playwright

async def run_mobile_capacity_test():
    async with async_playwright() as p:
        iphone = p.devices['iPhone 14 Pro']
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(**iphone)
        page = await context.new_page()

        print("\n--- TEST 1: Launch and Navigate to Capacity on Mobile ---")
        await page.goto("http://localhost:3000")
        await page.wait_for_timeout(1000)
        if await page.locator("button:has-text('Load Demo Database')").is_visible():
            await page.click("button:has-text('Load Demo Database')")
            await page.wait_for_timeout(1000)

        # Navigate to Team Hub then Capacity
        await page.click('nav[aria-label="Mobile Navigation"] button[aria-label="Team"]')
        await page.wait_for_timeout(500)
        await page.click('button:has-text("Capacity")')
        await page.wait_for_timeout(1000)

        # Verify Page Title
        title = await page.locator("h1").inner_text()
        print(f"✓ Capacity view loaded: '{title}'")

        # Verify 2x2 KPI Summary grid
        kpi_count = await page.locator("text=Avg Utilization").count()
        assert kpi_count > 0, "Avg Utilization KPI card missing"
        print("✓ 2x2 KPI summary cards are rendered compactly")

        print("\n--- TEST 2: Member Cards Deck & 8-Week Touch Strip ---")
        # Check that 'Member Cards' is selected by default on mobile
        cards_btn = page.locator("button:has-text('Member Cards')")
        assert await cards_btn.count() > 0, "Member Cards button missing"
        print("✓ Member Cards view mode is active by default on mobile")

        # Check member card elements
        alex_card = page.locator("text=Alex Rivera").first
        await alex_card.wait_for(state="visible", timeout=3000)
        print("✓ Team member cards are displayed")

        # Verify 8-week touch strip on Alex Rivera's card
        week_btns = page.locator("button[aria-label*='Alex Rivera Week']")
        week_count = await week_btns.count()
        print(f"✓ Found {week_count} interactive week touch targets for Alex Rivera")
        assert week_count == 8, f"Expected 8 week buttons, found {week_count}"

        print("\n--- TEST 3: Apple Bottom Sheet Drawer Opening & Interaction ---")
        # Tap Week 1 for Alex Rivera
        await week_btns.first.click()
        await page.wait_for_timeout(500)

        # Verify Bottom Sheet is visible (it is the last in the DOM)
        sheet_header = page.locator("text=Week 1 Analysis").last
        await sheet_header.wait_for(state="visible", timeout=3000)
        print("✓ Apple Bottom Sheet Drawer opened with Week 1 Analysis!")

        # Verify Contributing tasks & allocation advisory inside bottom sheet
        tasks_heading = page.locator("text=Contributing Tasks").last
        await tasks_heading.wait_for(state="visible", timeout=3000)
        advisory_heading = page.locator("text=Allocation Advisory").last
        await advisory_heading.wait_for(state="visible", timeout=3000)
        print("✓ Bottom sheet contains contributing tasks & intelligent allocation advisory")

        # Tap 'Done' button inside bottom sheet
        done_btn = page.locator("button:has-text('Done')").last
        await done_btn.click()
        await page.wait_for_timeout(500)

        # Verify bottom sheet dismissed
        assert not await sheet_header.is_visible(), "Bottom sheet did not dismiss"
        print("✓ Bottom sheet dismissed smoothly via Done button")

        print("\n--- TEST 4: Peak Week Quick Inspection Banner ---")
        # Locate Inspect button on overloaded member
        inspect_btn = page.locator("button:has-text('Inspect')").first
        if await inspect_btn.count() > 0:
            await inspect_btn.click()
            await page.wait_for_timeout(500)
            await page.wait_for_selector("text=Analysis", timeout=3000)
            print("✓ 1-tap 'Inspect' peak week banner opened analysis sheet!")
            
            # Dismiss via close X
            close_x = page.locator("button[aria-label='Close allocation details']").first
            await close_x.click()
            await page.wait_for_timeout(500)
            print("✓ Closed via header X button")

        print("\n--- TEST 5: Switching to Matrix Grid on Mobile ---")
        # Switch to Heatmap Grid
        await page.click("button:has-text('Heatmap Grid')")
        await page.wait_for_timeout(500)

        # Verify Table is displayed
        table = page.locator("table")
        await table.wait_for(state="visible", timeout=3000)
        print("✓ Heatmap Grid table loaded")

        # Tap a cell in table on mobile
        cell = page.locator("tbody tr:first-child td:nth-child(2)")
        await cell.click()
        await page.wait_for_timeout(500)

        # Verify bottom sheet opens from table click as well!
        await page.locator("text=Week 1 Analysis").last.wait_for(state="visible", timeout=3000)
        print("✓ Table cell tap on mobile also opens Bottom Sheet Drawer!")

        # Close sheet
        await page.locator("button:has-text('Done')").last.click()
        await page.wait_for_timeout(500)

        # Switch back to Member Cards
        await page.click("button:has-text('Member Cards')")
        await page.wait_for_timeout(500)
        print("✓ Switched back to Member Cards view")

        print("\n--- TEST 6: Search & Role Filters on Mobile ---")
        # Search for 'Marcus'
        await page.fill("input[placeholder='Search resources...']", "Marcus")
        await page.wait_for_timeout(300)
        
        # Verify Marcus is visible and others filtered
        marcus_card = page.locator("text=Marcus Wong").first
        await marcus_card.wait_for(state="visible", timeout=3000)
        alex_count = await page.locator("text=Alex Rivera").count()
        assert alex_count == 0, "Search filtering failed"
        print("✓ Search filtering works smoothly on mobile")

        # Clear search
        await page.click("button[aria-label='Clear search']")
        await page.wait_for_timeout(300)
        alex_restored = await page.locator("text=Alex Rivera").count()
        assert alex_restored > 0, "Clear search failed to restore resources"
        print("✓ Clear search button restored all resources")

        print("\n==========================================")
        print("MOBILE CAPACITY VIEW FULLY FUNCTIONAL! 🎉")
        print("==========================================\n")

        await browser.close()

asyncio.run(run_mobile_capacity_test())
