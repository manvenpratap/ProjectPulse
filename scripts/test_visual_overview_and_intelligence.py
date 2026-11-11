import sys
from playwright.sync_api import sync_playwright

def test_visual_overview_and_intelligence():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 950})
        page = context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE ERROR: {msg.text}") if msg.type == "error" else None)

        print("[1] Loading ProjectPulse at localhost:3000...")
        page.goto("http://localhost:3000")
        page.wait_for_timeout(1500)

        # Load demo database if empty
        demo_btn = page.locator('button:has-text("Load Demo Database"), button:has-text("Load Sample: Web")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            demo_btn.first.click()
            page.wait_for_timeout(1500)

        # -------------------------------------------------------------
        # STEP 1: Verify Executive Overview is Visual-Only
        # -------------------------------------------------------------
        print("\n--- STEP 1: Verify Executive Overview is Visual-Only ---")
        page.goto("http://localhost:3000/#/overview")
        page.wait_for_timeout(1000)

        assert page.locator("header h1:has-text('Executive Overview')").is_visible(), "Executive Overview title missing"

        # 1. Visual Bento Hero Elements Present
        assert page.locator("text=Composite Health Index").is_visible(), "Composite Health Index dial missing"
        assert page.locator("text=Milestone Delivery Radar").is_visible(), "Milestone Delivery Radar missing"
        assert page.locator("text=Early Warning Signals").is_visible(), "Early Warning Signals missing"

        # 2. Visual Metric Tiles Present
        assert page.locator("text=Scope Completed").is_visible(), "Scope Completed tile missing"
        assert page.locator("text=Effort Burned").is_visible(), "Effort Burned tile missing"
        assert page.locator("text=Team Bandwidth").is_visible(), "Team Bandwidth tile missing"
        assert page.locator("text=Governance Index").is_visible(), "Governance Index tile missing"

        # 3. Visual Deliverables & Module Architecture Present
        assert page.locator("text=Strategic Deliverables Snapshot").is_visible(), "Deliverables snapshot missing"
        assert page.locator("text=Module Gravity").is_visible(), "Module Gravity missing"
        assert page.locator("text=Looking for granular metrics and scenario modeling?").is_visible(), "Intelligence deep-dive banner missing"

        # 4. Detailed Granular Elements MUST NOT BE on Executive Overview
        assert page.locator("text=Strategic What-If Sandbox").count() == 0, "What-If Sandbox should NOT be on visual overview"
        assert page.locator("text=Resource Utilization Matrix").count() == 0, "Resource Utilization Matrix should NOT be on visual overview"
        assert page.locator("text=Steering Decisions Log").count() == 0, "Steering Decisions Log should NOT be on visual overview"
        assert page.locator("text=Project History Change Delta").count() == 0, "History Change Delta should NOT be on visual overview"
        print("✓ Verified Executive Overview is 100% visual with zero granular clutter")

        # -------------------------------------------------------------
        # STEP 2: Navigate to Intelligence Section via Action Button
        # -------------------------------------------------------------
        print("\n--- STEP 2: Navigate to Intelligence via Executive Action ---")
        launch_btn = page.locator("button:has-text('Intelligence Cockpit'), button:has-text('Launch Intelligence Cockpit')").first
        launch_btn.click()
        page.wait_for_timeout(1000)

        assert page.locator("text=Project Intelligence Cockpit").is_visible(), "Failed to navigate to Intelligence Cockpit"
        print("✓ Successfully navigated to Project Intelligence Cockpit")

        # -------------------------------------------------------------
        # STEP 3: Verify Detailed Metrics in Intelligence (Tab 1)
        # -------------------------------------------------------------
        print("\n--- STEP 3: Verify Detailed Metrics in Tab 1 (Predictive & Simulation) ---")
        # Verify What-If Sandbox is present in Intelligence
        assert page.locator("text=Strategic What-If Sandbox").is_visible(), "What-If Sandbox missing in Intelligence"
        assert page.locator("text=Additional Engineering Resources").is_visible(), "FTE slider missing in What-If Sandbox"
        assert page.locator("text=Scope Descoping / Backlog Reduction").is_visible(), "Scope slider missing in What-If Sandbox"
        assert page.locator("text=Timeline Schedule Compression").is_visible(), "Timeline slider missing in What-If Sandbox"
        assert page.locator("button:has-text('Commit Simulation')").is_visible(), "Commit simulation button missing"

        # Verify Resource Utilization Matrix is present in Intelligence
        assert page.locator("text=Resource Utilization Matrix").is_visible(), "Resource Utilization Matrix missing in Intelligence"
        assert page.locator("text=Workload Intensity").first.is_visible(), "Workload intensity metric missing"
        assert page.locator("text=Member Directory").first.is_visible(), "Member directory counter missing"

        # Verify Monte Carlo, Bottlenecks, and Critical Path
        assert page.locator("text=Predictive Completion").is_visible(), "Predictive completion missing"
        assert page.locator("text=Dependency Bottlenecks").is_visible(), "Dependency bottlenecks missing"
        assert page.locator("text=Critical Path Risk & Schedule Drift").is_visible(), "Critical path risk missing"
        print("✓ Verified Tab 1 holds Strategic What-If Sandbox, Resource Utilization Matrix, and Monte Carlo telemetry")

        # -------------------------------------------------------------
        # STEP 4: Verify Tab 2 (Delivery Flow & Velocity)
        # -------------------------------------------------------------
        print("\n--- STEP 4: Verify Tab 2 (Delivery Flow & Velocity) ---")
        page.locator("button:has-text('Delivery Flow & Velocity')").first.click()
        page.wait_for_timeout(600)
        assert page.locator("text=Weekly Delivery Velocity Band & Benchmark").is_visible(), "Velocity Band missing"
        assert page.locator("text=Module Architecture Maturity").is_visible(), "Module matrix missing"
        print("✓ Verified Tab 2 Delivery Flow and Enhanced Velocity Band")

        # -------------------------------------------------------------
        # STEP 5: Verify Tab 4 (Quality & Governance Detailed Metrics)
        # -------------------------------------------------------------
        print("\n--- STEP 5: Verify Detailed Metrics in Tab 4 (Quality & Governance) ---")
        page.get_by_role("button", name="Quality & Governance", exact=True).click()
        page.wait_for_timeout(800)

        assert page.locator("text=Quality Reliability Index").is_visible(), "Quality Reliability donut missing"
        assert page.locator("text=Defect Pipeline Progression").is_visible(), "Defect Pipeline bar chart missing"
        assert page.locator("text=RAID Governance Threat Heatmap").is_visible(), "RAID threat heatmap missing"

        # Verify Steering Decisions Log and Change History Delta moved here
        assert page.locator("text=Steering Decisions Log").is_visible(), "Steering Decisions Log missing in Quality & Governance"
        assert page.locator("text=Project History Change Delta").is_visible(), "Project History Change Delta missing in Quality & Governance"
        print("✓ Verified Tab 4 holds Steering Decisions Log, Project History Change Delta, Defects, and RAID")

        # -------------------------------------------------------------
        # STEP 6: Check for Critical Console Errors
        # -------------------------------------------------------------
        critical_errors = [e for e in errors if "favicon" not in e.lower() and "font" not in e.lower()]
        assert len(critical_errors) == 0, f"Critical browser errors encountered: {critical_errors}"

        print("\n=======================================================")
        print("🎉 ALL VISUAL OVERVIEW & DETAILED INTELLIGENCE TESTS PASSED!")
        print("=======================================================")
        browser.close()

if __name__ == "__main__":
    test_visual_overview_and_intelligence()
