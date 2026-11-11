import sys
from playwright.sync_api import sync_playwright

def test_parity_features():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        # Listen to console errors
        errors = []
        page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE ERROR: {msg.text}") if msg.type == "error" else None)

        print("1. Loading ProjectPulse at localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(2000)

        demo_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            demo_btn.first.click()
            page.wait_for_timeout(1500)

        # -------------------------------------------------------------
        # 1. SMART ALERTS CENTER
        # -------------------------------------------------------------
        print("2. Testing Smart Alerts Center...")
        bell_btn = page.locator('button[aria-label="Smart Alerts Center"]')
        assert bell_btn.count() > 0, "Bell button for Smart Alerts Center not found"
        bell_btn.click()
        page.wait_for_timeout(600)

        # Check Smart Alerts drawer
        assert page.locator("text=Smart Alerts Center").is_visible(), "Smart Alerts Center drawer not visible"
        # Check tabs
        assert page.locator("button:has-text('All (')").is_visible(), "All tab not visible"
        assert page.locator("button:has-text('Critical (')").is_visible(), "Critical tab not visible"
        assert page.locator("button:has-text('Warnings (')").is_visible(), "Warnings tab not visible"
        print("   - Smart Alerts Center drawer opened successfully with active filter tabs.")

        # Click Done to close
        done_btn = page.locator("button:has-text('Done')")
        if done_btn.is_visible():
            done_btn.click()
            page.wait_for_timeout(400)

        # -------------------------------------------------------------
        # 2. CXO EMAIL BRIEF (via Share & Export or Quick Modal Trigger)
        # -------------------------------------------------------------
        print("3. Testing Executive CXO Email Brief Modal...")
        page.evaluate("window.dispatchEvent(new CustomEvent('open-cxo-email'))")
        page.wait_for_timeout(600)

        # Verify CXO modal
        assert page.locator("text=Executive CXO Steering Email Brief").is_visible(), "CXO Email Brief modal not visible"
        assert page.locator("button:has-text('Fortnightly (14d)')").is_visible(), "Fortnightly cadence button not visible"
        page.locator("button:has-text('Fortnightly (14d)')").click()
        page.wait_for_timeout(300)

        # Toggle to Markdown mode
        md_tab = page.get_by_role("button", name="Markdown", exact=True)
        md_tab.click(force=True)
        page.wait_for_timeout(300)
        assert page.locator("pre").is_visible(), "Markdown preview container not visible"

        # Toggle back to HTML
        html_tab = page.get_by_role("button", name="Rich Email (HTML)", exact=True)
        html_tab.click(force=True)
        page.wait_for_timeout(300)

        # Close CXO modal
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)
        # If still visible, click close button
        close_cxo = page.locator("button[aria-label='Close modal']")
        if close_cxo.is_visible():
            close_cxo.click()
            page.wait_for_timeout(400)
        print("   - CXO Email Brief modal and preview verified successfully.")

        # -------------------------------------------------------------
        # 3. SCAFFOLDER BULK IMPORT & PRESETS
        # -------------------------------------------------------------
        print("4. Testing Scaffolder Bulk Module Import & Presets...")
        page.goto("http://localhost:3000/#scaffolder")
        page.wait_for_timeout(800)

        bulk_scaffold_btn = page.locator("button:has-text('Bulk Import & Presets')")
        assert bulk_scaffold_btn.is_visible(), "Bulk Import & Presets button not found in Scaffolder"
        bulk_scaffold_btn.click()
        page.wait_for_timeout(600)

        assert page.locator("text=Bulk Module & Architecture Presets").is_visible(), "Bulk Module modal not open"
        # Click on preset: Mobile Banking & FinTech
        fintech_preset = page.locator("button:has-text('Mobile Banking & FinTech')")
        assert fintech_preset.is_visible(), "Mobile Banking preset not visible"
        fintech_preset.click()
        page.wait_for_timeout(300)

        # Click Import Modules
        import_btn = page.locator("button:has-text('Import')").last
        import_btn.click()
        page.wait_for_timeout(600)

        # Verify newly imported modules exist in DOM
        input_values = page.eval_on_selector_all("input", "inputs => inputs.map(i => i.value)")
        assert "Core Banking Ledger" in input_values, f"Core Banking Ledger module was not imported, found: {input_values}"
        print("   - Scaffolder bulk module import with presets verified successfully.")

        # -------------------------------------------------------------
        # 4. REGISTRY BULK OPTION EDITOR
        # -------------------------------------------------------------
        print("5. Testing Registry Bulk Options Editor...")
        page.goto("http://localhost:3000/#dropdowns")
        page.wait_for_timeout(800)

        bulk_reg_btn = page.locator("button:has-text('Bulk Edit Options')")
        assert bulk_reg_btn.is_visible(), "Bulk Edit Options button not found in Registry"
        bulk_reg_btn.click()
        page.wait_for_timeout(600)

        assert page.locator("text=Bulk Edit:").is_visible(), "Bulk Edit modal not visible"
        # Click cancel to verify close
        page.locator("button:has-text('Cancel')").last.click()
        page.wait_for_timeout(400)
        print("   - Registry bulk options editor verified successfully.")

        # Check console errors
        # Filter benign favicon or harmless warnings
        real_errors = [e for e in errors if "favicon" not in e and "404" not in e]
        if real_errors:
            print("Console Errors encountered:")
            for err in real_errors:
                print("  ", err)
            raise AssertionError(f"Encountered {len(real_errors)} console errors during test")

        print("ALL TESTS PASSED WITH 0 ERRORS!")
        browser.close()

if __name__ == "__main__":
    test_parity_features()
