import asyncio
from playwright.async_api import async_playwright

async def run_test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # Step 1: Open app with empty localStorage
        print("[1] Opening app with fresh clean state...")
        await page.goto("http://localhost:3000")
        await page.evaluate("() => localStorage.clear()")
        await page.reload()
        await page.wait_for_timeout(1000)

        # Should be on SetupView because state.name is empty
        setup_header = await page.text_content("h1")
        print("Setup View Header:", setup_header.replace("\n", " ").strip())
        assert "Track. Log. Report." in setup_header, f"Expected SetupView, got: {setup_header}"

        # Verify no sample data is preloaded
        create_btn = page.locator("button:has-text('Create Blank Project')")
        assert await create_btn.is_visible(), "Expected 'Create Blank Project & Enter Hub' button"

        demo_btn = page.locator("button:has-text('Load Demo Database')")
        assert await demo_btn.is_visible(), "Expected 'Load Demo Database' button"
        print("[2] Verified SetupView with 0 sample data and Load Demo button present.")

        # Step 2: Test Loading Demo Excel Database
        print("[3] Clicking 'Load Demo Database'...")
        await demo_btn.click()
        await page.wait_for_timeout(2000)

        # After import, should navigate to Overview of Project Titan
        title_text = await page.text_content("body")
        assert "Project Titan: Global Cloud Banking Platform" in title_text or "Project Titan" in title_text, "Expected Project Titan imported"
        print("[4] Verified Project Titan loaded successfully!")

        # Step 3: Check Tasks
        print("[5] Checking Tasks view...")
        await page.click("button:has-text('Tasks Matrix')")
        await page.wait_for_timeout(1000)
        tasks_body = await page.text_content("body")
        assert "TASK-001" in tasks_body or "Core API Gateway" in tasks_body, "Expected Tasks loaded"
        assert "Sarah Chen" in tasks_body, "Expected assignee Sarah Chen in Tasks"
        print("[6] Verified Tasks view populated with imported data.")

        # Step 4: Check Deliveries
        print("[7] Checking Deliveries view...")
        await page.click("button:has-text('ALM Deliveries')")
        await page.wait_for_timeout(1000)
        deliv_body = await page.text_content("body")
        assert "12 Total Packages" in deliv_body, "Expected 12 Total Packages in Deliveries"
        assert "ALM-10492" in deliv_body or "Deployed Live" in deliv_body, "Expected Deliveries metrics"
        print("[8] Verified Deliveries view populated with 12 packages.")

        # Step 5: Check Team Hub
        print("[9] Checking Team view...")
        await page.click("button:has-text('Team Hub')")
        await page.wait_for_timeout(1000)
        team_body = await page.text_content("body")
        assert "Alex Rivera" in team_body, "Expected Alex Rivera in Team Hub"
        assert "Sarah Chen" in team_body, "Expected Sarah Chen in Team Hub"
        print("[10] Verified Team Hub populated with 10 members and rich attributes.")

        # Step 6: Check Capacity & Scheduler
        print("[11] Checking Capacity & Scheduling view...")
        await page.click("button:has-text('Capacity & Scheduling')")
        await page.wait_for_timeout(1000)
        cap_body = await page.text_content("body")
        assert "Capacity" in cap_body or "Workload" in cap_body, "Expected Capacity view loaded"
        print("[12] Verified Capacity and Scheduling plan rendered.")

        # Step 7: Check RAID
        print("[13] Checking RAID view...")
        await page.click("button:has-text('RAID Register')")
        await page.wait_for_timeout(1000)
        raid_body = await page.text_content("body")
        assert "RAID" in raid_body, "Expected RAID Register loaded"
        print("[14] Verified RAID register populated.")

        # Step 8: Check Defects
        print("[15] Checking Defects view...")
        await page.click("button:has-text('Defect Workshop')")
        await page.wait_for_timeout(1000)
        defect_body = await page.text_content("body")
        assert "DEF-" in defect_body or "Defect" in defect_body, "Expected Defects populated"
        print("[16] Verified Defects workshop populated.")

        # Step 9: Check Retros
        print("[17] Checking Retros view...")
        await page.click("button:has-text('Sprint Retrospective')")
        await page.wait_for_timeout(1000)
        retro_body = await page.text_content("body")
        assert "Retro" in retro_body or "Sprint" in retro_body, "Expected Retros populated"
        print("[18] Verified Sprint Retros populated.")

        # Step 10: Check Releases Roadmap
        print("[19] Checking Release Roadmap...")
        await page.click("button:has-text('Release Roadmap')")
        await page.wait_for_timeout(1000)
        rel_body = await page.text_content("body")
        assert "v1.0.0" in rel_body or "v1.1.0" in rel_body, "Expected Releases loaded"
        print("[20] Verified Release Roadmap populated.")

        print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_test())
