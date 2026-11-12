import sys
from playwright.sync_api import sync_playwright

def test_in_app_help_and_tooltips():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE ERROR: {msg.text}") if msg.type == "error" else None)

        print("[1] Loading ProjectPulse at localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(2000)

        # Load demo database if empty
        demo_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            demo_btn.first.click()
            page.wait_for_timeout(1500)

        # -------------------------------------------------------------
        # TEST 1: Topbar Help Icon -> Opens Contextual Screen Guide
        # -------------------------------------------------------------
        print("\n--- TEST 1: Topbar Help Icon & Contextual Screen Guide ---")
        help_btn = page.locator('button[title="Help & Screen Guide (F1 or ?)"]')
        assert help_btn.is_visible(), "Help button not found in Topbar"
        help_btn.click()
        page.wait_for_timeout(500)

        # Verify Modal Title and Content
        assert page.locator("text=Platform Operations & Screen Knowledge Guide").is_visible(), "Help modal not open"
        assert page.locator("text=Executive Overview & Steering Guide").is_visible(), "Overview screen guide not shown by default"
        assert page.locator("text=Key Fields, Metrics & Formulas").is_visible(), "Key Fields section missing"
        assert page.locator("text=Core Capabilities & Workflows").is_visible(), "Core Capabilities section missing"
        assert page.locator("text=Pro Tips & Best Practices").is_visible(), "Pro Tips section missing"
        print("✓ Contextual Executive Overview guide rendered with metrics and formulas")

        # -------------------------------------------------------------
        # TEST 2: Screen Guide View Selector
        # -------------------------------------------------------------
        print("\n--- TEST 2: Screen Guide View Selector ---")
        view_select = page.locator('select[aria-label="Select screen to view help guide"]')
        assert view_select.is_visible(), "Screen selector dropdown missing"
        
        # Switch to Tasks Matrix guide
        view_select.select_option("tasks")
        page.wait_for_timeout(300)
        assert page.locator("text=Tasks Matrix & Execution Grid Guide").is_visible(), "Tasks guide not loaded"
        assert page.locator("text=Execution Cockpit").is_visible(), "Tasks badge missing"
        print("✓ Switched to Tasks Matrix guide successfully")

        # Switch to ALM Deliveries guide
        view_select.select_option("deliveries")
        page.wait_for_timeout(300)
        assert page.locator("text=ALM Deliveries & Packaging Guide").is_visible(), "Deliveries guide not loaded"
        assert page.locator("text=Packaging & Sign-off").is_visible(), "Deliveries badge missing"
        print("✓ Switched to ALM Deliveries guide successfully")

        # -------------------------------------------------------------
        # TEST 3: Fields & Metrics Standard Dictionary
        # -------------------------------------------------------------
        print("\n--- TEST 3: Fields & Metrics Standard Dictionary ---")
        fields_tab = page.locator("button:has-text('Fields & Metrics')")
        fields_tab.click()
        page.wait_for_timeout(300)

        assert page.locator("text=Standard data dictionary describing core task and delivery attributes").is_visible()
        assert page.get_by_text("Complexity Rating", exact=True).is_visible(), "Complexity Rating field missing"
        assert page.get_by_text("Estimated Effort", exact=True).is_visible(), "Estimated Effort field missing"
        assert page.get_by_text("Baseline Dates", exact=True).is_visible(), "Baseline Dates field missing"
        print("✓ Standard fields dictionary rendered")

        # Search field dictionary
        search_input = page.locator('input[placeholder="Search fields..."]')
        search_input.fill("Complexity")
        page.wait_for_timeout(300)
        assert page.locator("text=Complexity Rating").is_visible()
        search_input.fill("")

        # -------------------------------------------------------------
        # TEST 4: Keyboard Shortcuts & Quickstart Tab
        # -------------------------------------------------------------
        print("\n--- TEST 4: Keyboard Shortcuts & Quickstart ---")
        shortcuts_tab = page.locator("button:has-text('Shortcuts')")
        shortcuts_tab.click()
        page.wait_for_timeout(300)

        assert page.locator("text=Open Global Search & Quick-Jump").is_visible(), "Search shortcut missing"
        assert page.locator("text=F1 or ?").is_visible(), "F1 help shortcut missing"
        assert page.locator("text=Offline-First Engine").is_visible(), "Architecture notes missing"
        print("✓ Keyboard shortcuts and architecture notes verified")

        # Close modal
        got_it_btn = page.locator("button:has-text('Got It!')")
        got_it_btn.click()
        page.wait_for_selector("text=Platform Operations & Screen Knowledge Guide", state="hidden", timeout=3000)
        print("✓ Help modal closed cleanly")

        # -------------------------------------------------------------
        # TEST 5: Keyboard F1 / ? Trigger
        # -------------------------------------------------------------
        print("\n--- TEST 5: Keyboard F1 / ? Trigger ---")
        page.keyboard.press("F1")
        page.wait_for_timeout(400)
        assert page.locator("text=Platform Operations & Screen Knowledge Guide").is_visible(), "F1 shortcut did not open help"
        page.keyboard.press("Escape")
        page.wait_for_timeout(400)
        print("✓ F1 hotkey opened help and Escape closed it")

        # -------------------------------------------------------------
        # TEST 6: PageHeader Contextual Help Button
        # -------------------------------------------------------------
        print("\n--- TEST 6: PageHeader Contextual Help Button ---")
        page_help_btn = page.locator('header button[aria-label*="Guide: How"]')
        assert page_help_btn.count() > 0, "PageHeader help button not found"
        page_help_btn.first.click()
        page.wait_for_timeout(400)
        assert page.locator("text=Platform Operations & Screen Knowledge Guide").is_visible(), "PageHeader button did not open help"
        page.keyboard.press("Escape")
        page.wait_for_timeout(400)
        print("✓ PageHeader help icon opened guide")

        # -------------------------------------------------------------
        # TEST 7: Sidebar 'How this view works' Button
        # -------------------------------------------------------------
        print("\n--- TEST 7: Sidebar 'How this view works' Button ---")
        sb_help_btn = page.locator("aside button:has-text('How this view works')")
        assert sb_help_btn.is_visible(), "Sidebar 'How this view works' button missing"
        sb_help_btn.click()
        page.wait_for_timeout(400)
        assert page.locator("text=Platform Operations & Screen Knowledge Guide").is_visible(), "Sidebar button did not open help"
        page.keyboard.press("Escape")
        page.wait_for_timeout(400)
        print("✓ Sidebar 'How this view works' button opened guide")

        # -------------------------------------------------------------
        # TEST 8: Enhanced Table Column Tooltips
        # -------------------------------------------------------------
        print("\n--- TEST 8: Table Column Tooltips ---")
        # Navigate to Tasks
        page.goto("http://localhost:3000/#tasks")
        page.wait_for_timeout(800)

        # Check tooltips on Task table headers
        task_id_th = page.locator('th[title*="Unique persistent task identifier"]')
        assert task_id_th.count() > 0, "Task ID tooltip missing"

        module_th = page.locator('th[title*="Functional architectural domain"]')
        assert module_th.count() > 0, "Module tooltip missing"

        status_th = page.locator('th[title*="Current task lifecycle state"]')
        assert status_th.count() > 0, "Status tooltip missing"

        prio_th = page.locator('th[title*="Execution urgency"]')
        assert prio_th.count() > 0, "Priority tooltip missing"

        assignee_th = page.locator('th[title*="Accountable module owner"]')
        assert assignee_th.count() > 0, "Assignee tooltip missing"

        progress_th = page.locator('th[title*="Granular completion percentage"]')
        assert progress_th.count() > 0, "Progress tooltip missing"
        print("✓ Tasks matrix table column tooltips verified")

        # Navigate to Deliveries
        page.goto("http://localhost:3000/#deliveries")
        page.wait_for_timeout(800)
        alm_th = page.locator('th[title*="Application Lifecycle Management tracking ID"]')
        assert alm_th.count() > 0, "ALM ID tooltip missing"
        signoff_th = page.locator('th[title*="Quality and stakeholder sign-off status"]')
        assert signoff_th.count() > 0, "Sign-off tooltip missing"
        print("✓ Deliveries matrix table column tooltips verified")

        # Navigate to Defects
        page.goto("http://localhost:3000/#defects")
        page.wait_for_timeout(800)
        def_id_th = page.locator('th[title*="Persistent defect identifier"]')
        assert def_id_th.count() > 0, "Defect ID tooltip missing"
        sev_th = page.locator('th[title*="Impact severity tier"]')
        assert sev_th.count() > 0, "Severity tooltip missing"
        print("✓ Defect workshop table column tooltips verified")

        # Navigate to RAID
        page.goto("http://localhost:3000/#risks")
        page.wait_for_timeout(800)
        raid_th = page.locator('th[title*="Identifier and RAID category"]')
        assert raid_th.count() > 0, "RAID tooltip missing"
        print("✓ RAID register table column tooltips verified")

        # -------------------------------------------------------------
        # TEST 9: Section-Level Help Buttons & Decluttered Screens
        # -------------------------------------------------------------
        print("\n--- TEST 9: Section-Level Help Focus & Zero Feature Clutter ---")
        page.goto("http://localhost:3000/#overview")
        page.wait_for_timeout(600)
        assert page.locator("text=Verified Stream").count() == 0, "Verified Stream badge should be hidden"
        assert page.locator("text=Looking for granular metrics and scenario modeling?").count() == 0, "Overview promo copy should be hidden"
        health_help = page.locator('button[aria-label="Health Index formula and guide"]')
        assert health_help.is_visible(), "Health Index section help button missing"
        health_help.click()
        page.wait_for_timeout(400)
        assert page.locator("text=Section: Health Index").is_visible(), "Section focus banner missing in HelpModal"
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)

        page.goto("http://localhost:3000/#dash")
        page.wait_for_timeout(600)
        assert page.locator("text=Model: Gemini 1.5 Flash").count() == 0, "Gemini model footer badge should be hidden"
        assert page.locator("text=100 Monte Carlo runs").count() == 0, "100 Monte Carlo runs badge should be hidden"
        mc_help = page.locator('button[aria-label="Monte Carlo completion guide"]')
        assert mc_help.is_visible(), "Monte Carlo section help button missing"
        mc_help.click()
        page.wait_for_timeout(400)
        assert page.locator("text=Intelligence Dashboard & Analytics Guide").is_visible(), "Intelligence guide should be active"
        assert page.locator("text=Section: Monte Carlo Simulation").is_visible(), "Monte Carlo section focus missing"
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)

        page.goto("http://localhost:3000/#cxo")
        page.wait_for_timeout(600)
        assert page.locator("text=Outlook • Apple Mail • Gmail").count() == 0, "CXO mail client strip should be in Help"
        assert page.locator("text=Auto-Configures").count() == 0, "Auto-Configures badge should be hidden"
        cxo_help = page.locator('button[aria-label="CXO Email Briefing guide"]').first
        assert cxo_help.is_visible(), "CXO section help button missing"
        cxo_help.click()
        page.wait_for_timeout(400)
        assert page.locator("text=Section: CXO Email Briefing Studio").is_visible(), "CXO Help section focus missing"
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)

        page.goto("http://localhost:3000/#settings")
        page.wait_for_timeout(600)
        assert page.locator("text=System Architecture: Local-First Workstation").count() == 0, "Local-First explainer banner should be in Help"
        assert page.locator('button[aria-label="Excel Portability guide"]').is_visible(), "Settings Excel section help missing"

        page.goto("http://localhost:3000/#retro")
        page.wait_for_timeout(600)
        assert page.locator("text=Strong Psychological Safety").count() == 0, "Hardcoded retro tagline should be removed"
        assert page.locator('button[aria-label="Team Morale guide"]').is_visible(), "Retro section help missing"

        page.goto("http://localhost:3000/#fields")
        page.wait_for_timeout(600)
        assert page.locator("text=Enterprise Schema Synchronization").count() == 0, "Schema explainer card should be in Help"
        assert page.locator('button[aria-label="Core Attributes guide"]').is_visible(), "Field Architect core attributes help missing"
        print("✓ Section-level help focus & decluttered UI verified across views")

        browser.close()
        print("\n==========================================")
        print("ALL IN-APP HELP & TOOLTIP TESTS PASSED! 🎉")
        print("==========================================")

if __name__ == "__main__":
    test_in_app_help_and_tooltips()
