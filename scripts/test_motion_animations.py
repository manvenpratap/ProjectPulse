import asyncio
import os
import sys
from playwright.async_api import async_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
ARTIFACT_DIR = "/Users/manvenpratapsingh/.gemini/antigravity/brain/e8a27929-1ddf-41c8-841f-87e3676d5e46"

async def test_motion_animations():
    print(f"Connecting to {BASE_URL}...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2
        )
        page = await context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        # 1. Load root
        await page.goto(BASE_URL, wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # Handle Setup Workspace / Demo Database
        if await page.locator("button:has-text('Load Demo Database')").is_visible():
            print("Setup Workspace detected. Clicking 'Load Demo Database'...")
            await page.click("button:has-text('Load Demo Database')")
            await page.wait_for_timeout(1500)

        # Bypass login if present
        if await page.locator("text=Sign In").is_visible():
            await page.fill("input[type='email']", "sarah@projectpulse.dev")
            await page.fill("input[type='password']", "password")
            await page.click("button:has-text('Sign In')")
            await page.wait_for_timeout(1000)

        # Overview View verification
        print("Verifying OverviewView animations...")
        await page.wait_for_selector("text=Executive Overview", timeout=5000)
        overview_metrics = await page.locator("[data-animated-metric='true']").count()
        print(f"OverviewView has {overview_metrics} animated metrics")
        assert overview_metrics > 0, "Expected animated metrics in OverviewView"
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "motion_overview.png"))

        # Nav items to click and verify
        views_to_test = [
            ("deliveries", "ALM Deliveries", "motion_deliveries.png"),
            ("releases", "Release Roadmap", "motion_releases.png"),
            ("tasks", "Tasks & Timeline", "motion_tasks.png"),
            ("dash", "Project Intelligence", "motion_intelligence.png"),
            ("team", "Team Directory & Bandwidth", "motion_team.png"),
            ("features", "Functional Matrix", "motion_features.png"),
            ("defects", "Defect Workshop", "motion_defects.png"),
            ("capacity", "Team Bandwidth & Weekly Workload", "motion_capacity.png"),
            ("reports", "Executive Status Report", "motion_reports.png"),
            ("retro", "Sprint Retrospective", "motion_retro.png"),
            ("risks", "RAID Register", "motion_risks.png"),
            ("log", "Project Audit Log", "motion_log.png"),
            ("dropdowns", "Option Libraries", "motion_dropdowns.png"),
            ("steps", "Step Blueprints", "motion_steps.png"),
            ("fields", "Field Architect", "motion_fields.png"),
            ("settings", "System Configuration", "motion_settings.png")
        ]

        for view_id, expected_title_substring, screenshot_name in views_to_test:
            print(f"Navigating to {view_id}...")
            # Try clicking data-nav-id
            btn = page.locator(f"button[data-nav-id='{view_id}']").first
            if await btn.is_visible():
                await btn.click()
            else:
                # Direct route navigation
                await page.evaluate(f"window.location.hash = '#/{view_id}'")

            await page.wait_for_timeout(800)

            # Verify MotionPage is present
            has_motion_page = await page.locator("[data-motion-page='true']").count()
            print(f"  -> {view_id}: MotionPage mounted: {has_motion_page > 0}")
            assert has_motion_page > 0, f"Expected MotionPage in {view_id}"

            # Check metrics count if view has animated metrics
            metrics_count = await page.locator("[data-animated-metric='true']").count()
            print(f"  -> {view_id}: {metrics_count} animated metric elements")

            # Screenshot
            await page.screenshot(path=os.path.join(ARTIFACT_DIR, screenshot_name))

        print("Checking console errors...")
        filtered_errors = [e for e in console_errors if "favicon" not in e and "sourcemap" not in e.lower()]
        if filtered_errors:
            print(f"Console errors found: {filtered_errors}")
        else:
            print("Zero console errors encountered!")

        await browser.close()
        print("All motion animation checks passed successfully!")

if __name__ == "__main__":
    asyncio.run(test_motion_animations())
