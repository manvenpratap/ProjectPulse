import time
import sys
from playwright.sync_api import sync_playwright

def test_enhanced_tables():
    print("🚀 Starting Enhanced Tables (Tasks, Defects, Deliveries) E2E Test...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()
        page.goto("http://localhost:3000", wait_until="networkidle")
        time.sleep(1)

        # Handle SetupView if project not yet initialized in browser session
        sample_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if sample_btn.count() > 0 and sample_btn.first.is_visible():
            print("SetupView detected - loading sample Web workspace...")
            sample_btn.first.click()
            time.sleep(1)

        # -------------------------------------------------------------
        # 1. TASKS TABLE TEST
        # -------------------------------------------------------------
        print("\n--- 1. Testing Tasks Table ---")
        tasks_nav = page.locator('button:has-text("Tasks Matrix"), button:has-text("Tasks")').first
        assert tasks_nav.is_visible(), "Tasks nav item must be visible"
        tasks_nav.click()
        time.sleep(1)

        # Check table presence
        tasks_table = page.locator('table').first
        assert tasks_table.is_visible(), "Tasks table should be visible"
        print("✓ Tasks table found")

        # Check row number column `#`
        th_rn = page.locator('th:has-text("#")')
        assert th_rn.count() > 0, "Row number header '#' should exist"
        print("✓ Row number column '#' is present")

        # Check inline filters default state (true)
        filter_selects = page.locator('thead select')
        print(f"✓ Inline filters rendered with {filter_selects.count()} dropdowns")
        assert filter_selects.count() > 0, "Inline filter dropdowns should be visible by default"

        # Toggle inline filters off and on
        filter_toggle = page.locator('button:has-text("Filters Visible"), button:has-text("Show Filters")').first
        assert filter_toggle.is_visible(), "Filter toggle button should be visible"
        filter_toggle.click()
        time.sleep(0.3)
        assert page.locator('thead select').count() == 0, "Filters should be hidden when toggled off"
        print("✓ Successfully toggled inline filters OFF")
        filter_toggle.click()
        time.sleep(0.3)
        assert page.locator('thead select').count() > 0, "Filters should be visible when toggled back ON"
        print("✓ Successfully toggled inline filters back ON")

        # Check subtask expansion if present
        subtask_toggle = page.locator('button[title*="subtask" i]').first
        if subtask_toggle.is_visible():
            subtask_toggle.click()
            time.sleep(0.3)
            print("✓ Subtask toggle clicked")

        # Check bulk selection checkbox
        task_checkbox = page.locator('tbody input[type="checkbox"]').first
        assert task_checkbox.is_visible(), "Task row checkbox should be visible"
        task_checkbox.click()
        time.sleep(0.5)
        
        # Floating bulk bar should appear
        bulk_bar = page.locator('text=/task\(s\) selected/i').first
        assert bulk_bar.is_visible(), "Bulk action bar should appear on row selection"
        print("✓ Tasks floating bulk action bar appeared on selection")
        
        # Uncheck
        task_checkbox.click()
        time.sleep(0.3)

        # -------------------------------------------------------------
        # 2. DEFECTS TABLE TEST
        # -------------------------------------------------------------
        print("\n--- 2. Testing Defects Matrix Table ---")
        defects_nav = page.locator('button:has-text("Defect Workshop"), button:has-text("Defects")').first
        assert defects_nav.is_visible(), "Defects navigation item should exist"
        defects_nav.click()
        time.sleep(1)

        # Verify Table / Card switcher exists
        table_view_btn = page.locator('button:has-text("Table")').first
        assert table_view_btn.is_visible(), "Table view toggle button should be visible"
        table_view_btn.click()
        time.sleep(0.5)

        # Check Defects Table headers
        defect_th_id = page.locator('th:has-text("Defect ID")').first
        assert defect_th_id.is_visible(), "Defect ID column header must be present in Matrix table"
        defect_th_severity = page.locator('th:has-text("Severity")').first
        assert defect_th_severity.is_visible(), "Severity column header must be present"
        print("✓ Defects Matrix Table rendered with expected enterprise column headers")

        # Check status badges with .st-badge
        st_badges = page.locator('.st-badge')
        assert st_badges.count() > 0, "Defects table should render .st-badge status pills"
        print(f"✓ Found {st_badges.count()} high-contrast status pills in Defects view")

        # Test inline filter toggle
        defect_filter_btn = page.locator('button:has-text("Filters Visible"), button:has-text("Show Filters")').first
        if defect_filter_btn.is_visible():
            defect_filter_btn.click()
            time.sleep(0.3)
            defect_filter_btn.click()
            time.sleep(0.3)
            print("✓ Defects inline filter toggle tested")

        # Test bulk selection
        defect_chk = page.locator('tbody input[type="checkbox"]').first
        if defect_chk.is_visible():
            defect_chk.click()
            time.sleep(0.5)
            bulk_bar = page.locator('text=/defect\(s\) selected/i').first
            assert bulk_bar.is_visible(), "Defects floating bulk bar should appear"
            print("✓ Defects floating bulk action bar appeared")
            defect_chk.click()
            time.sleep(0.3)

        # -------------------------------------------------------------
        # 3. DELIVERIES TABLE TEST
        # -------------------------------------------------------------
        print("\n--- 3. Testing Deliveries Table ---")
        deliveries_nav = page.locator('button:has-text("ALM Deliveries"), button:has-text("Deliveries")').first
        assert deliveries_nav.is_visible(), "Deliveries navigation item should exist"
        deliveries_nav.click()
        time.sleep(1)

        # Verify Deliveries table presence
        del_th_alm = page.locator('th:has-text("ALM ID"), th:has-text("Delivery")').first
        assert del_th_alm.is_visible(), "Deliveries table header must be visible"
        del_th_rn = page.locator('th:has-text("#")').first
        assert del_th_rn.is_visible(), "Row number column '#' should be visible in Deliveries table"
        print("✓ Deliveries Matrix Table rendered with '#' row number column and headers")

        # Verify status badges
        del_st_badges = page.locator('.st-badge')
        assert del_st_badges.count() > 0, "Deliveries should have .st-badge status indicators"
        print(f"✓ Found {del_st_badges.count()} status pills in Deliveries table")

        # Test bulk selection
        del_chk = page.locator('tbody input[type="checkbox"]').first
        if del_chk.is_visible():
            del_chk.click()
            time.sleep(0.5)
            del_bulk = page.locator('text=/selected/i').first
            assert del_bulk.is_visible(), "Deliveries floating bulk action bar should appear"
            print("✓ Deliveries bulk action bar appeared")
            del_chk.click()
            time.sleep(0.3)

        browser.close()
        print("\n🎉 ALL Enhanced Tables tests passed successfully!")

if __name__ == "__main__":
    test_enhanced_tables()
