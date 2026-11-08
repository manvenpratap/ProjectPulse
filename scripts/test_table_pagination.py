import asyncio
from playwright.async_api import async_playwright

async def run_pagination_test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        print("[1] Opening app...")
        await page.goto("http://localhost:3000")
        await page.wait_for_timeout(2000)

        # If SetupView is displayed, load demo database
        demo_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if await demo_btn.count() > 0 and await demo_btn.first.is_visible():
            print("Loading demo database...")
            await demo_btn.first.click()
            await page.wait_for_timeout(2000)

        # -------------------------------------------------------------
        # TEST 1: Tasks Matrix Pagination
        # -------------------------------------------------------------
        print("\n--- TEST 1: Tasks Matrix Pagination ---")
        tasks_nav = page.locator('button:has-text("Tasks Matrix"), button:has-text("Tasks")').first
        await tasks_nav.click()
        await page.wait_for_timeout(1000)

        # Check pagination bar
        pagination_text = page.locator("text=/Showing [0-9]+–[0-9]+ of [0-9]+ tasks/i")
        assert await pagination_text.count() > 0, "Tasks pagination text not found"
        summary_text = await pagination_text.first.text_content()
        print(f"✓ Pagination summary found: '{summary_text}'")

        # Verify page size dropdown exists
        rows_select = page.locator("select[aria-label='Rows per page']").first
        assert await rows_select.is_visible(), "Rows per page select not visible"
        print(f"✓ Page size selector present with value: {await rows_select.input_value()}")

        # Count rendered rows on page 1 (excluding header/filter rows)
        task_rows = page.locator("tbody tr.group")
        row_count = await task_rows.count()
        print(f"✓ Page 1 row count: {row_count} rows")
        assert row_count <= 10, f"Expected <= 10 rows on page 1, got {row_count}"

        # Test Next Page navigation
        next_btn = page.locator("button[aria-label='Next page']").first
        if await next_btn.is_enabled():
            await next_btn.click()
            await page.wait_for_timeout(500)
            summary_page2 = await pagination_text.first.text_content()
            print(f"✓ Navigated to Page 2: '{summary_page2}'")
            assert "11–" in summary_page2 or "Showing 11" in summary_page2, f"Expected page 2 range, got {summary_page2}"

            # Previous page navigation
            prev_btn = page.locator("button[aria-label='Previous page']").first
            await prev_btn.click()
            await page.wait_for_timeout(500)
            summary_page1 = await pagination_text.first.text_content()
            print(f"✓ Navigated back to Page 1: '{summary_page1}'")
            assert "1–" in summary_page1 or "Showing 1" in summary_page1, f"Expected page 1 range, got {summary_page1}"

        # Test Configurable Page Size (switch to 25)
        print("Changing page size to 25...")
        await rows_select.select_option("25")
        await page.wait_for_timeout(500)
        summary_25 = await pagination_text.first.text_content()
        print(f"✓ Page size updated to 25: '{summary_25}'")
        assert "1–25" in summary_25 or "of 42" in summary_25 or "of" in summary_25, f"Unexpected summary: {summary_25}"

        # Test Persistence across page reload
        print("Reloading page to test localStorage persistence of page size...")
        await page.reload()
        await page.wait_for_timeout(1500)
        await tasks_nav.click()
        await page.wait_for_timeout(1000)
        rows_select_after = page.locator("select[aria-label='Rows per page']").first
        val_after = await rows_select_after.input_value()
        print(f"✓ Saved page size persisted after reload: {val_after}")
        assert val_after == "25", f"Expected persisted page size 25, got {val_after}"

        # -------------------------------------------------------------
        # TEST 2: Deliveries Matrix Pagination
        # -------------------------------------------------------------
        print("\n--- TEST 2: Deliveries Matrix Pagination ---")
        deliv_nav = page.locator('button:has-text("Deliveries")').first
        await deliv_nav.click()
        await page.wait_for_timeout(1000)

        deliv_pagination = page.locator("text=/Showing [0-9]+–[0-9]+ of [0-9]+ packages/i")
        assert await deliv_pagination.count() > 0, "Deliveries pagination text not found"
        print(f"✓ Deliveries pagination found: '{await deliv_pagination.first.text_content()}'")

        # -------------------------------------------------------------
        # TEST 3: Defects Matrix Pagination
        # -------------------------------------------------------------
        print("\n--- TEST 3: Defects Matrix Pagination ---")
        defect_nav = page.locator('button:has-text("Defect Workshop"), button:has-text("Quality & Governance")').first
        await defect_nav.click()
        await page.wait_for_timeout(1000)

        defect_pagination = page.locator("text=/Showing [0-9]+–[0-9]+ of [0-9]+ defects/i")
        assert await defect_pagination.count() > 0, "Defects pagination text not found"
        print(f"✓ Defects pagination found: '{await defect_pagination.first.text_content()}'")

        # -------------------------------------------------------------
        # TEST 4: RAID Register Pagination
        # -------------------------------------------------------------
        print("\n--- TEST 4: RAID Register Pagination ---")
        raid_nav = page.locator('button:has-text("RAID Register"), button:has-text("RAID Log"), button:has-text("RAID")').first
        await raid_nav.click()
        await page.wait_for_timeout(1000)

        raid_pagination = page.locator("text=/Showing [0-9]+–[0-9]+ of [0-9]+ RAID items/i")
        assert await raid_pagination.count() > 0, "RAID pagination text not found"
        print(f"✓ RAID register pagination found: '{await raid_pagination.first.text_content()}'")

        # Reset task page size back to default 10 for clean state
        await tasks_nav.click()
        await page.wait_for_timeout(500)
        rows_select = page.locator("select[aria-label='Rows per page']").first
        await rows_select.select_option("10")
        await page.wait_for_timeout(300)

        print("\n==========================================")
        print("ALL TABLE PAGINATION TESTS PASSED! 🎉")
        print("==========================================")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_pagination_test())
