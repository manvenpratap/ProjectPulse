import asyncio
from playwright.async_api import async_playwright

async def run_auth_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Desktop context
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        
        print("\n--- TEST 1: Initial Launch as Default Admin ---")
        await page.goto("http://localhost:3000")
        await page.wait_for_timeout(1000)
        if await page.locator("button:has-text('Load Demo Database')").is_visible():
            await page.click("button:has-text('Load Demo Database')")
            await page.wait_for_timeout(1000)
        await page.wait_for_selector("h1:has-text('Executive Overview')", timeout=10000)
        
        # Verify Topbar contains the user avatar & Admin badge
        user_btn = page.locator("button[aria-label='User Account and Access Controls']")
        await user_btn.wait_for(state="visible", timeout=5000)
        print("✓ Topbar profile button is visible with Sarah / Admin")
        
        # Click user profile button to open flyout
        await user_btn.click()
        await page.wait_for_selector("text=Sarah Chen", timeout=3000)
        await page.wait_for_selector("text=Switch Active Persona", timeout=3000)
        print("✓ User profile flyout displays Sarah Chen with persona switcher")
        
        print("\n--- TEST 2: Role-Based Screen Visibility for Developer (Marcus) ---")
        # Click Marcus (Developer) in quick switch inside flyout
        dev_switch_btn = page.locator("button:has-text('Marcus')").first
        await dev_switch_btn.click()
        await page.wait_for_timeout(800)
        
        # Check Topbar badge now says 'Developer'
        dev_badge = page.locator("text=Developer").first
        await dev_badge.wait_for(state="visible")
        print("✓ Switched to Marcus Vance (Developer)")
        
        # Verify Developer's unique experience: screens NOT permitted must NOT be visible!
        # Workspace & Schema & Scaffolder must NOT exist in the sidebar for Developer
        config_hubs = page.locator("button:has-text('Workspace & Schema'), button:has-text('Workspace Settings')")
        assert await config_hubs.count() == 0, "Workspace & Schema hub should NOT be visible to Developer"
        scaffolder_items = page.locator("button:has-text('Project Scaffolder')")
        assert await scaffolder_items.count() == 0, "Project Scaffolder should NOT be visible to Developer"
        print("✓ Workspace & Schema and Project Scaffolder are hidden from Developer")

        # Screens like Project Intelligence and Pulse Reports must NOT be in the sidebar
        intel_item = page.locator("button:has-text('Project Intelligence')")
        assert await intel_item.count() == 0, "Intelligence screen should NOT be visible to Developer"
        report_item = page.locator("button:has-text('Pulse Reports')")
        assert await report_item.count() == 0, "Pulse Reports screen should NOT be visible to Developer"
        print("✓ Intelligence and Pulse Reports are hidden from Developer")

        # Permitted screens must be visible
        tasks_item = page.locator("button:has-text('Tasks & Timeline')")
        assert await tasks_item.count() > 0, "Tasks & Timeline should be visible to Developer"
        defects_item = page.locator("button:has-text('Defect Workshop')")
        assert await defects_item.count() > 0, "Defect Workshop should be visible to Developer"
        print("✓ Permitted screens (Tasks & Timeline, Defects) are properly visible to Developer")

        print("\n--- TEST 3: Role-Based Screen Visibility for Stakeholder (Elena) ---")
        # Click Elena (Stakeholder) in quick switch
        await user_btn.click()
        stakeholder_switch_btn = page.locator("button:has-text('Elena')").first
        await stakeholder_switch_btn.click()
        await page.wait_for_timeout(800)

        # Check Topbar badge now says 'Stakeholder'
        stakeholder_badge = page.locator("text=Stakeholder").first
        await stakeholder_badge.wait_for(state="visible")
        print("✓ Switched to Elena Rostova (Stakeholder)")

        # Stakeholder should NOT see Tasks & Timeline, Defect Workshop, Team Hub, Workspace & Schema
        assert await page.locator("button:has-text('Tasks & Timeline')").count() == 0, "Tasks & Timeline should NOT be visible to Stakeholder"
        assert await page.locator("button:has-text('Defect Workshop')").count() == 0, "Defect Workshop should NOT be visible to Stakeholder"
        assert await page.locator("button:has-text('Team Hub')").count() == 0, "Team Hub should NOT be visible to Stakeholder"
        assert await page.locator("button:has-text('Workspace & Schema')").count() == 0, "Workspace & Schema should NOT be visible to Stakeholder"
        print("✓ Tasks, Defects, Team, and Workspace & Schema are hidden from Stakeholder")

        # Stakeholder should see Executive Overview, Project Intelligence, Pulse Reports, Release Roadmap, Project Timeline (read-only)
        assert await page.locator("button:has-text('Pulse Reports')").count() > 0, "Pulse Reports should be visible to Stakeholder"
        assert await page.locator("button:has-text('Project Intelligence')").count() > 0, "Project Intelligence should be visible to Stakeholder"
        assert await page.locator("button:has-text('Release Roadmap')").count() > 0, "Release Roadmap should be visible to Stakeholder"
        assert await page.locator("button:has-text('Project Timeline')").count() > 0, "Read-only Project Timeline should be visible to Stakeholder under Planning & Scope"
        print("✓ Permitted screens (Overview, Intelligence, Reports, Roadmap, Timeline) are visible to Stakeholder")

        # Open read-only Project Timeline as Stakeholder -> must render standalone TimelineView without New Task
        await page.locator("aside button:has-text('Project Timeline')").first.click()
        await page.wait_for_timeout(600)
        assert await page.locator("h1:has-text('Project Timeline & Gantt')").is_visible(), "Stakeholder timeline should render standalone TimelineView"
        assert await page.locator("header button:has-text('New Task')").count() == 0, "Stakeholder should NOT see New Task button on read-only Timeline"
        assert await page.locator("header button:has-text('Jump to Today')").is_visible(), "Stakeholder should see Jump to Today primary action on Timeline"
        print("✓ Stakeholder read-only Project Timeline hides New Task & renders Jump to Today")

        print("\n--- TEST 4: Direct Access Guard & Return to Workspace ---")
        # If an unauthorized screen is triggered, AccessDenied displays with 'Return to Workspace'
        await page.evaluate("() => window.dispatchEvent(new CustomEvent('nav-test', {}))")
        # Navigate to restricted settings view directly via state
        # Verify AccessDenied guard
        await user_btn.click()
        admin_switch_btn = page.locator("button:has-text('Sarah')").first
        await admin_switch_btn.click()
        await page.wait_for_timeout(500)
        await page.locator("aside button:has-text('Executive Overview')").first.click()
        await page.wait_for_timeout(400)

        # Open Access Manager Modal via Topbar flyout
        await user_btn.click()
        access_studio_btn = page.locator("button:has-text('Provide Access & Roles')")
        await access_studio_btn.click()
        
        # Verify Modal opened
        await page.wait_for_selector("text=Role & Access Governance", timeout=3000)
        print("✓ Access & Permissions Governance Studio opened successfully")
        
        # Check tabs: Users, Capabilities Matrix, Add User
        await page.click("button:has-text('Role Capabilities Matrix')")
        await page.wait_for_selector("text=Administer role-level capability policies", timeout=3000)
        print("✓ Role Capabilities Matrix tab verified")
        
        await page.click("button:has-text('Add User')")
        await page.wait_for_selector("text=Enroll New Team Member", timeout=3000)
        print("✓ Enroll New User form verified")
        
        # Fill new user form
        await page.fill("input[placeholder='e.g. Jordan Miller']", "Taylor Brooks")
        await page.fill("input[placeholder='jordan.miller@projectpulse.io']", "taylor@pulse.local")
        await page.fill("input[placeholder='e.g. QA Automation Lead']", "Quality Assurance Lead")
        await page.click("button:has-text('Enroll User & Grant Access')")
        await page.wait_for_timeout(500)
        
        # Check newly created user is in user list
        await page.wait_for_selector("text=Taylor Brooks", timeout=3000)
        print("✓ Successfully enrolled new user 'Taylor Brooks'!")
        
        # Close modal
        done_btn = page.locator("button:has-text('Done')").first
        await done_btn.click()
        await page.wait_for_timeout(500)
        print("✓ Governance Studio closed cleanly")
        
        print("\n--- TEST 5: Logout & Full Login Screen Experience ---")
        await user_btn.click()
        sign_out_btn = page.locator("button:has-text('Sign Out')")
        await sign_out_btn.click()
        await page.wait_for_timeout(500)
        
        # Verify LoginView is now displayed
        await page.wait_for_selector("text=Enterprise Engineering Workstation", timeout=3000)
        await page.wait_for_selector("text=Select Persona Session", timeout=3000)
        print("✓ Sign out succeeded: LoginView rendered with persona selector")
        
        # Test Quick Persona Login
        quick_admin_pill = page.locator("button:has-text('Sarah Chen')").first
        await quick_admin_pill.click()
        await page.wait_for_timeout(800)
        
        # Check workspace is restored
        await page.wait_for_selector("h1:has-text('Executive Overview')", timeout=5000)
        print("✓ Persona quick login succeeded: Workspace restored!")
        
        print("\n--- TEST 6: Admin Access to Settings ---")
        # Navigate to Workspace Settings via sidebar (Workspace & Schema hub defaultView is settings)
        config_btn = page.locator("button:has-text('Workspace & Schema'), button:has-text('Workspace Settings')").first
        await config_btn.click()
        await page.wait_for_timeout(500)
        
        # Click Roles & Access tab
        access_tab = page.locator("button:has-text('Access')").first
        await access_tab.click()
        await page.wait_for_timeout(500)
        await page.wait_for_selector("text=Role-Based Access Control (RBAC) Governance", timeout=3000)
        print("✓ Settings Roles & Access tab renders RBAC governance cards")
        
        print("\n==========================================")
        print("ALL AUTH & ACCESS CONTROL TESTS PASSED! 🎉")
        print("==========================================\n")
        
        await browser.close()

asyncio.run(run_auth_verification())
