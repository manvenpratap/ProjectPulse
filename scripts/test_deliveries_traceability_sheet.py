import asyncio
import os
import sys
import openpyxl
from playwright.async_api import async_playwright

BASE_URL = "http://localhost:3000"
ARTIFACTS_DIR = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46"
DOWNLOADS_DIR = os.path.join(ARTIFACTS_DIR, "downloads")

async def test_deliveries_traceability():
    print("=== TESTING DELIVERIES EXCEL EXPORT: FEATURE & SCREEN TRACEABILITY SHEET ===")
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(accept_downloads=True, viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # Step 0: Initial navigation
        print("[0] Navigating to app...")
        await page.goto(BASE_URL, wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Handle SetupView if project not yet initialized
        sample_btn = page.get_by_role("button", name="Load Demo Database")
        if await sample_btn.is_visible():
            print("SetupView detected - loading sample database...")
            await sample_btn.click()
            await page.wait_for_timeout(1500)

        # Step 1: Navigate to Deliveries (#/deliveries)
        print("[1] Navigating to #/deliveries...")
        del_nav = page.get_by_role("button", name="ALM Deliveries").first
        if await del_nav.is_visible():
            await del_nav.click()
        else:
            await page.goto(f"{BASE_URL}/#/deliveries", wait_until="networkidle")
        await page.wait_for_timeout(1200)

        # Step 2: Trigger Deliveries Excel export
        print("[2] Triggering Deliveries Excel export via ViewExportButton...")
        export_btn = page.locator("button:has-text('Export Deliveries')").first
        assert await export_btn.is_visible(), "Export Deliveries button should be visible"

        async with page.expect_download() as download_info:
            await export_btn.click()
        
        download = await download_info.value
        export_path = os.path.join(DOWNLOADS_DIR, download.suggested_filename)
        await download.save_as(export_path)
        print(f"✓ Downloaded Deliveries Excel: {download.suggested_filename} ({os.path.getsize(export_path)} bytes)")

        # Step 3: Inspect Workbook with openpyxl
        print("[3] Inspecting sheets in Deliveries workbook...")
        wb = openpyxl.load_workbook(export_path, data_only=False)
        sheet_names = wb.sheetnames
        print(f"✓ Sheets found: {sheet_names}")

        assert "Deliveries" in sheet_names, "Workbook must contain 'Deliveries' sheet"
        assert "Feature & Screen Traceability" in sheet_names, "Workbook must contain 'Feature & Screen Traceability' sheet"

        # Step 4: Verify Sheet 1 ('Deliveries')
        print("[4] Verifying Sheet 1 ('Deliveries')...")
        ws_del = wb["Deliveries"]
        assert ws_del.max_row >= 8, f"Deliveries sheet must have at least 8 rows (found {ws_del.max_row})"
        
        del_headers = [ws_del.cell(row=7, column=c).value for c in range(1, 16)]
        print(f"✓ Sheet 1 headers: {del_headers}")
        assert "Defect ID - ALM ID" in del_headers, "Missing ALM ID column"
        assert "Components Delivered" in del_headers, "Missing Components Delivered column"
        assert "Impacted Feature" in del_headers, "Missing Impacted Feature column"
        assert any("Feature Completion" in str(h) for h in del_headers), "Missing Feature Completion column"

        # Check outline levels on Sheet 1 (Delivery = 0, Component = 1)
        del_outline_levels = set()
        for r in range(8, ws_del.max_row + 1):
            del_outline_levels.add(ws_del.row_dimensions[r].outline_level)
        print(f"✓ Sheet 1 outline levels: {del_outline_levels}")
        assert 0 in del_outline_levels, "Level 0 delivery rows expected"
        assert 1 in del_outline_levels, "Level 1 component rows expected"

        # Step 5: Verify Sheet 2 ('Feature & Screen Traceability')
        print("[5] Verifying Sheet 2 ('Feature & Screen Traceability')...")
        ws_trace = wb["Feature & Screen Traceability"]
        
        # Row 1: Top Banner
        b1_val = str(ws_trace.cell(row=1, column=2).value or '')
        print(f"✓ Row 1 Banner: {b1_val}")
        assert "FEATURE, SCREEN & COMPONENT TRACEABILITY MATRIX" in b1_val, "Top banner text missing"
        assert "DEDUPLICATED HIERARCHICAL ROLLUP" in b1_val, "Top banner rollup description missing"

        # Rows 3-5: KPI Telemetry Cards
        # Card 1: Tracked Features
        c1_title = str(ws_trace.cell(row=3, column=2).value or '')
        print(f"✓ Card 1 text: {c1_title}")
        assert "tracked features" in c1_title.lower(), "KPI Card 1 title mismatch"
        assert "features" in c1_title.lower(), "KPI Card 1 value mismatch"

        # Card 2: Feature Screens Breakdown
        c2_title = str(ws_trace.cell(row=3, column=4).value or '')
        print(f"✓ Card 2 text: {c2_title}")
        assert "screens breakdown" in c2_title.lower(), "KPI Card 2 title mismatch"
        assert "screens" in c2_title.lower(), "KPI Card 2 value mismatch"

        # Card 3: Feature Completion Rate
        c3_title = str(ws_trace.cell(row=3, column=6).value or '')
        print(f"✓ Card 3 text: {c3_title}")
        assert "completion rate" in c3_title.lower(), "KPI Card 3 title mismatch"
        assert "%" in c3_title, "KPI Card 3 value mismatch"

        # Card 4: Deduplicated Components
        c4_title = str(ws_trace.cell(row=3, column=8).value or '')
        print(f"✓ Card 4 text: {c4_title}")
        assert "deduplicated components" in c4_title.lower(), "KPI Card 4 title mismatch"
        assert "components" in c4_title.lower(), "KPI Card 4 value mismatch"

        # Row 6: Instruction Guide
        guide_val = str(ws_trace.cell(row=6, column=2).value or '')
        print(f"✓ Row 6 Guide: {guide_val}")
        assert "DEDUPLICATED HIERARCHY" in guide_val, "Row 6 instruction banner missing"

        # Row 7: Headers
        trace_headers = [ws_trace.cell(row=7, column=c).value for c in range(1, 11)]
        print(f"✓ Sheet 2 Headers: {trace_headers}")
        assert "Traceability ID" in trace_headers, "Missing Traceability ID"
        assert "Feature ➔ Screen ➔ Component" in trace_headers, "Missing Entity Name column"
        assert "Hierarchy Level" in trace_headers, "Missing Hierarchy Level"
        assert "Release / Module" in trace_headers, "Missing Release / Module"
        assert "Completion / Status" in trace_headers, "Missing Completion / Status"
        assert "Screen Breakdown / Share" in trace_headers, "Missing Screen Breakdown / Share"
        assert "Deduplicated Components" in trace_headers, "Missing Deduplicated Components"
        assert "Linked Tasks (Deduplicated)" in trace_headers, "Missing Linked Tasks"
        assert "Contributing Deliveries (ALM IDs)" in trace_headers, "Missing Contributing Deliveries"

        # Step 6: Verify 3-Tier Outline Levels on Sheet 2
        print("[6] Verifying 3-tier outline levels and visibility...")
        trace_outline_levels = set()
        level_0_count = 0
        level_1_count = 0
        level_2_count = 0

        for r in range(8, ws_trace.max_row + 1):
            lvl = ws_trace.row_dimensions[r].outline_level
            trace_outline_levels.add(lvl)
            is_hidden = ws_trace.row_dimensions[r].hidden
            trace_id = str(ws_trace.cell(row=r, column=2).value or '')

            if lvl == 0:
                level_0_count += 1
                assert not is_hidden, f"Level 0 (Feature) row {r} should not be hidden"
                assert "FEAT" in trace_id, f"Level 0 row {r} should have FEAT id, got {trace_id}"
            elif lvl == 1:
                level_1_count += 1
                # Level 1 (Canonical Screens) MUST be visible by default per spec!
                assert not is_hidden, f"Level 1 (Screen) row {r} MUST be visible by default, but was hidden!"
                assert "SCR" in trace_id, f"Level 1 row {r} should have SCR id, got {trace_id}"
            elif lvl == 2:
                level_2_count += 1
                assert is_hidden, f"Level 2 (Component) row {r} should be hidden (collapsible), but was visible!"
                assert "COMP" in trace_id, f"Level 2 row {r} should have COMP id, got {trace_id}"

        print(f"✓ Traceability outline levels found: {trace_outline_levels}")
        print(f"✓ Level 0 Features: {level_0_count}, Level 1 Canonical Screens (Visible): {level_1_count}, Level 2 Deduplicated Comps (Collapsible): {level_2_count}")

        assert 0 in trace_outline_levels, "Traceability sheet must have Level 0 (Feature)"
        assert 1 in trace_outline_levels, "Traceability sheet must have Level 1 (Screen)"
        assert 2 in trace_outline_levels, "Traceability sheet must have Level 2 (Component)"
        assert level_0_count >= 1, "Expected at least 1 Level 0 feature row"
        assert level_1_count >= 1, "Expected at least 1 Level 1 screen row"
        assert level_2_count >= 1, "Expected at least 1 Level 2 component row"

        # Step 7: Verify Cross-Sheet Hyperlinks
        print("[7] Verifying cross-sheet hyperlinks...")
        # Check hyperlinks on Sheet 2 pointing back to Sheet 1 ('Deliveries')
        del_links_found = 0
        for r in range(8, ws_trace.max_row + 1):
            cell = ws_trace.cell(row=r, column=10) # contributingDels column
            if cell.hyperlink:
                del_links_found += 1
                print(f"  Row {r} contributingDels link: {cell.hyperlink.target}")
                assert "'Deliveries'!" in cell.hyperlink.target or "Deliveries!" in cell.hyperlink.target, f"Expected link to 'Deliveries', got {cell.hyperlink.target}"

        print(f"✓ Verified {del_links_found} hyperlinks from Sheet 2 back to Sheet 1 ('Deliveries')")

        # Check hyperlinks on Sheet 1 pointing to Sheet 2
        trace_links_found = 0
        for r in range(8, ws_del.max_row + 1):
            c_feat = ws_del.cell(row=r, column=14) # impactedFeature
            c_comp = ws_del.cell(row=r, column=15) # featureCompletion
            if c_feat.hyperlink:
                trace_links_found += 1
                assert "Traceability" in c_feat.hyperlink.target
            if c_comp.hyperlink:
                trace_links_found += 1
                assert "Traceability" in c_comp.hyperlink.target

        print(f"✓ Verified {trace_links_found} hyperlinks from Sheet 1 ('Deliveries') to Sheet 2 ('Feature & Screen Traceability')")
        assert trace_links_found > 0, "Expected cross-sheet hyperlinks on Sheet 1 pointing to Sheet 2"

        print("=== ALL FEATURE & SCREEN TRACEABILITY SHEET TESTS PASSED! ===")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_deliveries_traceability())
