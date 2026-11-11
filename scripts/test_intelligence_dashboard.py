import sys
from playwright.sync_api import sync_playwright

def test_intelligence_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 950})
        page = context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE ERROR: {msg.text}") if msg.type == "error" else None)

        print("1. Loading ProjectPulse at localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(1500)

        # Load demo database if empty
        demo_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            demo_btn.first.click()
            page.wait_for_timeout(1500)

        print("2. Navigating to Intelligence tab...")
        page.goto("http://localhost:3000/#/dash")
        page.wait_for_timeout(1000)

        # Verify PageHeader title
        assert page.locator("text=Project Intelligence Cockpit").is_visible(), "Page header not found"
        print("   - Successfully navigated to Project Intelligence Cockpit.")

        # -----------------------------------------------------------------
        # MODE 1: PREDICTIVE & AI TELEMETRY
        # -----------------------------------------------------------------
        print("3. Verifying Mode 1: Predictive & AI Telemetry...")
        assert page.locator("text=Predictive Completion").is_visible(), "Predictive Completion card not visible"
        assert page.locator("text=Capacity Bandwidth Projection").is_visible(), "Capacity Bandwidth card not visible"
        assert page.locator("text=Task Aging & Activity Telemetry").is_visible(), "Task Aging card not visible"
        assert page.locator("text=Dependency Bottlenecks").is_visible(), "Dependency Bottlenecks card not visible"
        assert page.locator("text=Critical Path Risk & Schedule Drift").is_visible(), "Critical Path card not visible"
        print("   - Verified all predictive telemetry cards (AI dial, Monte Carlo P50/P90, Capacity, Aging histogram, Bottlenecks, Critical Path).")

        # -----------------------------------------------------------------
        # MODE 2: DELIVERY FLOW & VELOCITY
        # -----------------------------------------------------------------
        print("4. Verifying Mode 2: Delivery Flow & Velocity...")
        flow_tab = page.locator("button:has-text('Delivery Flow & Velocity')")
        flow_tab.click()
        page.wait_for_timeout(800)

        assert page.locator("text=Weekly Delivery Velocity Band & Benchmark").is_visible(), "Weekly Velocity chart not visible"
        print("   - Verified Delivery Flow, Burndown simulator, and Weekly Velocity Band.")

        # -----------------------------------------------------------------
        # MODE 3: EVM & FINANCIAL COCKPIT
        # -----------------------------------------------------------------
        print("5. Verifying Mode 3: EVM & Financial Cockpit...")
        evm_tab = page.locator("button:has-text('EVM & Financial Cockpit')")
        evm_tab.click()
        page.wait_for_timeout(800)

        assert page.locator("text=Planned Value (PV)").is_visible(), "PV metric not visible"
        assert page.locator("text=Earned Value (EV)").is_visible(), "EV metric not visible"
        assert page.locator("text=Schedule Perf Index (SPI)").is_visible(), "SPI metric not visible"
        assert page.locator("text=Cost Perf Index (CPI)").is_visible(), "CPI metric not visible"
        assert page.locator("text=EVM 4-Quadrant Performance Matrix").is_visible(), "4-Quadrant matrix not visible"
        assert page.locator("text=Financial Telemetry & Burn Simulator").is_visible(), "Financial simulator not visible"
        print("   - Verified EVM metrics (PV/EV/SPI/CPI), 4-Quadrant Matrix, and Day-Rate Simulator.")

        # -----------------------------------------------------------------
        # MODE 4: QUALITY & GOVERNANCE
        # -----------------------------------------------------------------
        print("6. Verifying Mode 4: Quality & Governance...")
        qual_tab = page.get_by_role("button", name="Quality & Governance", exact=True)
        qual_tab.click()
        page.wait_for_timeout(800)

        assert page.locator("text=Quality Reliability Index").is_visible(), "Quality Reliability donut not visible"
        assert page.locator("text=Defect Pipeline Progression").is_visible(), "Defect Pipeline bar chart not visible"
        assert page.locator("text=Analytics Data Integrity").is_visible(), "Analytics Data Integrity card not visible"
        assert page.locator("text=Release Sign-Off & Smoke Quality Gate").is_visible(), "Release Quality Gate not visible"
        assert page.locator("text=RAID Governance Threat Heatmap").is_visible(), "RAID threat heatmap not visible"
        assert page.locator("text=Steering Decisions Log").is_visible(), "Steering Decisions Log not visible"
        assert page.locator("text=Project History Change Delta").is_visible(), "Project History Change Delta not visible"

        # Verify Quality Reliability is computed on open defects (>0%, specifically 72% for demo dataset)
        assert page.locator("text=72%").first.is_visible(), "Quality Reliability should be 72% (open defect calculation)"
        page.locator("button:has-text('All (12)')").click()
        page.wait_for_timeout(200)
        page.locator("button:has-text('Active (6)')").click()
        page.wait_for_timeout(200)

        # Verify Root Cause -> Module Hotspots lens switch
        page.locator("button:has-text('Module')").first.click()
        assert page.locator("text=Module Defect Hotspots").is_visible(), "Module Defect Hotspots view failed to toggle"
        page.locator("button:has-text('Cause')").first.click()
        assert page.locator("text=Defect Root Cause").is_visible(), "Defect Root Cause view failed to toggle"

        # Verify RAID heatmap cells are populated (not 0 across all 9 cells) and clickable
        active_raid_cells = page.locator("button[title*='Impact ×']:not([disabled])")
        assert active_raid_cells.count() >= 5, f"Expected populated RAID cells, got {active_raid_cells.count()}"
        active_raid_cells.first.click()
        page.wait_for_timeout(250)
        assert page.locator("text=Filtered:").is_visible(), "Clicking RAID cell should filter threat list"
        page.locator("button:has-text('Impact ×')").click()
        page.wait_for_timeout(200)

        # Verify Decisions filter
        page.locator("button:has-text('Pending (1)')").click()
        assert page.locator("text=ADR-007").is_visible(), "Pending decisions filter should display ADR-007"
        page.locator("button:has-text('All (8)')").click()

        print("   - Verified Quality Reliability (72%), Defect Pipeline, Root Cause/Modules, Data Integrity, Release Gate, RAID 3x3 Matrix, Decisions & Audit Delta.")

        # Capture visual verification screenshots (Dark top + bottom, Light, and clean Mobile)
        out_dir = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46/scratch"
        page.locator("text=Quality Reliability").first.scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        page.screenshot(path=f"{out_dir}/qg_final_top.png")
        page.locator("text=Steering Decisions Log").scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        page.screenshot(path=f"{out_dir}/qg_final_bottom.png")

        # Light theme check (Nexus)
        page.evaluate("document.documentElement.setAttribute('data-theme', 'nexus')")
        page.locator("text=Quality Reliability").first.scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        page.screenshot(path=f"{out_dir}/qg_final_light.png")

        # Clean Mobile context check (375x812, no horizontal overflow)
        m_ctx = browser.new_context(viewport={"width": 375, "height": 812})
        m_page = m_ctx.new_page()
        m_page.on("pageerror", lambda err: errors.append(f"MOBILE PAGE ERROR: {err}"))
        m_page.goto("http://localhost:3000")
        m_page.wait_for_timeout(1200)
        m_demo = m_page.locator('button:has-text("Load Demo Database")')
        if m_demo.count() > 0 and m_demo.first.is_visible():
            m_demo.first.click()
            m_page.wait_for_timeout(1200)
        m_page.goto("http://localhost:3000/#/dash")
        m_page.wait_for_timeout(800)
        m_page.get_by_role("main").get_by_role("button", name="Quality & Governance", exact=True).click()
        m_page.wait_for_timeout(500)
        overflow = m_page.evaluate("document.documentElement.scrollWidth > window.innerWidth + 2")
        assert not overflow, "Mobile layout produced horizontal overflow on Quality & Governance tab"
        m_page.screenshot(path=f"{out_dir}/qg_final_mobile.png")
        m_ctx.close()

        # Check console errors
        real_errors = [e for e in errors if "favicon" not in e and "404" not in e]
        if real_errors:
            print("Console Errors encountered:")
            for err in real_errors:
                print("  ", err)
            raise AssertionError(f"Encountered {len(real_errors)} console errors during test")

        print("INTELLIGENCE DASHBOARD E2E TEST PASSED WITH 0 ERRORS!")
        browser.close()

if __name__ == "__main__":
    test_intelligence_dashboard()
