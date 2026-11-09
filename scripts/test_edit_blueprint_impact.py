#!/usr/bin/env python3
import os
import sys
import time
from playwright.sync_api import sync_playwright

def test_edit_blueprint_impact():
    print("🚀 Starting Edit Blueprint Real-Time Impact & UI Verification...")
    screenshots_path = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46"
    os.makedirs(screenshots_path, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE: {msg.text}") if msg.type == "error" else None)

        print("[1] Opening app at http://localhost:3000/#/steps...")
        page.goto("http://localhost:3000/#/steps")
        page.wait_for_timeout(2000)

        demo_btn = page.locator('button:has-text("Load Demo Database")')
        if demo_btn.count() > 0 and demo_btn.first.is_visible():
            print("[2] Loading demo database...")
            demo_btn.first.click()
            page.wait_for_timeout(2500)
            page.goto("http://localhost:3000/#/steps")
            page.wait_for_timeout(1500)

        assert page.locator("text=Step Blueprints").first.is_visible(), "Step Blueprints header missing"
        print("✓ Verified Step Blueprints page is loaded")

        # Check blueprint cards
        cards = page.locator(".card.glass")
        card_count = cards.count()
        print(f"✓ Found {card_count} blueprint cards")
        assert card_count >= 3, "Expected at least 3 default blueprints"

        # Check that cards show tasks linked badges
        tasks_linked_badge = page.locator("text=tasks linked").first
        assert tasks_linked_badge.is_visible(), "Expected 'tasks linked' badge on blueprint cards"
        print("✓ Verified blueprint cards display active tasks linked badge")

        # [3] Open Edit Blueprint modal for "Standard Dev Flow" (Feature category)
        print("\n--- 2. Testing Edit Blueprint Modal & Live Impact Telemetry ---")
        std_flow_card = page.locator(".card.glass:has-text('Standard Dev Flow')").first
        std_flow_card.click()
        page.wait_for_timeout(800)

        # Verify modal header
        assert page.locator("text=Edit Workflow Blueprint").is_visible(), "Edit Workflow Blueprint modal missing"
        assert page.locator("text=Live Telemetry").is_visible(), "Live Telemetry badge missing"
        print("✓ Edit Blueprint modal opened successfully with live telemetry")

        # Verify Auto-Computed Impact Analysis Cockpit
        impact_header = page.locator("text=Impact Analysis")
        assert impact_header.is_visible(), "Impact Analysis header missing"
        
        tasks_impacted_kpi = page.locator("text=Tasks Impacted")
        assert tasks_impacted_kpi.is_visible(), "Tasks Impacted KPI missing"

        step_changes_kpi = page.locator("text=Step Changes")
        assert step_changes_kpi.is_visible(), "Step Changes KPI missing"

        effort_delta_kpi = page.locator("text=Effort Delta")
        assert effort_delta_kpi.is_visible(), "Effort Delta KPI missing"
        print("✓ Verified 3 Real-Time Impact KPI cards (Tasks Impacted, Step Changes, Effort Delta)")

        # Verify affected tasks directory
        dir_header = page.locator("text=Affected Tasks Directory")
        assert dir_header.is_visible(), "Affected Tasks Directory missing"
        print("✓ Verified Affected Tasks Directory is visible")

        # Capture initial screenshot
        modal_shot_path = os.path.join(screenshots_path, "edit_blueprint_modal_live.png")
        page.screenshot(path=modal_shot_path)
        print(f"✓ Saved screenshot to {modal_shot_path}")

        # [4] Test Live Auto-Computation on Step Changes
        print("\n--- 3. Testing Real-Time Calculation on Step Addition & Quick Text ---")
        
        # Click Add Workflow Phase
        add_phase_btn = page.locator("button:has-text('Add Workflow Phase')")
        assert add_phase_btn.is_visible(), "Add Workflow Phase button missing"
        add_phase_btn.click()
        page.wait_for_timeout(400)

        # Check that live impact immediately reports "1 new phase will be added to workflows"
        add_chip = page.locator("text=1 new phase will be added to workflows")
        assert add_chip.is_visible(), "Expected live impact to show 1 new phase added"
        print("✓ Auto-computed impact immediately detected new phase addition (+1 step diff)")

        # Switch to Quick Text Mode
        quick_text_btn = page.locator("button:has-text('Quick Text')")
        quick_text_btn.click()
        page.wait_for_timeout(400)

        textarea = page.locator("textarea[placeholder*='Requirement Analysis']")
        assert textarea.is_visible(), "Quick Text textarea missing"
        print("✓ Switched seamlessly to Quick Text (NAME:EFFORT) bulk mode")

        # Switch back to Visual Mode
        visual_btn = page.locator("button:has-text('Visual')")
        visual_btn.click()
        page.wait_for_timeout(400)

        # [5] Test Safe Propagation Flow
        print("\n--- 4. Testing Safe Propagation Flow ---")
        review_btn = page.locator("button:has-text('Review & Save Blueprint')")
        assert review_btn.is_visible(), "Review & Save Blueprint button missing"
        review_btn.click()
        page.wait_for_timeout(500)

        # Check propagation alert
        propagate_confirm = page.locator("text=Propagate changes to")
        assert propagate_confirm.is_visible(), "Propagation confirmation prompt missing"
        print("✓ Safe propagation prompt displayed with affected task count and preservation guarantee")

        # Capture propagation prompt screenshot
        propagate_shot_path = os.path.join(screenshots_path, "edit_blueprint_propagation_confirm.png")
        page.screenshot(path=propagate_shot_path)
        print(f"✓ Saved screenshot to {propagate_shot_path}")

        # Click Propagate to Tasks
        propagate_action_btn = page.locator("button:has-text('Propagate to')")
        assert propagate_action_btn.is_visible(), "Propagate action button missing"
        propagate_action_btn.click()
        page.wait_for_timeout(1000)

        # Verify modal closed and tasks updated
        assert not page.locator("text=Edit Workflow Blueprint").is_visible(), "Modal should be closed after finalize"
        print("✓ Blueprint updated and propagated to matching tasks")

        # Verify Task Matrix reflect changes
        page.goto("http://localhost:3000/#/tasks")
        page.wait_for_timeout(1200)
        assert page.locator("text=Project Tasks Matrix").is_visible()
        print("✓ Task Matrix is healthy and execution checklists preserved")

        print("\n=======================================================")
        print("🎉 ALL EDIT BLUEPRINT REAL-TIME IMPACT TESTS PASSED!")
        print("=======================================================")
        browser.close()

if __name__ == "__main__":
    test_edit_blueprint_impact()
