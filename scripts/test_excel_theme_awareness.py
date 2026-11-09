#!/usr/bin/env python3
import os
import sys
import openpyxl
from playwright.sync_api import sync_playwright

def test_excel_theme_awareness():
    print("🚀 Starting Excel Theme-Aware Export Verification Test...")
    downloads_path = "/tmp/pp_theme_excel_test"
    os.makedirs(downloads_path, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            accept_downloads=True
        )
        page = context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE: {msg.text}") if msg.type == "error" else None)

        print("[1] Opening app at http://localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(2000)

        demo_btn = page.locator('button:has-text("Load Demo Database")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            print("[2] Loading demo database...")
            demo_btn.first.click()
            page.wait_for_timeout(2500)

        # -----------------------------------------------------------------
        # TEST 1: EXPORT UNDER DARK THEME ("pulse" - default cyan accent)
        # -----------------------------------------------------------------
        print("\n--- TEST 1: Exporting under 'pulse' Technical Dark Theme ---")
        # Ensure pulse theme is active
        page.evaluate("() => { if (window.setTheme) window.setTheme('pulse'); document.documentElement.setAttribute('data-theme', 'pulse'); }")
        page.wait_for_timeout(500)

        share_btn = page.locator('button[aria-label="Share and export data"]').first
        share_btn.click()
        page.wait_for_timeout(400)

        master_excel_btn = page.locator("text=Export Master Excel (.xlsx)")
        with page.expect_download() as dl_pulse_info:
            master_excel_btn.click()
        dl_pulse = dl_pulse_info.value
        pulse_path = os.path.join(downloads_path, "pulse_master.xlsx")
        dl_pulse.save_as(pulse_path)
        print(f"✓ Pulse Master Excel downloaded: ({os.path.getsize(pulse_path)} bytes)")

        # Inspect pulse workbook with openpyxl
        wb_pulse = openpyxl.load_workbook(pulse_path, data_only=False)
        ds_pulse = wb_pulse["Executive Dashboard"]
        # Check tab color
        tab_pulse = ds_pulse.sheet_properties.tabColor
        print(f"✓ Pulse Executive Dashboard tabColor: {tab_pulse.rgb if tab_pulse else 'None'}")
        # Pulse primary is 38BDF8 (FF38BDF8)
        assert tab_pulse and "38BDF8" in str(tab_pulse.rgb).upper(), f"Expected tabColor to contain 38BDF8, got {tab_pulse.rgb if tab_pulse else None}"

        # -----------------------------------------------------------------
        # TEST 2: SWITCH TO LIGHT THEME ("origin" - classic enterprise teal)
        # -----------------------------------------------------------------
        print("\n--- TEST 2: Exporting under 'origin' Enterprise Light Theme ---")
        page.evaluate("() => { if (window.setTheme) window.setTheme('origin'); document.documentElement.setAttribute('data-theme', 'origin'); document.documentElement.setAttribute('data-color-mode', 'light'); }")
        page.wait_for_timeout(600)

        share_btn = page.locator('button[aria-label="Share and export data"]').first
        share_btn.click()
        page.wait_for_timeout(400)

        master_excel_btn = page.locator("text=Export Master Excel (.xlsx)")
        with page.expect_download() as dl_origin_info:
            master_excel_btn.click()
        dl_origin = dl_origin_info.value
        origin_path = os.path.join(downloads_path, "origin_master.xlsx")
        dl_origin.save_as(origin_path)
        print(f"✓ Origin Master Excel downloaded: ({os.path.getsize(origin_path)} bytes)")

        wb_origin = openpyxl.load_workbook(origin_path, data_only=False)
        ds_origin = wb_origin["Executive Dashboard"]
        tab_origin = ds_origin.sheet_properties.tabColor
        print(f"✓ Origin Executive Dashboard tabColor: {tab_origin.rgb if tab_origin else 'None'}")
        # Origin primary is 0F4C5C (FF0F4C5C)
        assert tab_origin and "0F4C5C" in str(tab_origin.rgb).upper(), f"Expected tabColor to contain 0F4C5C, got {tab_origin.rgb if tab_origin else None}"

        # Check Tasks sheet header and cell styling in light theme
        ts_origin = wb_origin["Tasks"]
        hdr_cell = ts_origin.cell(7, 3) # Module column header styled with palette.indigo
        hdr_fill = hdr_cell.fill.start_color.rgb
        print(f"✓ Origin Tasks Module header fill: {hdr_fill}")
        assert "0F4C5C" in str(hdr_fill).upper(), f"Expected Tasks header fill to match Origin theme primary (0F4C5C), got {hdr_fill}"

        # Check zebra data row text color in light theme (must be dark text FF0F172A)
        data_cell = ts_origin.cell(8, 2) # Task name cell
        data_font_color = str(data_cell.font.color.rgb if data_cell.font and data_cell.font.color else '')
        print(f"✓ Origin Data cell font color: {data_font_color}")
        assert "0F172A" in data_font_color or "000000" in data_font_color, f"Expected dark font color for light theme, got {data_font_color}"

        # -----------------------------------------------------------------
        # TEST 3: VIEW-SPECIFIC EXCEL EXPORT UNDER THEME ("nova" - vibrant indigo)
        # -----------------------------------------------------------------
        print("\n--- TEST 3: Tasks View Excel Export under 'nova' Theme ---")
        page.evaluate("() => { if (window.setTheme) window.setTheme('nova'); document.documentElement.setAttribute('data-theme', 'nova'); }")
        page.wait_for_timeout(600)
        page.goto("http://localhost:3000/#/tasks")
        page.wait_for_timeout(800)

        with page.expect_download() as dl_nova_info:
            page.locator("button:has-text('Export Tasks')").first.click()
        dl_nova = dl_nova_info.value
        nova_path = os.path.join(downloads_path, "nova_tasks.xlsx")
        dl_nova.save_as(nova_path)
        print(f"✓ Nova Tasks Excel downloaded: ({os.path.getsize(nova_path)} bytes)")

        wb_nova = openpyxl.load_workbook(nova_path, data_only=False)
        ts_nova = wb_nova["Tasks Matrix"]
        # Nova primary is 6366F1
        hdr_nova = ts_nova.cell(7, 2) # Module column
        print(f"✓ Nova Tasks Matrix header fill: {hdr_nova.fill.start_color.rgb}")
        assert "6366F1" in str(hdr_nova.fill.start_color.rgb).upper(), f"Expected Nova primary header fill (6366F1), got {hdr_nova.fill.start_color.rgb}"

        # -----------------------------------------------------------------
        # TEST 4: DELIVERY TEMPLATE EXPORT UNDER THEME ("terracotta")
        # -----------------------------------------------------------------
        print("\n--- TEST 4: Delivery Template Export under 'terracotta' Theme ---")
        deliv_nav = page.locator('button:has-text("ALM Deliveries"), a:has-text("ALM Deliveries")').first
        if deliv_nav.is_visible():
            deliv_nav.click()
        else:
            page.evaluate("() => { if (window.location.hash !== '#/deliveries') window.location.hash = '#/deliveries'; }")
        page.wait_for_timeout(800)

        page.evaluate("() => { if (window.setTheme) window.setTheme('terracotta'); document.documentElement.setAttribute('data-theme', 'terracotta'); }")
        page.wait_for_timeout(600)

        tpl_btn = page.locator('[data-testid="download-delivery-template-button"]')
        with page.expect_download() as dl_tpl_info:
            tpl_btn.click()
        dl_tpl = dl_tpl_info.value
        tpl_path = os.path.join(downloads_path, "terracotta_template.xlsx")
        dl_tpl.save_as(tpl_path)
        print(f"✓ Terracotta Delivery Template downloaded: ({os.path.getsize(tpl_path)} bytes)")

        wb_tpl = openpyxl.load_workbook(tpl_path, data_only=False)
        ws_tpl = wb_tpl["Deliveries_Template"]
        # Terracotta primary is E05A47
        tab_tpl = ws_tpl.sheet_properties.tabColor
        hdr_tpl = ws_tpl.cell(1, 1).fill.start_color.rgb
        print(f"✓ Terracotta Template tabColor: {tab_tpl.rgb if tab_tpl else 'None'}, header fill: {hdr_tpl}")
        assert tab_tpl and "E05A47" in str(tab_tpl.rgb).upper(), f"Expected Terracotta tabColor E05A47, got {tab_tpl.rgb if tab_tpl else None}"
        assert "E05A47" in str(hdr_tpl).upper(), f"Expected Terracotta header fill E05A47, got {hdr_tpl}"

        print("\n=======================================================")
        print("🎉 ALL THEME-AWARE EXCEL EXPORT TESTS PASSED 100%!")
        print("=======================================================")
        browser.close()

if __name__ == "__main__":
    test_excel_theme_awareness()
