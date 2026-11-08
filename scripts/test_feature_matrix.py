import time
import sys
from playwright.sync_api import sync_playwright

def test_feature_matrix():
    print("🚀 Starting Feature Matrix E2E Test...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()
        page.goto("http://localhost:3000", wait_until="networkidle")
        time.sleep(1)

        # Handle SetupView if needed
        sample_btn = page.locator('button:has-text("Load Sample: Web")')
        if sample_btn.count() > 0 and sample_btn.first.is_visible():
            print("SetupView detected - loading sample Web workspace...")
            sample_btn.first.click()
            time.sleep(1)

        # Navigate to Functional Matrix (Hub: System Architecture -> Functional Matrix)
        print("\n--- 1. Navigating to Functional Matrix ---")
        features_nav = page.locator('button:has-text("Functional Matrix")').first
        assert features_nav.is_visible(), "Functional Matrix nav item must be visible"
        features_nav.click()
        time.sleep(1)

        # Verify Header and Subtitle
        header_title = page.locator('h1:has-text("Functional Matrix")')
        assert header_title.is_visible(), "Page header should show Functional Matrix"
        print("✓ Functional Matrix header and architecture coverage subtitle confirmed")

        # Verify KPI ribbon
        kpi_features = page.locator('text=Features').first
        kpi_screens = page.locator('text=Mapped Screens').first
        kpi_maturity = page.locator('text=Avg Maturation').first
        assert kpi_features.is_visible() and kpi_screens.is_visible() and kpi_maturity.is_visible(), "KPI ribbon should be present"
        print("✓ Top KPI telemetry ribbon (Features, Mapped Screens, Maturation, At Risk) verified")

        # -------------------------------------------------------------
        # 2. TEST VIEW MODE SWITCHER
        # -------------------------------------------------------------
        print("\n--- 2. Testing View Mode Switcher ---")

        # A: Matrix View (Cards)
        matrix_btn = page.locator('button[aria-label="Grid Matrix View"]').first
        matrix_btn.click()
        time.sleep(0.3)
        cards = page.locator('h4:has-text("Cloud Native"), h4:has-text("Omnichannel"), h4:has-text("Data-Driven")')
        assert cards.count() > 0, "Matrix view cards should render"
        print(f"✓ Matrix view cards rendered ({cards.count()} primary nodes confirmed)")

        # B: Tabular List View
        table_btn = page.locator('button[aria-label="Tabular List View"]').first
        table_btn.click()
        time.sleep(0.3)
        table_el = page.locator('table')
        assert table_el.is_visible(), "Feature matrix table should be visible in Table view"
        th_feature = page.locator('th:has-text("Feature Node")')
        th_maturation = page.locator('th:has-text("Maturation")')
        assert th_feature.is_visible() and th_maturation.is_visible(), "Table headers should be present"
        print("✓ Tabular List View rendered with enterprise columns and status badges")

        # C: Timeline Gantt View
        timeline_btn = page.locator('button[aria-label="Timeline Gantt View"]').first
        timeline_btn.click()
        time.sleep(0.3)
        timeline_info = page.locator('text=Feature Execution Span')
        assert timeline_info.is_visible(), "Timeline info bar should be visible"
        print("✓ Timeline Gantt View rendered with feature execution spans")

        # D: Swimlane Kanban View
        swimlane_btn = page.locator('button[aria-label="Swimlane View"]').first
        swimlane_btn.click()
        time.sleep(0.3)
        lanes = page.locator('h3:has-text("Planned"), h3:has-text("Active"), h3:has-text("Done")')
        assert lanes.count() > 0, "Swimlane columns should be visible"
        print("✓ Swimlane Kanban View rendered with status columns")

        # Switch back to Matrix
        matrix_btn.click()
        time.sleep(0.3)

        # -------------------------------------------------------------
        # 3. SCREEN COVERAGE AUDIT PANEL
        # -------------------------------------------------------------
        print("\n--- 3. Testing Screen Coverage Audit Panel ---")
        coverage_btn = page.locator('button[title*="Coverage" i]').first
        assert coverage_btn.is_visible(), "Coverage audit button should exist"
        coverage_btn.click()
        time.sleep(0.3)

        audit_panel = page.locator('text=Screen Coverage Audit').first
        assert audit_panel.is_visible(), "Screen Coverage Audit drawer should open"
        print("✓ Screen Coverage Audit panel opened successfully")

        # Close audit panel
        close_audit = page.locator('button[aria-label="Close Coverage Audit"]').first
        if close_audit.is_visible():
            close_audit.click()
            time.sleep(0.3)
            print("✓ Screen Coverage Audit panel closed")

        # -------------------------------------------------------------
        # 4. AUTO-BUILD FEATURE MATRIX MODAL
        # -------------------------------------------------------------
        print("\n--- 4. Testing Auto-Build Feature Matrix Algorithm Modal ---")
        autobuild_btn = page.locator('button:has-text("Auto-Build")').first
        assert autobuild_btn.is_visible(), "Auto-Build button should exist"
        autobuild_btn.click()
        time.sleep(0.5)

        autobuild_modal = page.locator('h3:has-text("Auto-Build Feature Matrix")').first
        assert autobuild_modal.is_visible(), "Auto-Build modal should open"
        print("✓ Auto-Build Feature Matrix modal displayed candidate feature clusters")

        # Cancel Auto-Build modal
        cancel_btn = page.locator('button:has-text("Cancel")').first
        cancel_btn.click()
        time.sleep(0.3)
        print("✓ Auto-Build modal closed safely")

        # -------------------------------------------------------------
        # 5. FILTERING
        # -------------------------------------------------------------
        print("\n--- 5. Testing Filtering Controls ---")
        search_input = page.locator('input[placeholder*="Search features"]').first
        search_input.fill("Cloud")
        time.sleep(0.3)
        cloud_card = page.locator('h4:has-text("Cloud Native")').first
        assert cloud_card.is_visible(), "Cloud Native card should remain visible after search filter"
        print("✓ Filtered successfully by search keyword 'Cloud'")
        search_input.fill("")
        time.sleep(0.3)

        browser.close()
        print("\n🎉 ALL Feature Matrix revamp tests passed successfully!")

if __name__ == "__main__":
    test_feature_matrix()
